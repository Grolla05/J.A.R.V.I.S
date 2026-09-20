# 📊 Skill: status_report.py

A skill `status_report.py` pertence à categoria **System**. Ela não atua apenas como uma resposta a comandos, ela engloba o `Boot Protocol` inteiro do sistema, gerando o sumário médico de hardware, rede e ambiência no instante em que o J.A.R.V.I.S é ligado.

## 📝 Contrato

- **INTENT**: `SYSTEM_REPORT`
- **PROMPT_TEXT**: Ativada para varreduras sistêmicas sempre que o usuário perguntar por "status", "checkup" ou "relatório de danos".

---

## ⚙️ Arquitetura e Engenharia Interna

O grande pilar arquitetural deste arquivo é: **Ele roda 100% livre da IA Generativa**.
Para garantir que o relatório de inicialização (Boot) ocorra na velocidade da luz sem esbarrar no *cold start* do modelo Ollama na placa de vídeo, a narrativa da fala do Jarvis é inteiramente codificada usando concatenação nativa de Arrays no Python (`status_phrases.append()`).

### 1. Georreferenciamento Autônomo e Caching (`get_weather_context`)

Diferente de sistemas amadores onde o usuário precisa configurar `"cidade": "São Paulo"` no código, o Jarvis caça o usuário ativamente:

- **Requisição de IP**: Ele faz um ping invisível na API `http://ip-api.com/json/`. O JSON devolvido revela a Latitude, Longitude e Cidade atreladas ao roteador do provedor de internet do usuário.
- **Dumping de Memória (Obsidian)**: Após a primeira detecção bem-sucedida, a skill parasita o módulo `core/obsidian.py` e crava essas chaves na memória física do cofre de anotações (`obsidian.save_memory("latitude", lat)`).
- **Session Caching**: No próximo boot da máquina, o script pula a chamada de internet e lê os dados direto das variáveis globais `_cached_lat`, poupando milissegundos e conexões HTTP de rede.
- **Fallback Estrito**: Se você levar seu PC para uma caverna sem internet e apagar os arquivos do Obsidian, o script absorve silenciosamente o erro geográfico e preenche as coordenadas em cache duro para a cidade de São Paulo (Lat `-23.5505`) para evitar telas azuis por variável vazia (`NoneType`).

### 2. O Analista Meteorológico e WMO Codes

Com as coordenadas garantidas, ele atinge a API aberta do *Open-Meteo*.

- O código mapeia as terríveis diretivas globais WMO (`weathercode`).
- A lógica matemática varre o índice: Se código for `> 80`, a *string* é trocada de "Céu limpo" para "Chuva forte". A narrativa injetada no Array de fala é: `"No ambiente externo: 22°C em {Sua Cidade} com chuva leve."`

### 3. O Avaliador de Sinais Vitais (Hardware Triage)

A skill consome o *Singleton* do `SystemInfo` montado na pasta `core` para ler os registradores em tempo real de Hardware.

- **Relógio Circadiano**: A função `get_time_greeting` lê a hora do kernel (`datetime.now()`). Se for entre meia-noite e 5 da manhã, o Jarvis quebra o protocolo comum e saúda o usuário com `"Madrugada produtiva, Senhor?"`
- **A Tabela de Limiares Cumulativos**: O sistema avalia três métricas simultâneas. Se todas passarem no teste de saúde, o Array final recebe: *"Todos os subsistemas operando dentro dos parâmetros nominais."*
- Se falharem, os alertas entram em uma fila e são condensados. Exemplo: Se CPU bater `> 80%` e a memória estiver a `> 90%` de lotação, o script acusa: *"Atenção: Detectado núcleo de processamento sobrecarregado e memória saturada."*
- Avalia até mesmo se a fonte externa de energia física (Cabo na tomada) está injetando energia na bateria do Laptop.

### 4. Diagnóstico de Link Neural

Finalizando o Array narrativo de inicialização, a skill executa uma varredura de PING (Latência externa de rede).
Se o ping do provedor não voltar ou estourar o limite de espera, o status emitido de forma fatalista é: *"Atenção: Link neural offline"*. Se houver internet, ele encerra informando a latência natural (Ex: *"Latência de conexão neural em 12ms"*).

---

## 🛠️ Manutenção e Boas Práticas (Developer Guide)

- **Política Estrita de Timeout em Boot**: Nunca, em nenhuma circunstância, remova o argumento `timeout=3` (ou `2.5`) das requisições web deste módulo. Como este arquivo gerencia o primeiro áudio que o J.A.R.V.I.S exala quando o Windows termina de carregar, qualquer bloqueio de rede ("Request Hanging") deixaria a IA completamente paralisada num loop de dezenas de segundos no silêncio aguardando o servidor *Open-Meteo* ou *IP-API* responderem. O *timeout* salva o sistema fazendo-o vomitar um `None` e avançando o texto omitindo partes irrelevantes para salvar o boot.
- **Injeção Dinâmica de Nomes**: O módulo lê a variável `apelido` do *Obsidian* para saudar o usuário no relatório. Se você compilar isso num servidor ou mudar o nome, e a chave não existir no cofre, o operador de contingência devolve o bom e velho `"Senhor"`.
