# CHANGES.md

Registro detalhado das correções de bugs e aplicações de boas práticas no backend do J.A.R.V.I.S.

**Data:** 2026-06-09
**Branch:** `Grolla`
**Escopo:** 7 correções de robustez/memória/concorrência no backend Python + suíte de testes unitários.

---

## Resumo

| # | Problema | Severidade | Arquivos |
|---|----------|------------|----------|
| 1 | `PROCESS_JUDGEMENT_CACHE` sem TTL (memory leak) | Média | `core/alerts.py` |
| 2 | `load_prompt()` com cache stale após edição em runtime | Baixa | `core/prompts.py` |
| 3 | `classify_intent` sem timeout (trava até 120s) | Alta | `core/llm.py`, `services/intent.py` |
| 4 | Escape de JS incompleto (`\r`/`\t` descobertos) | Alta | `core/utils.py` (novo), `core/bridge.py`, `core/__init__.py` |
| 5 | `dynamic_energy_threshold` instável com ruído | Média | `core/config.py`, `.env`, `services/listen.py` |
| 6 | SQLite sem WAL (`database is locked`) | Alta | `core/database.py` |
| 7 | `try/finally conn.close()` manual e repetitivo | Média | `core/database.py` |

---

## 1. `PROCESS_JUDGEMENT_CACHE` — TTL de 1 hora

**Problema:** o dicionário `PROCESS_JUDGEMENT_CACHE` em `core/alerts.py` armazenava o veredito do LLM (matar/não matar processo) indefinidamente. Em sessões longas, cada novo processo julgado adicionava uma entrada que nunca expirava — vazamento de memória.

**Correção:**

- Constante de módulo `JUDGEMENT_TTL = 3600` (1h).
- Valor armazenado mudou de `str` (`decision`) para tupla `(decision, expiry_ts)`.
- Leitura: só usa o cache se `time.time() < expiry`; caso contrário, reconsulta o Ollama.
- Escrita: `PROCESS_JUDGEMENT_CACHE[culprit_app] = (decision, time.time() + JUDGEMENT_TTL)`.

**Antes:**

```python
if culprit_app in PROCESS_JUDGEMENT_CACHE:
    decision = PROCESS_JUDGEMENT_CACHE[culprit_app]
else:
    ...
    PROCESS_JUDGEMENT_CACHE[culprit_app] = decision
```

**Depois:**

```python
cached = PROCESS_JUDGEMENT_CACHE.get(culprit_app)
if cached and time.time() < cached[1]:
    decision = cached[0]
else:
    ...
    PROCESS_JUDGEMENT_CACHE[culprit_app] = (decision, time.time() + JUDGEMENT_TTL)
```

---

## 2. `load_prompt()` — invalidação por `mtime`

**Problema:** `core/prompts.py` cacheava o conteúdo dos `.md` em memória pela primeira leitura. Editar um prompt em runtime não tinha efeito — o cache nunca invalidava.

**Correção:**

- `_prompt_cache[filepath]` passou a guardar `(mtime, content)`.
- Antes de servir do cache, compara `os.path.getmtime(filepath)` com o `mtime` guardado. Se diferente (ou não cacheado), relê do disco e atualiza.
- `safe_substitute` (injeção de variáveis `$var`) mantido inalterado.

**Comportamento novo:** editar qualquer `backend/prompts/*.md` reflete na próxima chamada de `load_prompt`, sem reiniciar o backend.

---

## 3. `classify_intent` — timeout com fallback

**Problema:** `query_ollama` instanciava o cliente com `Client(timeout=120)` fixo. Se o Ollama travasse, a classificação de intenção ficava pendurada por 2 minutos sem feedback ao frontend.

**Correção:**

- `core/llm.py`: novo parâmetro `timeout` em `query_ollama(...)` e `query_ollama_stream(...)`. `Client(host=host, timeout=timeout or 120)` — mantém 120s como default robusto.
- `services/intent.py`: `classify_intent` agora passa `timeout=settings.TIMEOUT_API` (10s, já existente em `config.py`).
- Fallback já existente preservado: se `query_ollama` retorna `None`, devolve imediatamente `{"intent": "CHAT", "entity": None, "confidence": 0.0}`.

**Efeito:** classificação desiste em 10s em vez de 120s, e cai no fluxo de chat normal.

