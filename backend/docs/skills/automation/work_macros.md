# ⚙️ Skill: work_macros.py

A skill `work_macros.py` pertence à categoria **Automation** e atua como o regente supremo da máquina. Ela aciona sequências orquestradas complexas chamadas de "Cenas", preparando o ambiente de trabalho, o layout de telas e o comportamento acústico do Windows simultaneamente com apenas uma ordem vocal.

## 📝 Contrato

- **INTENT**: `WORK_MACRO`
- **PROMPT_TEXT**: Carregada no cérebro central para interceptar pedidos de mutação ambiental (Ex: "Ativar modo desenvolvedor", "Preciso focar e estudar", "Sextou, liga o modo gamer").

---

## ⚙️ Arquitetura e Engenharia Interna

### 1. O Sub-Agente Semântico (`_ask_ollama_macro_expert`)

O cérebro dedica um agente terceirizado (`requests.post(Ollama)`) para converter divagações do usuário em chaves dicionariais estritas.

- O `MACRO_DECISION_PROMPT` restringe o pensamento da LLM a apenas devolver 4 valores permitidos no JSON final: `code`, `estudo`, `gamer` ou `outro`.
- Se o usuário falar *"Jarvis, bora trabalhar, abre minhas paradas de dev"*, a LLM formata para `{"mode": "code"}`.

### 2. Feedback de Imersão Assíncrono (Tony Stark Effect)

Cenas demoram para carregar porque exigem a leitura de discos rígidos abrindo múltiplos apps simultaneamente. Se a skill processasse tudo para só depois responder no `return`, o J.A.R.V.I.S. ficaria mudo por 10 segundos, quebrando a UX.

- O desenvolvedor consertou isso fazendo um *Late Import* (`from services.speak import speak`) e invocando `speak("Carregando protocolo...")` **antes** do loop `for app in scene["apps"]:` começar. Isso passa a incrível sensação de que o Jarvis está realmente trabalhando em *background* enquanto conversa com você.

### 3. Acoplamento de Skills Cruzadas (Cross-Skill Invocation)

Em vez de reinventar a roda ou copiar códigos de abertura de software, a `work_macros.py` injeta no núcleo a habilidade de acessar a tabela de memória do orquestrador central.

- Ela usa `from core import manager` e verifica dinamicamente se a skill `APP_CONTROL` está carregada na memória (`manager.skills["APP_CONTROL"]`).
- Em caso positivo, ela parasita a função `.execute()` do app_control, delegando para ela a dor de cabeça matemática de achar o executável, aplicar Fuzzy Match e abrir o app.

### 4. Bypasses de Automação Avançados

- **Silenciamento de SO (RegEdit)**: Quando no modo "Estudo", a skill não apenas fecha apps. Ela roda um script furtivo em `PowerShell` e sobrescreve a chave de *Registry* do Windows `NOC_GLOBAL_SETTING_TOASTS_ENABLED`. Isso silencia brutalmente todas as notificações e sons de aviso do Windows, ativando um *Do Not Disturb* absoluto.
- **Autoplay do Spotify via Hardware (`_start_playlist`)**: A API gratuita do Spotify bloqueia o comando `:play` externo, e abrir a URI apenas *navega* até a playlist sem tocar nada. A skill realiza um bypass formidável em quatro tempos, todos verificáveis:
  1. **Sanitização** (`_sanitize_spotify_uri`): a URI passa por um `re.fullmatch(r"spotify:(playlist|album|track):[A-Za-z0-9]+")` antes de chegar ao shell. Isso remove o sufixo `:play` legado e fecha a porta para interpolação arbitrária de comandos — o antigo `os.system(f"start {uri}")` mandava a string crua para o `cmd`.
  2. **Abertura silenciosa**: `subprocess.Popen(["cmd", "/c", "start", "", uri], creationflags=CREATE_NO_WINDOW)`. A string vazia é o argumento de *título* que o `start` exige antes de uma URI; sem ela o `cmd` interpreta a própria URI como título da janela.
  3. **Espera ativa** (`_wait_for_spotify_window`): em vez de um `time.sleep(3)` no escuro, faz *polling* a cada 0.5s (teto de 15s) procurando o HWND. A busca é **por PID** (`psutil` → `GetWindowThreadProcessId`), nunca por título: quando a música está tocando o título vira `"Artista - Faixa"` e uma busca por `"Spotify"` falharia. Filtra `IsWindowVisible` + título não-vazio para descartar as janelas fantasma do Chromium. Achado o handle, `_focus_and_maximize` aplica `ShowWindow(hwnd, SW_MAXIMIZE)` — a janela do Spotify **abre maximizada**.
  4. **Play verificado** (`_ensure_playing`): o título da janela é o sensor de estado. Parado, o Spotify se anuncia como `"Spotify"` / `"Spotify Premium"` / `"Spotify Free"`; tocando, como `"Artista - Faixa"`. A skill lê o título **antes** de agir — se já está tocando, não faz nada. Isso corrige um bug grave da versão anterior: `VK_MEDIA_PLAY_PAUSE` é um *toggle*, então mandá-lo às cegas **pausava** a música de quem já estava ouvindo. Só quando o estado é ocioso ela tenta `pyautogui.press('space')` na janela focada (toca o contexto aberto, não a última faixa da sessão passada), relê o título, e apenas em último caso recorre à *Scan Code* secreta `VK_MEDIA_PLAY_PAUSE (0xB3)` via `MapVirtualKeyA` — sinalizando ao Kernel do Windows que um humano apertou fisicamente o botão de Play/Pause de um teclado multimídia.

