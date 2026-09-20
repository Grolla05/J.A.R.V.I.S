# ⌨️ Skill: keyboard_control.py

A skill `keyboard_control.py` pertence à categoria **Automation**. Ela atua como uma interface de hardware virtual (um "Ghost Keyboard"), concedendo ao J.A.R.V.I.S. a habilidade de injetar atalhos, sequências complexas e redigir textos em absolutamente qualquer aplicativo que o usuário esteja focando no Windows.

## 📝 Contrato

- **INTENT**: `KEYBOARD_CONTROL`
- **PROMPT_TEXT**: Carregado na IA central para interceptar comandos diários de Sistema Operacional (Copiar, colar, desfazer, minimizar, trocar de janela, salvar, deletar).

---

## ⚙️ Arquitetura e Engenharia Interna

### 1. O Sub-Agente Tradutor (`_ask_ollama_keyboard_expert`)

Comandos de teclado baseados em fala são infinitos ("Copia isso", "Salva o arquivo", "Dá um Alt Tab rápido"). Para não lotar o código com centenas de condicionais `if/else`, a skill invoca o motor Ollama diretamente (`requests.post(format="json", temperature=0.1)`).

- O `KEYBOARD_EXPERT_PROMPT` força a LLM a classificar a ação em 4 silos operacionais na API do PyAutoGUI:
  - `hotkey`: Para combinações de atalho simultâneas (Ex: `["ctrl", "c"]`).
  - `press`: Para batidas secas em teclas solitárias (Ex: `["enter"]`).
  - `write`: Para digitação em massa (Ex: escrever um parágrafo inteiro no Word simulando um teclado humano).
  - `sequence`: O modo Combo. Se o usuário falar *"Jarvis, seleciona tudo e apaga"*, a IA empacota dois passos: um `hotkey` (`Ctrl+A`) seguido de um `press` (`Delete`). A skill processa a fila com micro-pausas de `0.1s` entre cada etapa de forma confiável.

### 2. Gatilho Bi-Fásico de Segurança (`is_dangerous`)

Alguns atalhos (como `Alt + F4` ou `Delete`) destroem o trabalho do usuário. O J.A.R.V.I.S nunca toma ações destrutivas sem permissão explícita.

- O JSON da IA possui a flag `"is_dangerous": true`.
- Se esta flag vier ativada, a skill paralisa a execução. Ela salva a árvore de passos dentro do cache de estado global `_state["pending_keyboard_action"]` e retorna ao sistema de voz: *"Atenção, o comando irá encerrar o app. Deseja prosseguir?"*
- No milissegundo em que o usuário volta a falar, o topo da função `execute()` intercepta o texto. Se houver sinônimos de aceite ("sim", "pode", "prossiga"), a ação é desembargada e executada. Se houver recusa ("cancela", "esquece"), o *cache* é esvaziado.

### 3. Consciência de Contexto Absoluta (Context Awareness)

O Jarvis não atua às cegas. Ele tem percepção tátil da máquina graças à mescla de bibliotecas de baixo nível:

- **C-Types API do Windows (`get_active_window_title`)**: A skill injeta requisições DLL direto no Kernel via `ctypes.windll.user32.GetForegroundWindow()`. Isso permite que o J.A.R.V.I.S descubra o nome exato da aba do Chrome ou do documento no VSCode que o usuário está olhando, gerando respostas incríveis como: *"Atalho executado em 'Projeto.txt - Bloco de Notas'"*.
- **Leitura Nativa de Clipboard (`get_clipboard_text`)**: Bibliotecas de terceiros para leitura de prancheta frequentemente falham com acentuação e quebram no Python. A skill invoca debaixo dos panos o *PowerShell* (`powershell -NoProfile -Command Get-Clipboard`) para sugar o texto estrito. Se a ação solicitada for "Copiar" (`Ctrl + C`), a skill dá um respiro de `0.2s` para o Windows reagir e depois lê o texto, fazendo o Jarvis falar em voz alta: *"Texto capturado da janela: (trecho do seu texto)..."*.

---

## 🛠️ Manutenção e Boas Práticas (Developer Guide)

- **Failsafe Mecânico do PyAutoGUI**: O sistema injeta explicitamente as diretivas globais `pyautogui.FAILSAFE = True` e `pyautogui.PAUSE = 0.5` logo no topo. Se a IA enlouquecer (Alucinação) e mandar rodar uma sequência perigosa de teclado infinita que trave sua máquina, basta o usuário **puxar fisicamente o mouse em pânico para o canto superior esquerdo da tela (Coordenada 0, 0)**. O PyAutoGUI entenderá isso como um botão de ejetar e forçará uma exceção crítica, matando o script na hora.
- **Limitações do ABNT2 (Teclado PT-BR)**: O PyAutoGUI foi arquitetado originalmente por americanos para teclados US-International. Forçar a entrada de uma `hotkey` envolvendo botões estranhos ou diacríticos (como o `ç` ou `~`) muitas vezes não faz nada. Se precisar criar um comando customizado para injetar texto acentuado, **NUNCA** use "press", use a instrução `"action": "write"` com a string limpa, pois ela interage com a memória virtual do teclado ao invés do código rígido (Scan Code) da tecla mecânica.