---

## 4. Escape de JS — função centralizada `escape_js`

**Problema:** o escape inline em `bridge.py` (`chunk.replace("\\","\\\\")...`) não cobria `\r` nem `\t`, e estava duplicado/inconsistente entre pontos de `evaluate_js`. `send_frontend_alert` injetava `level`/`message` **sem escape nenhum** — uma aspa na mensagem paralisava o frontend silenciosamente.

**Correção:**

- Novo `core/utils.py` com `escape_js(text)`:
  - Trata `None` → `""` e coage não-string via `str()`.
  - Ordem correta: barra primeiro, depois aspas, `\n`, `\r`, `\t`.
- `bridge.py`:
  - Stream de chat: `safe_chunk = escape_js(chunk)` (substitui o inline).
  - `send_frontend_alert`: `level`/`message` agora passam por `escape_js`.
- `core/__init__.py`: `escape_js` exportado e adicionado ao `__all__`.

```python
def escape_js(text) -> str:
    if text is None:
        return ""
    return (str(text)
            .replace("\\", "\\\\").replace("'", "\\'").replace('"', '\\"')
            .replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t"))
```

---

## 5. Microfone — threshold estático configurável

**Problema:** `Ear.__init__` em `services/listen.py` usava `dynamic_energy_threshold = True`. Em ambientes com ruído contínuo (ventilador de PC), o limiar subia progressivamente e o microfone parava de ouvir.

**Correção:**

- `core/config.py`: novo `MIC_ENERGY_THRESHOLD: int = int(os.getenv("MIC_ENERGY_THRESHOLD", "300"))`.
- `.env`: adicionada a variável `MIC_ENERGY_THRESHOLD=300` na seção de Áudio.
- `services/listen.py`: se `MIC_ENERGY_THRESHOLD > 0`, desliga o modo dinâmico e fixa `recognizer.energy_threshold`. Se `<= 0`, mantém o comportamento dinâmico antigo (opt-out).

```python
if settings.MIC_ENERGY_THRESHOLD > 0:
    self.recognizer.dynamic_energy_threshold = False
    self.recognizer.energy_threshold = settings.MIC_ENERGY_THRESHOLD
else:
    self.recognizer.dynamic_energy_threshold = True
```

---

## 6. SQLite — modo WAL

**Problema:** com múltiplas threads (telemetria + brain + bridge) acessando `jarvis_memory.db` no modo `rollback journal` default, o banco ocasionalmente travava com `database is locked`.

**Correção:** em `DatabaseManager._get_connection()`:

- `sqlite3.connect(self.db_path, check_same_thread=False)` — libera acesso multi-thread.
- `PRAGMA journal_mode=WAL` — leitores e escritor não se bloqueiam.
- `PRAGMA busy_timeout=5000` — espera até 5s antes de erro de lock.

```python
conn = sqlite3.connect(self.db_path, check_same_thread=False)
conn.execute("PRAGMA journal_mode=WAL")
conn.execute("PRAGMA busy_timeout=5000")
return conn
```

> Gera arquivos auxiliares `jarvis_memory.db-wal` e `jarvis_memory.db-shm` ao lado do `.db`.

---

## 7. SQLite — context manager `connection()`

**Problema:** todos os ~9 métodos do `DatabaseManager` repetiam o padrão `conn = self._get_connection()` ... `try/except/finally: conn.close()`. Esquecer o `close()` trava o loop PyWebView na iteração seguinte — risco recorrente.

**Correção:**

- Novo context manager `connection()` (via `@contextmanager`):
  - Commita ao sair do bloco normalmente.
  - Faz `rollback()` e propaga em `sqlite3.Error`.
  - Sempre `close()` no `finally`.
- Métodos migrados de `try/finally conn.close()` para `with self.connection() as conn:`:
  `_initialize_tables`, `update_hardware_spec`, `get_system_specs`, `save_config`, `get_config`, `log_interaction`, `delete_history_from`, `update_history_message`, `search_relevant_context`.
- `conn.commit()` manuais removidos (o context manager commita).
- `try/except` externo por método mantido onde o erro é tolerado e há valor default (ex.: `get_config` → `None`, `search_relevant_context` → `[]`).

