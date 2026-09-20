# 🗣️ speak.py (Voz e Sincronia)

O arquivo `speak.py` é o **Motor de Síntese de Voz (TTS - Text-To-Speech)**. Ele converte a resposta neural gerada pela LLM em ondas de áudio reproduzíveis e orgânicas, implementando pesadas camadas de proteção contra quebras de concorrência e falhas de internet, garantindo que o J.A.R.V.I.S nunca sofra de "mudez".

## 🎯 Responsabilidades Principais

1. **Voz Híbrida Inteligente (Failover Automático)**: Tenta utilizar primeiramente a biblioteca assíncrona `edge-tts` (A voz avançada neural da Microsoft em Nuvem). Se o PC estiver sem internet ou se a requisição retornar um arquivo `.mp3` corrompido, o sistema captura a exceção graciosamente e invoca de imediato o motor nativo offline do Windows `pyttsx3`.
2. **Thread-Safety (Bloqueio de Concorrência)**: Implementa um cadeado vital `speech_lock = threading.Lock()`. Sem ele, se o Jarvis estivesse no meio da recitação de uma resposta longa de chat e o *Monitor Proativo* de Hardware tentasse gritar um aviso urgente ("RAM lotada!"), as vozes se misturariam em uma cacofonia ininteligível. O lock garante que a nova fala entre em uma fila de espera ordenada.
3. **Efeito Visual no Terminal (`typewriter_effect`)**: O Jarvis não imprime textos de uma vez só na tela preta. Ele usa `sys.stdout.write` somado com `time.sleep(0.04)` para simular a digitação visual caractere a caractere (Typewriter), colorida nativamente via `colorama`. Essa thread visual roda em paralelo ao áudio.
4. **Higienização Fonética (`_treat_text`)**: Remove impiedosamente formatações Markdown (como asteriscos) e Emojis invisíveis que engasgam IA de voz. Também aplica tradução de gírias em massa.

---

## ⚙️ Arquitetura e Lógica Interna

### 1. Prevenção de Bloqueio no File System do Windows

O módulo `edge-tts` gera arquivos físicos `.mp3`. O Windows é notório por estourar `PermissionError: The process cannot access the file` se dois processos tentarem mexer no mesmo MP3, ou se tentar deletar um som que acabou de tocar.
Para mitigar isso:

- O módulo utiliza UUID para gerar arquivos completamente únicos a cada fala (`f"audio_{uuid.uuid4().hex}.mp3"`).
- Ao terminar o loop do `pygame.mixer`, ele descarrega expressamente o mixer da memória (`pygame.mixer.music.unload()`) antes de dar o comando `os.remove(filename_str)`.

### 2. A Validação Estrita de Integridade do MP3

Um grande bug que ocorria antes: às vezes o `edge-tts` baixava o arquivo e conectava com sucesso, mas a Microsoft devolvia um payload de 0 bytes. O Pygame crasheava por tentar tocar o vazio.
Para blindar o sistema, a linha `os.path.getsize(filename_str) < 100` foi inserida logo após a geração. Se o MP3 vier minúsculo, ele levanta intencionalmente um Erro para engatilhar o Fallback Offline.

### 3. A Injeção de Callback de Sincronia (`on_play`)

O `speak.py` recebe um parâmetro de função extra: `speak(text, play_callback=None)`.
O método `on_play()` só é chamado um milissegundo **após** a instrução `pygame.mixer.music.play()`. Isso é essencial para a Interface Web (React): é esse callback que viaja até o Frontend alterando o HUD para o modo `SPEAKING`, fazendo com que a onda sonora visual da interface brilhe perfeitamente na hora que o áudio sai da caixa de som física.

### 4. Tratamento do Mapa de Gírias (Regex de Expansão)

Motores de síntese tentam ler siglas como se fossem siglas. "vc" soaria robotizado como "Vê Cê".
Para evitar o trabalho do motor neural de IA consertar gramática nas respostas rápidas, o dicionário `SLANG_MAP` intercepta as saídas da IA via expressão regular. De `\bvc\b` vira "você", e `\bpq\b` vira "porque".

---

## 🛠️ Manutenção e Boas Práticas (Developer Guide)

- **Cuidado Máximo com a Fila Bloqueante (Deadlocks)**: A função `speak()` prende inteiramente a *Thread* de quem a invocou enquanto a música do Pygame não atingir 100% de playback. Se você codificar uma skill que exija processamento paralelo extenso e usar o comando `speak()` no meio, você pausará o processamento em prol da voz.
- **Ampliação do Dicionário Fonético**: Se, ao longo do uso, a LLM local adotar a prática de falar novas siglas irritantes como "p/ vc" ou "abs", você deve abrir o `SLANG_MAP` e inserir o seu mapeamento fonético `r"\bp/\b": "para"`.
- **Desativação de Fallback em Ambientes Controlados**: A biblioteca de contingência `pyttsx3` consome processamento e gera inicializações de objetos COM no Windows (`engine_offline = pyttsx3.init()`). Caso vá utilizar o servidor num local confinado sem placas de áudio virtuais rodando, garanta que os drivers padrões de mídia do Windows Server estejam ativos para a engine offline não gerar exceção já no topo do arquivo.
