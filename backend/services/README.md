# 🧠 Documentação do Módulo Services

Este diretório contém a lógica neural e sensorial do J.A.R.V.I.S., orquestrando **Input (Audição)**, **Processamento Cognitivo (Cérebro)** e **Output (Fala)**.

## 📂 Estrutura de Arquivos

| Arquivo | Função | Principais Dependências |
|---|---|---|
| **`brain.py`** | Núcleo Cognitivo. Coordena o pipeline completo de comando — desde o input até o despacho para skill, chat ou memória. | `core`, `services/intent`, `services/chat`, `services/memory` |
| **`intent.py`** | Classificação de intenção via LLM (JSON mode) e verificação de skills habilitadas. | `core` (llm, database, skill_loader, prompts) |
| **`chat.py`** | Montagem do prompt LLM com histórico, vault context (system role) e telemetria live. Serve voz e chat. | `core` (state, llm, database, prompts, obsidian) |
| **`memory.py`** | Extração de fatos de falas do usuário e persistência no Obsidian vault. | `core` (llm, obsidian, prompts) |
| **`listen.py`** | Entrada sensorial. Captura de áudio, detecção de Wake Word e transcrição (STT). | `core`, `speech_recognition`, `re` |
| **`speak.py`** | Saída sensorial. Síntese de voz (TTS) híbrida com gerenciamento de concorrência (Thread-Safe). | `core`, `edge_tts`, `pygame`, `pyttsx3` |

---

## ⚙️ Fluxo de Dados (Pipeline)

```
listen.py           →  Captura áudio, detecta wake word, transcreve STT
brain.py            →  Coordena o pipeline
  intent.py         →  Classifica intenção via LLM (JSON mode)
  ├─ SKILL          →  Despacha para manager.skills[intent].execute(entity)
  ├─ HARDWARE       →  Injeta specs do SQLite → chat.py (temp=0.1)
  ├─ MEMORY_READ    →  get_vault_context() → chat.py com vault como system msg (temp=0.1)
  ├─ MEMORY_WRITE   →  memory.py → extrai fato → obsidian.save_memory()
  ├─ CHAT           →  chat.py (temp=0.7) com histórico de sessão
  └─ SHUTDOWN       →  retorna "PROTOCOL_SHUTDOWN"
speak.py            →  Síntese TTS → áudio + typewriter no terminal
```

---

## 1. `brain.py` (O Coordenador)

Ponto de entrada do processamento de comandos. Recebe o texto transcrito e orquestra todos os outros serviços.

- `execute_command(text, session_id)` → `str` — modo voz (síncrono)
- `execute_command_stream(text, session_id)` → `Generator[str]` — modo chat (streaming)
- `start_brain()` — inicializa varredura de hardware no boot

**Responsabilidades:**
- Chamar `intent.py` para classificar o comando
- Buscar vault context via `get_vault_context()` para intents MEMORY_READ
- Delegar execução para skill, `chat.py` ou `memory.py`
- Passar `intent_type` e `vault_context` para `chat.py`

---

## 2. `intent.py` (O Classificador)

Envia a frase do usuário para o Ollama em **JSON mode** e retorna a intenção estruturada.

**Intenções possíveis:**

| Intent | Trigger |
|---|---|
| `SHUTDOWN` | Pedido de encerramento |
| `HARDWARE` | Perguntas sobre specs, temperatura, uso de CPU/GPU |
| `MEMORY_READ` | Perguntas sobre fatos pessoais (família, trabalho, etc.) |
| `MEMORY_WRITE` | Pedido para gravar uma informação |
| `CHAT` | Conversa genérica |
| `<SKILL_NAME>` | Qualquer intent registrado em `manager.skills` |

- `classify_intent(text, skip_skills=False)` → `dict` com chaves `intent: str`, `entity: str | None`, `confidence: float`
- `is_skill_enabled(intent)` → `bool` — verifica se skill e sua categoria estão ativas no banco

---

## 3. `chat.py` (O Motor de Chat)

Monta e despacha o prompt para o LLM. Serve dois modos: **voz** (sem markdown) e **chat** (markdown completo).

### Estrutura do prompt montado:

```
[system] SYSTEM_PROMPT + regras de modo (áudio ou chat)
[system] instrução crítica MEMORY_READ ou HARDWARE (se aplicável)
[system] LIVE DATA: telemetria em tempo real
[system] [MEMÓRIA PESSOAL — arquivo.md]: conteúdo do vault  ← quando MEMORY_READ
[user]   mensagem anterior 1
[assistant] resposta anterior 1
...
[user]   mensagem atual
```

- **Vault como `role: system`** — evita que o modelo trate dados pessoais como "texto a analisar"
- **Temperatura dinâmica:** `0.1` para HARDWARE e MEMORY_READ; `0.7` para CHAT
- **Dedup de histórico:** `get_session_history_for_ai()` busca `limit+1` e descarta a última entrada `user` (já logada antes da chamada)

**Funções:**
- `ask_local_ai(text, intent_type, vault_context, vault_filename, session_id)` → `str`
- `ask_local_ai_stream(text, intent_type, vault_context, vault_filename, session_id)` → `Generator[str]`

---

## 4. `memory.py` (Gravação no Vault)

Detecta fatos em falas do usuário e persiste no Obsidian vault via `obsidian.save_memory()`.

- `extract_fact_to_memory(text)` → `str` — mensagem de confirmação ou erro
- Usa LLM com prompt `extract_fact.md` para identificar chave/valor do fato
- Grava em `Projetos/J.A.R.V.I.S/Memória/{key}.md` no vault

---

## 5. `listen.py` (Os Ouvidos)

Transcrição de áudio para texto (STT) com lógica de "Janela de Atenção".

- **Wake Words:** `jarvis`, `jar`, `jair`, `javis`, `davis`, `gervis`, `jarbas`, `garvis`, `jefferson`, `jorge`
- **Active Mode:** Timer de 60s após ouvir o nome — dispensa repetir "Jarvis"
- **Controle de Loop:** `ear_pause()` / `ear_resume()` — mudo enquanto JARVIS está falando
- **Calibração Automática:** ajusta limiar de ruído no primeiro segundo

---

## 6. `speak.py` (A Voz)

Síntese de voz (TTS) híbrida com thread safety.

**Arquitetura Failover:**
1. **Online (EdgeTTS):** `pt-BR-AntonioNeural` — alta qualidade
2. **Offline (Pyttsx3):** fallback local automático se EdgeTTS falhar

- **`speech_lock`:** `threading.Lock()` — impede sobreposição de falas (alerta vs. resposta)
- **Typewriter effect:** exibição no terminal em thread separada, sincronizada com áudio
- **Expansão de gírias:** `vc` → `você`, `tmj` → `tamo junto` (via Regex)
- **UUID temp files:** sem conflitos de arquivo no Windows