```python
@contextmanager
def connection(self):
    conn = self._get_connection()
    try:
        yield conn
        conn.commit()
    except sqlite3.Error:
        conn.rollback()
        raise
    finally:
        conn.close()
```

---

## Testes unitários

Nova pasta `backend/tests/` com 26 testes em `unittest` (stdlib — sem dependência de pytest).

| Arquivo | Cobre | Casos |
|---------|-------|-------|
| `test_utils.py` | Fix #4 | escape de barra/aspas/`\n`/`\r`/`\t`, `None`, não-string, garantia de nenhuma aspa crua |
| `test_prompts.py` | Fix #2 | leitura+cache, invalidação por `mtime`, substituição de template, arquivo inexistente |
| `test_alerts_cache.py` | Fix #1 | armazena tupla com expiry, cache hit pula Ollama, entrada vencida reconsulta, TTL=3600 |
| `test_database.py` | Fix #6/#7 | modo WAL ativo, roundtrip config str/json, commit do CM, rollback em erro, config ausente |
| `test_llm_timeout.py` | Fix #3 | timeout custom propagado ao `Client`, default 120, erro → `None`, fallback `CHAT` |
| `test_config_mic.py` | Fix #5 | `MIC_ENERGY_THRESHOLD` existe, é `int`, não-negativo |

**Infraestrutura de teste — `tests/_stubs.py`:** mocka dependências ausentes/pesadas (`mcp`, `GPUtil`, `wmi`) via `sys.modules`, permitindo importar o pacote `core` sem hardware (mic/GPU/WMI) nem servidor MCP. Chamar `install()` antes de qualquer `import core`.

> Nota: `services/` é um namespace package (sem `__init__.py`). Testes que precisam evitar hardware stubam apenas os submódulos (`services.listen`, `services.speak`), nunca o pacote pai — senão `services.intent` quebra.

### Rodar os testes

```bash
cd backend
venv\Scripts\python.exe -m unittest discover -s tests -v
```

Resultado esperado: `Ran 26 tests ... OK`. As linhas `ERROR` no log são intencionais (testes de caminho de erro).

---

## Arquivos alterados

```
backend/core/alerts.py        # TTL no cache de julgamento
backend/core/prompts.py       # invalidação de cache por mtime
backend/core/llm.py           # parâmetro timeout
backend/services/intent.py    # passa timeout=settings.TIMEOUT_API
backend/core/utils.py         # NOVO — escape_js()
backend/core/bridge.py        # usa escape_js (stream + send_frontend_alert)
backend/core/__init__.py      # exporta escape_js
backend/core/config.py        # MIC_ENERGY_THRESHOLD
backend/services/listen.py    # threshold estático
.env                          # MIC_ENERGY_THRESHOLD=300
backend/core/database.py      # WAL + context manager connection()

backend/tests/__init__.py        # NOVO
backend/tests/_stubs.py          # NOVO — stubs de deps pesadas
backend/tests/test_utils.py      # NOVO
backend/tests/test_prompts.py    # NOVO
backend/tests/test_alerts_cache.py  # NOVO
backend/tests/test_database.py   # NOVO
backend/tests/test_llm_timeout.py   # NOVO
backend/tests/test_config_mic.py # NOVO
```

---
---

# Otimizações de Performance

**Data:** 2026-06-09
**Branch:** `Grolla`
**Escopo:** 4 melhorias de performance para tornar o JARVIS mais responsivo e comercial — sem mudar comportamento funcional.

## Resumo

| # | Otimização | Ganho | Arquivos |
|---|-----------|-------|----------|
| 1 | Warm-up do Ollama no boot + modelo residente (`keep_alive=-1`) | Elimina a lentidão da 1ª inferência e mantém o modelo na VRAM | `core/llm.py`, `core/config.py`, `main.py` |
| 2 | Cache LRU+TTL no `classify_intent` | Comando repetido em <30s não reconsulta o LLM | `core/utils.py`, `services/intent.py`, `core/config.py` |
| 3 | Telemetria polling → push (delta-gated) | Zero tráfego IPC em idle; CPU menor | `core/bridge.py`, `main.py`, `core/config.py`, `frontend/.../LiveTelemetry.jsx` |
| 4 | Pré-compilação dos `string.Template` | Sem reparse do prompt a cada `load_prompt` | `core/prompts.py` |

