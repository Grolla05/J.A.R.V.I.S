# Chat Mode — Multimodalidade (imagem + áudio)

> Plano de implementação. Status: **aguardando aprovação**.
> Branch: `Grolla` · Data: 2026-08-07 · Revisão 2 (riscos #8-#11, "texto efetivo", fronteira de fases)

---

## Contexto

O modo Chat do J.A.R.V.I.S. hoje é texto puro. O frontend já **finge** suportar anexo: `frontend/src/components/CHAT/ChatInput.jsx:52-60` tem um `<input type="file" multiple>` funcional e `FileChip.jsx` renderiza o chip com glow por MIME — mas `frontend/src/components/ChatPanel.jsx:267-280` **descarta o objeto `File`** e guarda só o nome, e `ChatPanel.jsx:306` chama `callApi("chat_message", text, currentSessionId)` sem os anexos. A UI existe, o transporte não.

Objetivo: fechar esse circuito nas duas modalidades.

- **Imagem** → modelo multimodal local via Ollama. Arrastar/colar screenshot e perguntar *"descreve o erro nessa screenshot"*.
- **Áudio** → Whisper local transcreve; o texto entra no chat e segue o pipeline normal.

### Restrição de hardware (medida, não estimada)

Tabela `hardware` do SQLite + `ollama list`:

```
CPU    Intel i7-4790 @ 3.60GHz (Haswell, 4c/8t, 2014)
RAM    16.0 GB
GPU    NVIDIA GeForce GTX 1650  →  4 GB VRAM
Disco  [C:] 39 GB livres | [D:] 421 GB livres
Ollama 0.32.6  —  único modelo: gemma2:2b (1.6 GB)
```

O `.env` usa `OLLAMA_MODEL=gemma2:2b`, não `llama3`. Os 4 GB de VRAM eliminam `llava:13b`, `llama3.2-vision:11b` e, na prática, `llava:7b` (4.7 GB → offload pro CPU de 2014 → 60-150 s até o 1º token). Os 39 GB livres em C: importam: modelos do Ollama vivem em `%USERPROFILE%\.ollama`.

### Decisões travadas

| Decisão | Escolha | Razão |
|---|---|---|
| Modelo de visão | `qwen2.5vl:3b` (~3.2 GB q4) | Resolução dinâmica nativa → único VLM ≤4B que lê stack trace. Cabe na VRAM |
| Whisper | `faster-whisper`, modelo `small`, `cpu`/`int8` | Zero torch. Wheels do `av` embutem FFmpeg → mp3/m4a/webm sem binário externo |
| Transporte do binário | `upload_attachment` separado, **não** base64 dentro de `chat_message` | Whisper começa no drop, não no Enter |
| Payload > 1 MB | fatiado em `upload_attachment_chunk` de 512 KB | Ver risco #8 |
| Imagens por mensagem | **1** (`MAX_IMAGES_PER_MESSAGE`) | 2 imagens = 2000+ tokens visuais + KV cache em 4 GB de VRAM → thrashing |
| Duração máx. de áudio | **300 s** (`MAX_AUDIO_SECONDS`) | `small`/int8 em Haswell roda perto de 1× tempo real: 5 min de áudio ≈ 5 min de espera. Acima disso a UX morre |
| Contexto de imagem | **só o turno atual** | Ver risco #9 |
| Gravação de voz no chat | **Python** (`sr.Microphone` + PyAudio), não `MediaRecorder` | Ver risco #1 |
| Escopo extra aprovado | drag-and-drop, colar Ctrl+V, botão de gravar, transcrição visível na bolha | — |

---

## Riscos que moldam o desenho

**1. WebView2 não tem handler de permissão.** `webview/platforms/edgechromium.py` (pywebview instalado) não registra `PermissionRequested` em lugar nenhum — grep confirmou zero ocorrências. `getUserMedia`/`MediaRecorder` numa origem `file://` dentro do WebView2 é aposta não verificável sem rodar. **Mitigação:** gravar no backend. `PyAudio` e `SpeechRecognition` já são dependências; `sr.Microphone` já é usado em `services/listen.py:10`. Elimina permissão de WebView2, codec webm e secure-context de uma vez, e reusa `settings.MIC_INDEX`. **Obrigatório:** `ear_pause()` durante a gravação, senão o loop de wake word disputa o mesmo device.

**2. `evaluate_js` é síncrono e bloqueia a UI thread** (`webview.Invoke` + `Semaphore.acquire()`), e `on_script_notify` roda **na** UI thread com dois `json.loads` sobre o payload inteiro. Mandar 5 MB de base64 no Enter engasga os chunks de streaming em voo. **Mitigação:** reencodar a imagem no `<canvas>` do frontend (aresta longa ≤ 1920 px) antes do base64 — screenshot típica cai para 200-800 KB, hitch < 50 ms. Bônus: elimina Pillow do backend e normaliza qualquer formato.

**3. O cliente `ollama` 0.6.2 aceita `Path` em `images`** (`ollama/_types.py`, `Image.serialize_model`) — **passar o caminho absoluto basta**: nenhum base64 no nosso código. O `serialize_model` ainda faz `b64encode(Path.read_bytes())` internamente, então o payload existe na memória do processo por um instante; o ganho é não duplicá-lo do nosso lado nem carregá-lo por toda a cadeia. Armadilha: se o path não existir e não terminar em `.png/.jpg/.jpeg/.webp`, cai num `b64decode` sem `validate=True` e manda lixo pro modelo **sem erro**. Sempre `Path(p).is_file()` antes de montar a mensagem.

**4. Eviction de VRAM.** Carregar o VLM (3.2 GB) expulsa o `gemma2:2b` e mata o ganho do `warm_up_ollama`. **Mitigação:** `OLLAMA_VISION_KEEP_ALIVE=0` (descarrega após a resposta) + re-warm assíncrono ao fim do stream de visão, enquanto o usuário lê. Não usar `OLLAMA_MAX_LOADED_MODELS=2` (1.6 + 3.2 = 4.8 GB > 4 GB → thrashing).

**5. Soltar arquivo fora do input navega o WebView2** para o arquivo — o app se substitui pela imagem. Precisa de `preventDefault` global em `dragover`/`drop` no `window`.

**6. Nenhum caller passa `timeout`.** `_get_client(timeout)` aceita o parâmetro, mas cai em `timeout or 120` (`llm.py:16`), e `query_ollama_stream` — que já expõe `timeout` na assinatura — nunca é chamado com ele. O prefill da imagem conta contra o read timeout do httpx. Precisa de `TIMEOUT_VISION=300` plumbado ponta a ponta (correção grátis: o param já existe).

**7. Nenhum teste pode importar `services.brain`:** ele roda `scan_system_hardware()` no import (`brain.py:19`) e importa `listen.py:121`, que instancia `Ear()` e abre o microfone no import. O helper de roteamento vai em `services/chat.py`; `brain.py` só o chama. Pela mesma razão, `core/bridge.py` importa `services.recorder` e `services.transcribe` **dentro** das funções, nunca no topo.

**8. Áudio não tem `<canvas>`.** O risco #2 é resolvido para imagem porque o frontend reencoda antes de mandar. Áudio é opaco: um mp3 de 8 MB vira ~10,7 MB de base64 pelo **mesmo** `on_script_notify` síncrono que o risco #2 condena. **Mitigação:** qualquer payload acima de `UPLOAD_CHUNK_KB` (1 MB) vai fatiado — `upload_attachment_begin(name, mime, total_bytes)` → N × `upload_attachment_chunk(id, seq, b64)` de 512 KB → `upload_attachment_end(id)`. Cada fatia é um hitch de poucos ms na UI thread em vez de um congelamento único. O buffer vive no `AttachmentStore`, é escrito em disco a cada fatia (nada de acumular 8 MB de string em RAM) e um `begin` sem `end` é varrido pelo `prune`. Imagem reencodada quase sempre fica abaixo do teto e segue no caminho de tiro único — o fatiado é o mesmo código, só com N=1.

**9. `get_session_history_for_ai` só lê `content`** (`chat.py:20-24`, `SELECT role, content`). Se a transcrição e a imagem viverem apenas na coluna nova `attachments`, o turno seguinte (*"e o que mais tem nessa imagem?"*) chega ao modelo sem nada. **Mitigação:** o que é logado em `content` é o **texto efetivo** (ver "Texto efetivo" abaixo), não o texto cru digitado — a transcrição inteira entra no histórico como texto comum e o histórico continua funcionando sem tocar na query. Para imagem, o texto efetivo carrega uma linha-âncora `[imagem anexada: <nome>]`; o **bitmap não é reenviado em turnos seguintes** (2 imagens não cabem nos 4 GB de VRAM). Follow-up de imagem responde sobre a descrição que o próprio VLM já produziu e está no histórico — decisão consciente, não omissão.

**10. Transcrição não é cancelável.** `faster_whisper.transcribe()` não tem ponto de interrupção, e no Windows dar `unlink` num arquivo que o worker ainda lê levanta `PermissionError`. `discard_attachment` durante o "transcrevendo…" portanto **não** mata a thread: marca `discarded=True` no registro, o worker checa a flag antes de persistir e descarta o resultado, e o unlink acontece no `finally` do worker (ou no `prune`, se o unlink falhar). O chip some da UI na hora — só o arquivo é que espera.

**11. Anexo pode não existir mais.** `prune` apaga por retenção e por teto de disco; o usuário também pode apagar o diretório na mão. O guard `Path(p).is_file()` do risco #3 evita mandar lixo ao modelo, mas sozinho **some com a imagem em silêncio**. Contrato: `path_of` devolvendo `None` para um id referenciado no histórico vira `status:"expired"` no chip (ícone apagado, `title` explicando) e, se for o anexo da mensagem sendo regenerada, `ask_vision_stream` aborta com mensagem explícita em vez de responder sobre nada.

---

## Arquitetura

### Fluxo — imagem

```
drop/paste/picker  (máx. 1 imagem por mensagem)
  → utils/attachments.js: createImageBitmap → canvas ≤1920px → base64 + thumb 96px
  → uploadBinary(): 1 tiro se ≤1 MB, senão begin/chunk/end de 512 KB   [risco #8]
  → AttachmentStore.save() → backend/attachments/YYYY-MM/<id>.png
  ← {id, kind:"image", thumb, status:"ready"}
  → Enter → callApi("chat_message", text, sessionId, [ids])
  → bridge: chat.build_attachment_payload() → (image_paths, texto efetivo)
  → log_interaction("user", texto efetivo, …, attachments=json)
  → brain(image_paths≠[]): PULA classify_intent + PULA get_vault_context
  → chat.ask_vision_stream(): prompt curto + {'role':'user','images':[<path abs>]}
  → query_ollama_stream(model=VISION_MODEL, keep_alive=0, timeout=300)
  → re-warm do gemma2:2b em thread daemon
```

### Fluxo — áudio

```
drop/picker/gravação
  → uploadBinary() (quase sempre fatiado) | gravação: bytes já nascem no Python
  → upload_attachment_end  ← {id, kind:"audio", status:"processing"}   [retorna já]
  → thread daemon: transcribe.transcribe_file(path)
        probe av.duration > MAX_AUDIO_SECONDS → status:"error", nunca transcreve
  → window.receiveAttachmentUpdate({id, status:"ready", transcript, duration})
  → chip sai do spinner; botão de enviar destrava
  → Enter → bridge: build_attachment_payload() → texto efetivo COM a transcrição
  → brain(image_paths=[]): pipeline NORMAL (classify_intent + RAG) sobre o texto efetivo
```

### Texto efetivo — quem monta, e quando

Ponto único de falha do desenho anterior, agora explícito. A transcrição **tem** que estar no texto **antes** do `classify_intent` — um áudio dizendo *"Jarvis, guarda que meu irmão chama X"* precisa cair em `MEMORY_WRITE`, e `classify_intent(command)` (`brain.py:76`) recebe exatamente o que o `bridge` mandar. Se o `bridge` mandar o texto digitado (vazio, no caso de áudio sem legenda), a classificação é sobre string vazia e o `extract_fact_to_memory(command)` recebe nada.

Logo, a substituição acontece **no `bridge`, antes de tudo**, e `brain` nunca vê o texto cru:

```python
# core/bridge.py — chat_message
image_paths, effective_text = chat.build_attachment_payload(text, attachment_ids)
db.log_interaction("user", effective_text, session_id, attachments=att_json)
for chunk in execute_command_stream(effective_text, session_id, image_paths=image_paths):
    ...
```

```python
# services/brain.py — assinatura nova; image_paths, não attachments
def execute_command_stream(command, session_id='default', image_paths=None):
    if image_paths:
        yield from ask_vision_stream(command, image_paths, session_id)
        return
    decision = classify_intent(command, skip_skills=True)   # brain.py:76 daqui pra baixo, intacto
```

`brain` fica burro de propósito: um `if` sobre uma lista de paths. O predicado, o teto de imagens, o guard `is_file()` e a renderização do template moram em `chat.build_attachment_payload` — testável sem importar `brain` (risco #7).

`build_attachment_payload(text, attachment_ids) -> (image_paths, effective_text)`:

| Anexo | `effective_text` | `image_paths` |
|---|---|---|
| nenhum | `text` inalterado — **byte a byte** | `[]` |
| imagem | `text` + `\n[imagem anexada: <nome>]` | `[path]`, capado em `MAX_IMAGES_PER_MESSAGE` |
| áudio | `load_prompt("audio_transcript.md", user_text=…, filename=…, transcript=…)` | `[]` |
| imagem + áudio | ambos | `[path]` |
| id expirado/ausente | `text` + `\n[anexo indisponível: <nome>]` | `[]` (risco #11) |

O `effective_text` é **um só** — é o que vai pro log, pro `classify_intent`, pro prompt e pro histórico do turno seguinte. Isso é o que fecha o risco #9 sem tocar em `get_session_history_for_ai`.

### Por que a visão pula o pipeline

`classify_intent` custa um round-trip completo ao Ollama cujo output (HARDWARE/MEMORY_*/CHAT) não significa nada para "descreve esse erro" — e pior, força carregar o `gemma2:2b` segundos antes de evictá-lo. `get_vault_context` dispara `asyncio.run(stdio_client(...))` → subprocesso `uvx mcp-obsidian` por chamada; uma screenshot não tem chance útil de casar com nota do vault.

Também **não** mandar o `system_prompt.md` inteiro nem o bloco `LIVE DATA`: um VLM de 3B degrada com preâmbulo de persona longo, e a imagem já consome 1000+ tokens visuais. Só `vision_analysis.md` (persona em 3 linhas) + no máximo 2 turnos de histórico.

---

## Fases

### Fase 0 — Validação (sem código)

```powershell
ollama pull qwen2.5vl:3b
ollama run qwen2.5vl:3b "descreve o erro nessa imagem" .\screenshot_erro.png
```

**Critério de saída:** lê o stack trace corretamente em < 90 s. Se falhar, cair para `llava-phi3` (~2.9 GB) — a escolha é uma variável do `.env`, não código.

### Fase 1 — Núcleo backend (sem UI, tudo testável)

**`core/config.py`** — novos atributos na classe `Settings` (regra: nenhum `os.getenv` fora deste arquivo):

```python
OLLAMA_VISION_MODEL: str = os.getenv("OLLAMA_VISION_MODEL", "qwen2.5vl:3b")
OLLAMA_VISION_KEEP_ALIVE          # mesma normalização de _KEEP_ALIVE_RAW (config.py:40-41), default "0"
TIMEOUT_VISION: int = 300
DIR_ATTACHMENTS = BACKEND_DIR / "attachments"
DIR_MODELS      = BACKEND_DIR / "models"
MAX_ATTACHMENT_MB: int = 8
MAX_AUDIO_SECONDS: int = 300          # teto de duração, não de bytes — o gargalo é a CPU
MAX_IMAGES_PER_MESSAGE: int = 1
UPLOAD_CHUNK_KB: int = 512            # acima de 2× isso, o upload vai fatiado (risco #8)
ATTACHMENT_RETENTION_DAYS: int = 30
ATTACHMENT_DISK_CAP_MB: int = 512
WHISPER_MODEL / WHISPER_DEVICE / WHISPER_COMPUTE_TYPE   # "small" / "cpu" / "int8"
```

Os dois novos dirs entram em `create_dirs()`.

**Fonte única dos limites.** `MAX_ATTACHMENT_MB`, `UPLOAD_CHUNK_KB` e a allowlist de MIME existem nos dois lados da ponte. Em vez de duplicar constantes que vão divergir na primeira mudança, `core/bridge.py` ganha `get_upload_limits()` devolvendo `{max_mb, chunk_kb, accepted_mime, max_images, max_audio_seconds}`; `utils/attachments.js` busca uma vez no mount e guarda em módulo, com um default embutido só para o `npm run dev` sem Python. Python continua sendo o dono da regra — o JS valida cedo por UX, o backend valida de novo por segurança.

**`core/llm.py`** — dois params opcionais em `query_ollama` **e** `query_ollama_stream`; nenhuma chamada existente quebra:

```python
def query_ollama_stream(messages, temperature=0.7, timeout=None, model=None, keep_alive=None):
    response = client.chat(
        model=model or settings.OLLAMA_MODEL,
        keep_alive=settings.OLLAMA_KEEP_ALIVE if keep_alive is None else keep_alive,
        ...
    )
```

> Obrigatório `keep_alive is None`, **não** `keep_alive or settings...` — `0` é falsy e é exatamente o valor que queremos. O campo `images` não exige nada aqui: `messages` já é repassado cru e o pydantic do `ollama` parseia a chave.

**`core/attachments.py`** (novo) — `AttachmentStore` singleton: `save`, `begin`/`write_chunk`/`end`, `get`, `path_of`, `set_transcript`, `set_status`, `discard`, `is_discarded`, `to_history_json`, `prune`. Reusa o `TTLCache` de `core/utils.py:6` para o índice de pendentes.

O caminho fatiado (risco #8) não acumula string: `begin` abre o arquivo em `.part` e guarda o handle; `write_chunk(id, seq, b64)` valida a sequência (fora de ordem = erro, não buraco silencioso), `b64decode(..., validate=True)` e escreve direto; `end` fecha, confere o tamanho contra o `total_bytes` declarado e renomeia para o nome final. `.part` órfão é lixo por definição — o `prune` varre. O caminho de tiro único é `begin`+`write_chunk`+`end` numa chamada só, então existe **um** código de escrita, não dois.

`discard` respeita o risco #10: marca `discarded=True`, responde na hora e deixa o unlink para o `finally` do worker. `is_discarded(id)` é o que o `_transcribe_worker` consulta antes de persistir a transcrição.

Path traversal morto na raiz — **o nome do cliente nunca vira componente de path**:

```python
att_id = secrets.token_urlsafe(16)                 # alfabeto [A-Za-z0-9_-] apenas
ext    = _MIME_EXT[mime]                           # allowlist, NÃO derivado do filename
path   = settings.DIR_ATTACHMENTS / yyyy_mm / f"{att_id}{ext}"
```

`_MIME_EXT` cobre `image/png|jpeg|webp` e `audio/wav|mpeg|mp4|x-m4a|webm|ogg`. Nome original vive só como metadado. Cinto e suspensório: `resolve()` guard contra `DIR_ATTACHMENTS.resolve()`, e `att_id` validado contra `^[A-Za-z0-9_-]{8,64}$` antes de qualquer glob. `path_of` resolve por disco (`glob(f"*/{att_id}.*")`), não por índice em memória — assim regenerar uma resposta com imagem funciona depois de reiniciar o app.

**`core/database.py`** — coluna `attachments TEXT` (JSON, nullable) na tabela `history`, no idioma de migração já existente (`database.py:92-104`), inserida **antes** do `CREATE INDEX`; o `CREATE TABLE IF NOT EXISTS` também ganha a coluna para bancos novos. `log_interaction(role, content, session_id='default', attachments=None)` — retrocompatível com a chamada posicional de `main.py:83`. `delete_history_from` passa a **devolver os ids órfãos** para unlink (senão editar/regenerar vaza arquivo para sempre).

`get_session_history_for_ai` (`chat.py:13-43`) **não muda**: o `content` gravado já é o texto efetivo, transcrição inclusa (risco #9). A coluna `attachments` serve à UI (thumb, chip, status) e ao regenerate — não ao prompt.

### Fase 2 — Visão fim-a-fim

> Fronteira da fase: no fim da Fase 2 o app **roda inteiro**. Nada de UI chamando método que só nasce depois — tudo que é áudio (chip "transcrevendo…", botão de mic, mocks de áudio) mora na Fase 3, junto do backend que atende.

**`backend/prompts/vision_analysis.md`** (novo; regra: nenhum prompt hardcoded em `.py`). Usa `$user_text`, com instrução padrão embutida para quando vier vazio — imagem sem legenda é o caso comum de Ctrl+V, e o VLM precisa de um pedido explícito ("descreva o conteúdo, transcreva qualquer texto visível") em vez de string nua.

**`services/chat.py`** — extrair `_build_sys_instruction()` / `_build_messages()`, o que elimina as ~35 linhas duplicadas entre `chat.py:46-86` e `chat.py:89-125`, e adicionar:

- `ask_vision_stream(text, image_paths, session_id)` — prompt curto, histórico capado em 2 turnos, `model=settings.OLLAMA_VISION_MODEL`, `keep_alive=settings.OLLAMA_VISION_KEEP_ALIVE`, `timeout=settings.TIMEOUT_VISION`. Path ausente → erro explícito, não silêncio (risco #11).
- `build_attachment_payload(text, attachment_ids) -> (image_paths, effective_text)` — tabela em "Texto efetivo". O predicado, o teto `MAX_IMAGES_PER_MESSAGE` e o guard `is_file()` moram **aqui**, não em `brain.py` (risco #7). Na Fase 2 o ramo de áudio ainda não existe; a assinatura já nasce pronta para ele.

**`services/brain.py`** — `execute_command_stream(command, session_id='default', image_paths=None)`; `if image_paths:` desvia para `ask_vision_stream` **antes** do `classify_intent` de `brain.py:76`. `brain` não conhece `AttachmentStore`, não monta texto e não vê ids.

**`core/bridge.py`** — `get_upload_limits()`, `upload_attachment(name, mime, data_b64, thumb=None)`, `upload_attachment_begin/chunk/end`, `discard_attachment(id)`, `_push_attachment_update(payload)`; `chat_message(self, text, session_id, attachment_ids=None)` chamando `build_attachment_payload` antes do log (ver "Texto efetivo"); `get_chat_history` devolve `attachments`; re-warm pós-visão.

O push usa `json.dumps`, **não** interpolação com `escape_js` — é o padrão já provado no `_telemetry_loop` (`bridge.py:100-103`), e `ensure_ascii=True` elimina a classe inteira de bug de escaping:

```python
js = f"if(window.receiveAttachmentUpdate){{window.receiveAttachmentUpdate({json.dumps(payload)})}}"
```

> `webview/js/api.js` gera o corpo com `Array.prototype.slice.call(arguments)`, não parâmetros nomeados — logo `chat_message` com um 4º param opcional é retrocompatível com chamadas de 2 args.

**`frontend/src/utils/attachments.js`** (novo) — `limits()` (cache de `get_upload_limits`, com default para `npm run dev`), `kindOf`, `prepareImage`, `prepareAudio`, `prepareFile`, `uploadBinary`. `uploadBinary(meta, b64)` é o único caminho de transporte: ≤1 MB manda em `upload_attachment`, acima disso faz `begin` → N × `chunk` de 512 KB → `end`, cedendo a thread entre fatias (`await new Promise(r => setTimeout(r, 0))`) para o React repintar o progresso. `prepareImage` usa `createImageBitmap(file)` (decodifica **fora** da main thread — decodificar um PNG 4K nela custa 100 ms+), depois `OffscreenCanvas` (fallback `<canvas>`) → `convertToBlob`/`toBlob` → `readAsDataURL` → `.split(",")[1]`. Mantém **PNG** quando a origem é PNG (screenshot: texto crispo), JPEG q0.85 no resto. Gera também o thumb 96 px JPEG q0.6 (3-6 KB) que é persistido no JSON da coluna — assim o reload mostra a miniatura sem round-trip nem `file://`.

**`ChatInput.jsx`** — `onDragEnter`/`Over`/`Leave`/`Drop` no container externo, com **contador em `useRef`** no dragleave (senão pisca ao passar sobre filhos); `onPaste` no `<textarea>` varrendo `clipboardData.items` por `kind === "file"` (Win+Shift+S deposita `image/png`), com `preventDefault()` só quando achou arquivo; overlay de drag em `AnimatePresence` + spring, `rgba(${accent},0.10)` + `backdrop-filter: blur(8px)` (zero hexadecimal — `accent` já chega por prop); `accept` de `*/*` para `image/png,image/jpeg,image/webp,audio/*`. (O botão de gravar entra na Fase 3.)

**`ChatPanel.jsx`** — `handleFilesPicked` substitui o corpo de `handleFileChange`; `useEffect` registrando `window.receiveAttachmentUpdate` com cleanup, espelhando o de `receiveChatStream` (`ChatPanel.jsx:222-264`); `handleSend` passa `attachedFiles.map(f => f.id)`; `handleRemoveFile` também chama `discard_attachment`; `preventDefault` global de `dragover`/`drop` no `window` (risco #5).

> **Fácil de esquecer:** `handleEditMessage` (`ChatPanel.jsx:169`) e `handleRegenerateMessage` (`ChatPanel.jsx:206`) chamam `chat_message` com 2 args. Precisam passar `msg.attachments?.map(a => a.id) ?? []`, senão regenerar uma resposta sobre imagem perde a imagem.

**`FileChip.jsx`** — o componente recebe `file`, então o estado chega como **`file.status`** (não como prop nova solta) — `getFileStyle` continua dando `icon`/`glow`. Com `file.thumb`, `<img>` 20×20 arredondado no lugar do emoji. `status:"error"` troca o `glow` para `239,68,68` e põe a mensagem no `title`; `status:"expired"` (risco #11) usa `opacity-50` e `title` explicando que o arquivo foi removido pela retenção. (`status:"processing"` é da Fase 3.)

**`BridgeAPI.js`** — cláusulas em `getMockFallback` para `get_upload_limits`, `upload_attachment`, `upload_attachment_begin/chunk/end` e `discard_attachment`.

### Fase 3 — Áudio / Whisper

> Backend e UI de áudio entram **juntos**: no fim desta fase não existe botão sem método atrás.

**`requirements.txt`** — `faster-whisper` (comentar as transitivas: `ctranslate2`, `av`, `onnxruntime`, `tokenizers`, `numpy`; ~150-250 MB, **zero torch**).

**`backend/prompts/audio_transcript.md`** (novo) — `$user_text` / `$filename` / `$transcript`, com instrução padrão embutida para quando `user_text` vier vazio. É o template que vira o **texto efetivo** do turno (logo, também o que fica no histórico — verbosidade aceita conscientemente em troca do risco #9 fechado).

**`services/transcribe.py`** (novo) — `_get_model()` lazy com double-checked locking + `_run_lock` global (2 transcrições simultâneas em 4 cores Haswell só se atrapalham, e são ~1 GB de RSS cada). `download_root=settings.DIR_MODELS/"whisper"` → fica em `backend/models` (D:, 421 GB livres), poupando o C:. `beam_size=1` (greedy — beam 5 é ~3× mais lento em Haswell para ganho marginal em pt-BR). `transcribe_file(path) -> (texto, erro)` **nunca levanta exceção**; loga e devolve `("", motivo)`.

Antes de carregar o modelo, `probe_duration(path)` abre o arquivo com `av` (já vem com o `faster-whisper`, sem binário externo) e compara com `MAX_AUDIO_SECONDS`: acima do teto, devolve erro **sem transcrever**. Sem esse portão, um mp3 de 20 min vira ~20 min de CPU a 100% num i7-4790 — o usuário conclui que travou.

**`services/recorder.py`** (novo) — `start()` abre `sr.Microphone(device_index=settings.MIC_INDEX)` numa thread daemon acumulando `source.stream.read(source.CHUNK)`; `stop()` monta `sr.AudioData(frames, rate, width).get_wav_data()` e devolve os bytes WAV, que vão **direto** para `AttachmentStore.save()` — gravação nasce no Python, não passa pela ponte JS (o diagrama de fluxo entra por `upload_attachment_end` só para reusar o mesmo push de status). Corta sozinho em `MAX_AUDIO_SECONDS`. Chama `ear_pause()` / `ear_resume()` em torno da gravação, com `ear_resume()` em `finally` — se a gravação estourar exceção, a wake word não pode ficar surda para sempre. Import de `services.listen` feito **dentro** da função, nunca no topo (risco #7).

**`core/bridge.py`** — `start_recording()`, `stop_recording()`, `_transcribe_worker(id)` (consulta `attachments.is_discarded(id)` antes de persistir e faz o unlink no `finally` — risco #10). Imports de `services.recorder` / `services.transcribe` dentro das funções.

O ramo de áudio de `build_attachment_payload` (renderizar `audio_transcript.md`) entra aqui.

**`ChatInput.jsx`** — botão de gravar (`Mic`/`Square` do lucide-react) chamando `start_recording`/`stop_recording`, com contador de tempo e corte visual no teto.

**`FileChip.jsx`** — `status:"processing"` ganha anel pulsante (`repeat: Infinity` + `type:"spring"`, compatível com a Lei 1) + label "transcrevendo…".

**`BridgeAPI.js`** — mocks de `start_recording`/`stop_recording`; o mock de áudio devolve `status:"processing"` e agenda `setTimeout(() => window.receiveAttachmentUpdate({id, status:"ready", transcript:"..."}), 2000)` — o spinner fica desenvolvível em `npm run dev` sem Python.

### Fase 4 — Persistência e limpeza

`attachments` gravado no `log_interaction` e devolvido por `get_chat_history` com o shape que `MessageList.jsx:207-232` já renderiza (`{id, name, icon, glow}`) + `{kind, status, thumb, transcript}`. Bloco colapsável de transcrição na bolha (altura em spring).

> `icon`/`glow` são apresentação vindo do `getFileStyle` do frontend e ficam persistidos no JSON. É proposital — é o shape que `MessageList` já consome, e evita reprocessar estilo no reload. O preço: trocar a paleta não retroage no histórico. Aceito.

**Contrato do `prune`** (thread daemon no boot, ao lado do `warm_up_ollama` de `main.py:169`), nesta ordem:

1. `.part` órfão de upload fatiado → apaga sempre (risco #8).
2. Arquivo sem linha correspondente no `history` → apaga sempre.
3. Referenciado e mais velho que `ATTACHMENT_RETENTION_DAYS` → apaga.
4. Ainda acima de `ATTACHMENT_DISK_CAP_MB` → apaga do mais antigo para o mais novo até caber.

Os passos 3 e 4 **apagam arquivo que o histórico ainda cita** — por isso o `thumb` vive no JSON (a miniatura sobrevive) e o `status:"expired"` do risco #11 existe. Sem esse par, o histórico antigo viraria chip quebrado silencioso.

Unlink também no `delete_history_from` (usando os ids órfãos que ele passa a devolver). `.gitignore` ganha `backend/attachments/` e `backend/models/`.

### Fase 5 — Fechamento

Suíte completa → `CHANGES.md` no formato existente (tabela `# | Problema | Severidade | Arquivos` + seção por item com **Problema:**/**Correção:** e blocos Antes/Depois) → commit em pt-BR **com aprovação prévia** → push.

---

## Arquivos

**Novos — backend:** `core/attachments.py`, `services/transcribe.py`, `services/recorder.py`, `prompts/vision_analysis.md`, `prompts/audio_transcript.md`

**Novos — frontend:** `src/utils/attachments.js`

**Modificados — backend:** `core/config.py`, `core/llm.py`, `core/database.py`, `core/bridge.py`, `core/__init__.py` (exporta o singleton `attachments` ao lado de `settings`/`log`/`db`/`manager` — idioma já usado por `brain.py:2` e `bridge.py`), `services/chat.py`, `services/brain.py`, `main.py`, `requirements.txt`, `tests/_stubs.py`, `.env`, `.gitignore`, `CHANGES.md`

**Modificados — frontend:** `components/ChatPanel.jsx`, `components/CHAT/ChatInput.jsx`, `components/CHAT/FileChip.jsx`, `components/CHAT/MessageList.jsx`, `hooks/BridgeAPI.js`

---

## Testes

Suíte em `unittest` da stdlib — `pytest` não está no `requirements.txt` (se estiver instalado na máquina ele coleta os mesmos arquivos, mas nada no plano depende disso). Padrão obrigatório de `tests/_stubs.py`: `install()` logo após `import unittest`, antes de qualquer `import core`. Adicionar a `_STUB_MODULES`: `"faster_whisper"`, `"av"`, `"speech_recognition"`, `"pyaudio"` — `setdefault` intercepta antes de `ctranslate2`/PortAudio serem tocados, e sem os dois últimos qualquer teste que roce `services.recorder` quebra em máquina sem PyAudio compilado. Convenções mantidas: docstring de 1 linha `"""Feature N — …"""`, `if __name__ == "__main__": unittest.main()`, relógio injetável em vez de `sleep`.

| Arquivo | Casos |
|---|---|
| `test_attachments_store.py` | nome `..\..\Windows\System32\evil.png` → pai é `DIR_ATTACHMENTS` e stem é o id gerado; ext vem do MIME, não do nome (`x.exe` + `image/png` → `.png`); MIME desconhecido rejeitado; oversize rejeitado; base64 inválido devolve erro sem levantar; `path_of` rejeita id malformado; `path_of` de arquivo apagado devolve `None`; `prune` remove órfãos. `setUp` com `tempfile.mkdtemp()` sobrescrevendo `settings.DIR_ATTACHMENTS` (idioma de `test_database.py:17-30`) |
| `test_attachments_chunked.py` | `begin`+3×`chunk`+`end` reconstrói bytes idênticos ao tiro único; `seq` fora de ordem rejeitado; `end` com tamanho diferente do declarado rejeita e apaga o `.part`; `begin` sem `end` vira `.part` que o `prune` varre; nenhum `.part` sobrevive |
| `test_llm_vision.py` | model default = `settings.OLLAMA_MODEL`; override repassado; chave `images` passa intacta; **`keep_alive=0` não é engolido pelo `or`**; `timeout=300` chega no `Client` (`patch("ollama.Client")`, `call_args.kwargs`) |
| `test_database_attachments.py` | coluna existe após init (`PRAGMA table_info`); migração a partir de tabela legada criada com sqlite3 cru; migração idempotente (`_initialize_tables()` 2×); roundtrip JSON; `None` permanece NULL; `delete_history_from` devolve ids órfãos |
| `test_chat_effective_text.py` | **sem anexo, `effective_text is text` byte a byte** (regressão); áudio → texto contém a transcrição renderizada por `audio_transcript.md`, mesmo com `text=""`; imagem → âncora `[imagem anexada: …]` e `image_paths` com path absoluto; 3 imagens com `MAX_IMAGES_PER_MESSAGE=1` → 1 path; id inexistente → `[anexo indisponível: …]` e `image_paths` vazio |
| `test_chat_vision_messages.py` | última msg user carrega `images` com path absoluto; visão **não** injeta vault nem `LIVE DATA`; histórico capado em 2 turnos; imagem de turno anterior **não** é reenviada; **regressão: sem anexo o array de messages é idêntico ao de hoje** |
| `test_transcribe_lazy.py` | modelo é `None` no import; 4 threads em `_get_model()` → `WhisperModel.call_count == 1`; segmentos concatenados; arquivo inexistente devolve `("", motivo)` sem levantar; **duração acima de `MAX_AUDIO_SECONDS` → `WhisperModel` nunca é instanciado** |
| `test_bridge_attachments.py` | upload de imagem devolve `ready` síncrono; áudio devolve `processing`; **payload do push é JSON válido** — extrai o argumento de `fake_window.evaluate_js` e faz `json.loads` sobre transcrição contendo `'`, `"`, `\n`, `\\` e U+2028; `chat_message` retrocompatível com 2 args; **`chat_message` chama `execute_command_stream` com o texto efetivo, não com o texto cru** (`sys.modules["services.brain"]` mockado, `call_args`); `discard` durante o worker → responde na hora, worker não persiste a transcrição, arquivo some no fim |

```powershell
cd backend
python -m unittest discover -s tests -v
```

---

## Verificação end-to-end

1. **Fase 0 isolada:** `ollama run qwen2.5vl:3b "descreve o erro" .\screenshot.png` lê o stack trace em < 90 s.
2. **Suíte:** `unittest discover` verde, incluindo o teste de regressão que prova que o caminho sem anexo não mudou.
3. **Frontend sem Python:** `cd frontend && npm run dev` → drop de imagem mostra thumb no chip; drop de áudio mostra spinner e resolve em 2 s pelo mock; botão de enviar destrava sozinho.
4. **App real:** `cd frontend && npm run build` → `boot.bat`.
   - Win+Shift+S → Ctrl+V no chat → "descreve o erro nessa screenshot" → resposta em streaming descrevendo o conteúdo real.
   - Arrastar um `.mp3` → chip "transcrevendo…" → transcrição aparece → Enter → JARVIS responde sobre o conteúdo.
   - Gravar pelo botão de mic → wake word não dispara durante a gravação (`ear_pause`) e volta a funcionar depois.
   - Trocar de sessão e voltar: thumb e transcrição sobrevivem ao reload.
   - Regenerar uma resposta sobre imagem: a imagem continua no contexto.
   - Soltar arquivo **fora** do input: o app não navega para o arquivo.
   - **Áudio sem legenda dizendo "Jarvis, guarda que meu irmão chama X" → cai em `MEMORY_WRITE`** e o fato chega ao vault. É o teste que prova o "texto efetivo" (risco #9 + furo do roteamento).
   - Arrastar um mp3 de ~6 MB: a UI continua respondendo durante o upload (fatiado) e o streaming de uma resposta em voo não engasga.
   - Arrastar um mp3 de 20 min: recusa imediata com motivo, **sem** carregar o Whisper.
   - Remover o chip no meio do "transcrevendo…": some na hora, e o log mostra o worker encerrando sem persistir nada e apagando o arquivo.
   - Apagar `backend/attachments/` na mão e recarregar a sessão: chips ficam `expired` com explicação; regenerar sobre imagem expirada dá erro claro, não resposta inventada.
   - Segundo turno depois de uma resposta sobre imagem ("resume o que você viu"): responde pelo histórico em texto, sem recarregar o VLM.
5. **Logs:** `backend/logs/…` mostra o aviso de eviction, o re-warm do `gemma2:2b` e o tempo de transcrição. Chat de texto puro logo após uma resposta de visão continua rápido.

---

## Fora de escopo (follow-up, não fazer agora)

- **Trocar o STT do modo voz.** O `🧠 Brainstorm de Melhorias` pede `faster-whisper` no lugar do Google STT em `services/listen.py`, mantendo o Google como fallback. Este plano instala o `faster-whisper` e cria `services/transcribe.py`, ou seja, deixa a peça pronta — mas **não** mexe no loop de wake word. Fazer isso junto misturaria uma feature de chat com uma troca no caminho crítico da voz. Vira plano próprio depois que a multimodalidade estabilizar.
- **`SCREEN_VISION` como skill** (screenshot automática da tela ativa). Reusa `ask_vision_stream` inteiro; é escopo de skill, não de chat.
