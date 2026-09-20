# 🔊 Skill: audio_control.py

A skill `audio_control.py` atua como o controlador de áudio mestre na categoria **Automation**. Diferente de atalhos de teclado simulados que falham constantemente, esta arquitetura manipula a Interface **Core Audio API** do kernel do Windows de forma nativa e matemática.

## 📝 Contrato

- **INTENT**: `AUDIO_CONTROL`
- **PROMPT_TEXT**: Gatilho injetado no cérebro central para que o JARVIS direcione o fluxo para cá sempre que o usuário der comandos envolvendo aumentar, diminuir, mutar ou solicitar níveis de som.

---

## ⚙️ Arquitetura e Lógica Interna

### 1. Sub-Agente Neural de Interpretação (`_ask_ollama_audio_expert`)

A manipulação de áudio via linguagem natural é complexa. Dizer *"Aumenta o volume para 50"* é uma sobreposição absoluta, enquanto *"Aumenta o volume MAIS 50"* é matemática relativa.

- A skill delega a leitura da frase a um Sub-Agente via chamada direta de API (`requests.post(OLLAMA_HOST)`).
- Usa o prompt `AUDIO_DECISION_PROMPT` estruturado em 4 silos lógicos estritos que forçam a LLM a retornar JSON puro (`format="json"`, Temperatura: `0.1`):
  1. **Silêncio/Retorno**: "Cala a boca" -> `{"action": "mute"}`
  2. **Definição Exata**: "Volume no Máximo" -> `{"action": "set", "value": 100}`
  3. **Ajuste Relativo**: "Tá muito alto" -> `{"action": "decrease", "value": 30}`
  4. **Informação Diagnóstica**: "Quanto tá o áudio?" -> `{"action": "info"}`

### 2. Manipulação de Kernel (Windows Core Audio)

O código abandona automação de GUI e se acopla direto ao hardware usando a biblioteca `pycaw`.

- A função `get_audio_interface()` extrai o Endpoint Padrão de saída de áudio (`GetDefaultAudioEndpoint`). Isso significa que se o usuário plugar um Headset Bluetooth no meio da execução, o J.A.R.V.I.S ainda vai controlar o dispositivo correto.

### 3. Fading Cinematográfico (`smooth_set_volume`)

Pulos abruptos de *driver* de áudio (Ex: Subir de 10% para 100% num milissegundo) geram o temido "Audio Popping" (estalos nos alto-falantes) que danificam periféricos.

- O J.A.R.V.I.S anula isso executando uma transição em rampa matemática.
- O delta (diferença entre o volume atual e o desejado) é quebrado em `steps = 5`. O motor incrementa o valor e invoca `time.sleep(0.02)` entre os passos. O resultado é um *Fade-In/Fade-Out* elegante digno de cinema.
- **Otimização Pragmática**: Se o usuário pedir para mudar o volume e o delta for menor que `0.05` (5%), o sistema anula a rampa de *fade* e engata o volume de imediato para não desperdiçar ciclos de CPU atoa.

### 4. Proteção contra Transbordamento (`max`/`min`)

A API nativa de áudio do Windows exige matrizes de Ponto Flutuante (Float) estritamente entre `0.0` (0%) e `1.0` (100%). Se um cálculo do J.A.R.V.I.S pedir `1.1`, a máquina *crasha* na hora. O código injeta *Clamping* matemático constante: `max(0.0, min(1.0, current))` antes de encostar nos registradores da placa-mãe.

---

## 🛠️ Manutenção e Boas Práticas (Developer Guide)

- **Obrigatoriedade do COM Object (`CoInitialize`)**: A interface *Core Audio* pertence ao arcaico modelo COM da Microsoft. Trabalhar com Threads no Python corrompe a memória desses objetos e explode em `Access Violation Crashes`. Se você for editar o fluxo principal do `execute()`, garanta sob pena de morte do servidor que o bloco de execução inicie sempre invocando a função CType `CoInitialize()` e termine incondicionalmente limpando o lixo da memória executando `CoUninitialize()` dentro do bloco `finally`.
- **Atenção à Interface Limpa**: A função utilitária `get_audio_interface()` foi montada com o dever de apenas resgatar o ponteiro do volume `cast(volume, POINTER(IAudioEndpointVolume))`. Nunca enfie `CoInitialize` lá dentro, do contrário cada salto do loop do *Fading* vazará inicializações do Windows na RAM, levando a *Memory Leaks* em poucas horas de uso.
- **Personalidade no Retorno**: Para preservar o arquétipo do Tony Stark, qualquer ação gerada devolve confirmações táticas (Ex: Se for 100%, ele responderá com `"Potência máxima estabelecida. Cuidado com os ouvidos, senhor."`). Mantenha os retornos nesse tom.