---

## 1. Warm-up do Ollama + modelo residente na VRAM

**Problema:** o `Client` era instanciado a cada chamada e o modelo só subia na VRAM na 1ª inferência real — a primeira resposta do usuário esperava segundos. Pior: o Ollama descarrega o modelo após ~5 min ocioso (`keep_alive` default), então o atraso voltava periodicamente.

**Correção (`core/llm.py`):**

- `_get_client(timeout)` centraliza a construção do `Client` (remove duplicação entre `query_ollama`/`query_ollama_stream`).
- `keep_alive=settings.OLLAMA_KEEP_ALIVE` em **todas** as chamadas `client.chat(...)` → modelo permanece residente.
- `warm_up_ollama()`: dispara um `chat` mínimo (`ping`) já no boot para forçar o load. Engole exceções (se o Ollama ainda não subiu, segue carregando sob demanda) e loga o tempo decorrido.
- `core/config.py`: `OLLAMA_KEEP_ALIVE` (default `-1` = nunca descarrega; aceita duração como `"30m"`). Numérico é convertido para `int`.
- `main.py`: thread `daemon` de warm-up disparada em `start_jarvis()`, em paralelo à renderização da UI.

> Trade-off aceito: com `keep_alive=-1` a VRAM fica ocupada pelo modelo enquanto o JARVIS roda.

---

## 2. Cache LRU + TTL para `classify_intent`

**Problema:** `classify_intent` chamava o LLM em **toda** classificação, mesmo quando o usuário repetia o comando — latência e CPU desperdiçados.

**Correção:**

- `core/utils.py`: classe genérica `TTLCache(maxsize, ttl, time_fn)` sobre `OrderedDict` — LRU (`move_to_end` + `popitem(last=False)`) + expiração por timestamp. `time_fn` injetável p/ testes.
- `services/intent.py`: `_intent_cache` memoiza por chave `(texto normalizado, skip_skills)`. Hit serve sem ir ao Ollama; retorna **cópia** (`dict`) para o chamador nunca mutar a entrada cacheada. TTL de 30s cobre toggles de skill sem invalidação manual.
- `core/config.py`: `INTENT_CACHE_TTL=30`, `INTENT_CACHE_SIZE=64`.

---

## 3. Telemetria: polling → push (delta-gated, sem heartbeat)

**Problema:** `LiveTelemetry.jsx` fazia `setInterval(get_telemetry, 1000)` — cada tick cruzava a ponte IPC e coletava 8 grupos de métricas mesmo sem mudança, gastando CPU em idle.

**Correção:**

- `core/bridge.py`: `start_telemetry_stream()` sobe um loop daemon que lê a telemetria e só faz `evaluate_js(window.receiveTelemetry(...))` quando há **delta relevante** (CPU/RAM/GPU acima do threshold). Payload via `json.dumps` (JSON válido = expressão JS válida, sem escape manual). Idle silencioso ⇒ zero push.
- `core/config.py`: `TELEMETRY_INTERVAL=1.0`, `TELEMETRY_CPU_DELTA=5.0`, `TELEMETRY_RAM_DELTA=2.0`, `TELEMETRY_GPU_DELTA=5.0`.
- `main.py`: `api.start_telemetry_stream(...)` em `jarvis_auto_loop`.
- **Frontend:** `LiveTelemetry.jsx` registra `window.receiveTelemetry` (push) + 1 fetch inicial; em modo mock (browser dev, sem pywebview) mantém polling local de fallback. Como sem heartbeat net/disco congelariam, o **NetworkWidget foi removido** (arquivo `TELEMETRY/NetworkWidget.jsx` deletado); `CpuRamWidget` permanece (delta-driven). Bateria deixou de ser exibida (vivia no NetworkWidget).

---

## 4. Pré-compilação dos prompts

**Problema:** `load_prompt()` instanciava `string.Template(content)` a cada chamada com kwargs — reparse constante do mesmo arquivo.

**Correção (`core/prompts.py`):** o `_prompt_cache` passou a guardar `(mtime, content, template)`, compilando o `Template` **uma vez** na leitura do disco. Hits reusam o objeto compilado. A invalidação por `mtime` (índice 0) é preservada — `test_prompts.py` continua válido.

---