> ⚠️ **`SetForegroundWindow` e o ALT fantasma**: o Windows recusa a chamada quando o processo que pede o foco não está ele mesmo em foreground. `_focus_and_maximize` contorna com o truque canônico de emitir um `keybd_event(VK_MENU)` (press + release de ALT) imediatamente antes. Sem isso a janela maximiza mas continua atrás das outras, e o `pyautogui.press('space')` seguinte vai parar no app errado.
>
> ⚠️ **Spotify sai da lista `apps` das cenas**: cenas que declaram `playlist` **não** devem listar `"spotify"` em `apps`. O `_start_playlist` já lança o app pela URI; manter nos dois lugares só adicionava 1.5s de `sleep` e uma corrida entre os dois lançamentos. Há um teste que trava isso (`test_spotify_nao_duplicado_na_lista_de_apps`).

### 5. Tiling Manager Customizado (C# dentro do Python)

O Windows não tem sistemas nativos de Tiling (como o i3wm ou BSPWM no Linux). A skill `work_macros.py` constrói o seu próprio Tiling Manager "On-the-Fly".

- A função `organize_windows` cria uma string contendo código compilável de linguagem **C#**.
- Ela executa um comando `powershell` com a diretiva `Add-Type`, pedindo pro compilador .NET do Windows compilar aquele C# em tempo real, obtendo acesso nativo hiper-rápido à DLL `User32.dll`.
- **Inteligência Espacial**: O script invoca `System.Windows.Forms.Screen::AllScreens` para contar os monitores de hardware.
  - **Single Monitor Layout**: O VSCode recebe matematicamente `70%` (`[math]::Floor($prim.Width * 0.70)`) dos pixels esquerdos, e o Navegador é ancorado nos `30%` restantes.
  - **Dual Monitor Layout**: O VSCode é puxado para o Monitor 1 e recebe um comando de Maximize (`ShowWindow(3)`), enquanto o Navegador de internet cruza o abismo e maximiza no Monitor 2, deixando o ambiente de código intocado em segundos.

---

## 🛠️ Manutenção e Boas Práticas (Developer Guide)

- **Handles Mortos (Janelas Eletron/Chromium)**: Preste extrema atenção à linha `$_.MainWindowHandle -ne 0` no PowerShell embutido. Ferramentas construídas com Electron (Discord, Spotify, VSCode) criam processos no Windows que *não possuem* janela física (`MainWindowHandle = 0`). Sem esse filtro restrito, o C# tentará dar um resize no processo em background do Chromium, causando falha geral no Tiling Manager.
- **Tempo de Aguardo no Tiling**: Há um comando vital de `time.sleep(3)` antes da chamada de `organize_windows()`. Se for reduzido, o C# será disparado na velocidade da luz *antes* de que o HD/SSD tenha tido tempo de abrir a janela do VSCode. O Tiling manager não achará o `MainWindowHandle` na RAM e o painel continuará bagunçado. Caso mude para um PC com HDD antigo, aumente para `time.sleep(7)`. **Não confunda com a espera do Spotify**: aquela virou polling ativo (`_wait_for_spotify_window`) e retorna instantaneamente quando o app já estava aberto — ou seja, ela *não* cobre o tempo de boot do VSCode. Os 3 segundos continuam necessários.
- **Ordem de empilhamento no modo `code` com 1 monitor**: o `organize_windows` roda **depois** da trilha sonora e tila o VSCode (70%) + navegador (30%) sobre a tela inteira. O Spotify continua maximizado, porém **atrás** deles. É o comportamento esperado — com 2+ monitores ele sobra no monitor livre. Se um dia a prioridade for mantê-lo visível, o caminho é movê-lo para o monitor secundário reusando `get_monitors()` da skill `screen_control`.
- **Timings do Spotify**: as constantes `SPOTIFY_WINDOW_TIMEOUT` (15s), `SPOTIFY_POLL_INTERVAL` (0.5s) e `SPOTIFY_PLAY_SETTLE` (1.2s) ficam no topo do arquivo. O `PLAY_SETTLE` é o intervalo entre apertar a tecla e reler o título da janela — em máquinas lentas, se o log acusar *"Spotify aberto na playlist, mas a reprodução não iniciou"* mesmo com a música tocando, é esse valor que precisa subir.