## Testes adicionados

| Arquivo | Cobre | Casos |
|---------|-------|-------|
| `test_utils_ttlcache.py` | Feature 2 (base) | hit/miss, expiração por TTL, evicção LRU, refresh de expiry |
| `test_intent_cache.py` | Feature 2 | 1ª chamada consulta LLM, repetição serve do cache, normalização case/espaço, texto novo recomputa, vencido recomputa, cópia isolada |
| `test_prompts_precompile.py` | Feature 4 | Template reusado em cache hit, recompilado em mudança de `mtime`, substituição correta, tupla mantém `mtime` no índice 0 |
| `test_llm_warmup.py` | Feature 1 | `warm_up_ollama` chama `chat` 1× com `keep_alive`, engole exceção, `query_ollama` repassa `keep_alive` |

`tests/_stubs.py` ampliado para mockar `requests`, `webview`, `psutil` e `ollama` (deps ausentes no venv) além de `mcp`/`GPUtil`/`wmi`.

**Resultado:** `Ran 43 tests ... OK` (via `venv\Scripts\python.exe -m unittest discover -s tests`).

## Arquivos alterados (performance)

```
backend/core/llm.py            # _get_client + keep_alive + warm_up_ollama
backend/core/utils.py          # + TTLCache
backend/services/intent.py     # cache LRU+TTL no classify_intent
backend/core/prompts.py        # Template pré-compilado no cache
backend/core/bridge.py         # stream de telemetria push (delta-gated)
backend/core/config.py         # OLLAMA_KEEP_ALIVE, INTENT_CACHE_*, TELEMETRY_*
backend/main.py                # warm-up thread + start_telemetry_stream
frontend/src/components/LiveTelemetry.jsx   # push em vez de polling
frontend/src/components/TELEMETRY/NetworkWidget.jsx  # REMOVIDO

backend/tests/_stubs.py                    # + requests/webview/psutil/ollama
backend/tests/test_utils_ttlcache.py       # NOVO
backend/tests/test_intent_cache.py         # NOVO
backend/tests/test_prompts_precompile.py   # NOVO
backend/tests/test_llm_warmup.py           # NOVO
```

---

# Spotify na skill WORK_MACRO — janela maximizada e play confiável

**Data:** 2026-08-07
**Branch:** `Grolla`
**Escopo:** reescrita do bloco de trilha sonora da skill `work_macros` + suíte de testes.

---

## Resumo

| # | Problema | Severidade | Arquivos |
|---|----------|------------|----------|
| 1 | Tecla de mídia é *toggle* — **pausava** quem já estava ouvindo | Alta | `skills/automation/work_macros.py` |
| 2 | Play retomava a última faixa, não a playlist recém-aberta | Alta | `skills/automation/work_macros.py` |
| 3 | Janela do Spotify nunca era maximizada | Média | `skills/automation/work_macros.py` |
| 4 | `time.sleep(3)` fixo em vez de esperar a janela existir | Média | `skills/automation/work_macros.py` |
| 5 | `os.system(f"start {uri}")` interpolava a URI crua no `cmd` | Média | `skills/automation/work_macros.py` |
| 6 | Spotify lançado duas vezes (lista `apps` + URI) | Baixa | `skills/automation/work_macros.py` |
| 7 | `check_process_running()` — dead code com `if ... pass` vazio | Baixa | `skills/automation/work_macros.py` |

---

## 1-2. Play verificado em vez de tecla às cegas

**Problema:** o bloco antigo abria a URI da playlist, dormia 3s e disparava `VK_MEDIA_PLAY_PAUSE`. Duas falhas graves: a tecla é um **toggle**, então se o usuário já estivesse ouvindo algo a macro **pausava** a música; e mesmo quando funcionava, a tecla retomava a **última faixa da sessão anterior**, não a playlist que acabara de ser aberta — abrir a URI apenas *navega* até a playlist.

**Correção:** o título da janela do Spotify virou sensor de estado. Parado, o app se anuncia como `"Spotify"` / `"Spotify Premium"` / `"Spotify Free"`; tocando, como `"Artista - Faixa"`.

- `_is_playing_title(title)` — helper puro que traduz título em estado booleano.
- `_ensure_playing(hwnd)` — lê o estado **antes** de agir:
  1. Já tocando → retorna sem tocar em nada (corrige o toggle).
  2. Parado → foca a janela e envia `pyautogui.press('space')`, que toca o **contexto aberto** (a playlist), não a faixa antiga.
  3. Relê o título; se ainda parado, cai no fallback `VK_MEDIA_PLAY_PAUSE`.
  4. Relê de novo; se continuar parado, `log.warning` e retorna `False` — a macro segue normalmente.

`pyautogui` entra por *late import* dentro da função, para não pesar no boot (o `SkillManager` executa o módulo inteiro na inicialização).

**Antes:**

```python
os.system(f"start {spotify_uri}")
time.sleep(3)
VK_MEDIA_PLAY_PAUSE = 0xB3
hwcode = ctypes.windll.user32.MapVirtualKeyA(VK_MEDIA_PLAY_PAUSE, 0)
ctypes.windll.user32.keybd_event(VK_MEDIA_PLAY_PAUSE, hwcode, 0, 0)
ctypes.windll.user32.keybd_event(VK_MEDIA_PLAY_PAUSE, hwcode, 2, 0)
```

**Depois:**

```python
if "playlist" in scene:
    log.info(f"🎵 Iniciando trilha sonora: {scene['playlist']}")
    _start_playlist(scene["playlist"])
```

## 3. Janela maximizada

`_focus_and_maximize(hwnd)` aplica `ShowWindow(hwnd, SW_MAXIMIZE)` e traz a janela ao primeiro plano. O `SetForegroundWindow` é recusado pelo Windows quando o processo chamador não está em foreground — contornado com o truque canônico de emitir um `keybd_event(VK_MENU)` (press + release de ALT) imediatamente antes. Sem isso a janela maximiza mas fica atrás das outras, e o `Space` seguinte vai parar no app errado.

## 4. Espera ativa pela janela

`_wait_for_spotify_window()` faz *polling* a cada `0.5s` (teto de `15s`) em vez do `sleep(3)` no escuro — mais rápido em SSD, e não falha em máquina lenta.

A busca do handle é **por PID**, não por título: `psutil` coleta os PIDs de `Spotify.exe`, depois `EnumWindows` + `GetWindowThreadProcessId` casa o HWND. Buscar por título quebraria exatamente no caso que importa — com música tocando o título é `"Artista - Faixa"` e não contém a palavra "Spotify". Filtro `IsWindowVisible` + título não-vazio descarta as janelas fantasma do Chromium.

> O `time.sleep(3)` que antecede `organize_windows()` foi **mantido**: ele cobre o boot do VSCode para o Tiling Manager achar o `MainWindowHandle`, e a espera do Spotify retorna instantaneamente quando o app já estava aberto.

## 5. URI validada antes do shell

`_sanitize_spotify_uri()` passa a URI por `re.fullmatch(r"spotify:(playlist|album|track):[A-Za-z0-9]+")`, remove o sufixo `:play` legado e retorna `""` se não bater. A abertura virou `subprocess.Popen(["cmd", "/c", "start", "", uri], shell=False, creationflags=CREATE_NO_WINDOW)` — sem interpolação em shell e sem flash de console. A string vazia é o argumento de *título* que o `start` exige antes de uma URI.

## 6-7. Limpeza

- `"spotify"` removido de `SCENES["code"]["apps"]` e `SCENES["estudo"]["apps"]` — `_start_playlist` já lança o app pela URI. Economiza 1.5s de `sleep` e elimina a corrida entre os dois lançamentos. Há teste travando isso.
- `check_process_running()` apagada — nunca era chamada e continha um bloco `if ... pass` vazio.

---

## Comportamento conhecido

No modo `code` com **1 monitor**, o `organize_windows` roda depois e tila VSCode (70%) + navegador (30%) sobre a tela inteira: o Spotify fica maximizado **atrás** deles. Com 2+ monitores ele sobra no monitor livre.

---

## Arquivos alterados (Spotify)

```
backend/skills/automation/work_macros.py          # helpers + execute() + SCENES
backend/docs/skills/automation/work_macros.md     # seção 4 reescrita + guia de manutenção
backend/tests/test_work_macros_spotify.py         # NOVO — 12 testes
```

Testes: `cd backend && python -m pytest tests/ -q` → **55 passed**.
