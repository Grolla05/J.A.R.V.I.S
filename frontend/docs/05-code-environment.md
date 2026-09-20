# 💻 Code Environment (Modo Engenharia e IDE)

O Code Environment é acionado através do seletor `code` na `HeaderNavigation`. Foi construído como um **mini-IDE embarcado (Read-Only)** que permite ao J.A.R.V.I.S. (e opcionalmente ao Claude 3.5 Sonnet) expor scripts estruturais de Python ou manifestos lógicos para o usuário revisar antes de um deploy, simulando a estética de uma tela HUD de monitoramento retro-modernista.

Visualmente, a transição para este modo oculta o Reator Líquido e invoca o `JarvisPixelReactor`, evidenciando que o sistema saiu de um contexto conversacional orgânico e entrou num regime estritamente lógico e matricial.

Todos os módulos relacionados encontram-se em `src/components/CODE/`.

---

## 🏗️ Painel Central Controlador (`CodePanel.jsx`)

É o container primário, ancorado no terço inferior da tela, feito de *Vidro Profundo* (`backdrop-blur-[30px] shadow-[0_40px_100px_rgba(0,0,0,0.8)]`) e utilizando estritamente fonte `mono`.

### Gerenciador Cromático Rígido (`getThemeColors`)

O `CodePanel` difere da flexibilidade do Chat. Ele injeta um **Objeto de Tema** em todos os filhos, forçando-os a obedecer ao estado crítico atual (`jarvisState` e `isCritical`). Esse objeto distribui classes precisas do Tailwind, como fundos de linhas (`lineActive`), bordas de botões (`btnActive`) e acentos textuais. Se há falha termal (`isCritical`), todos os arquivos e prompts viram vermelhos instantaneamente.

### Banco de Dados Simulado (File Mocks)

Enquanto a bridge Python para `os.listdir()` não está injetada na produção local, o Painel contém um mini dicionário em memória que mapeia `brain.py`, `sys_monitor.py` e `obsidian.py` para provar a escalabilidade do sistema em exibir RAG (Retrieval-Augmented Generation) ao usuário.

---

## 📄 A Tríade da IDE (Os Submódulos)

A visualização principal no `CodePanel` é segmentada numa divisão espartana de colunas e painéis utilitários:

### 1. Árvore de Arquivos (`CodeFileTree.jsx`)

* **Hierarquia Linear:** Apresenta a lista de scripts disponíveis na memória de contexto.

* **Micro-Interações:** Utiliza Framer Motion (`whileHover={{ x: 2 }}`) para deslizar blocos levemente no eixo X ao toque do mouse. Os arquivos inativos ganham transparência de texto de 40%, subindo para luz sólida quando invocados (`theme.btnActive`).

### 2. O Editor Simulado (`CodeEditor.jsx`)

Responsável pela visualização rica e limpa do código alvo.

* **Parse Matricial:** Fragmenta a gigantesca string `codeContent` numa iteração matemática por cada quebra de linha `\n`.

* **Zebra-Striping:** O laço de repetição mapeia linhas pares e impares, injetando uma finíssima opacidade (`bg-white/[0.01]`) alternadamente para fadiga ocular zero em grandes blocos.

* **Prompt Holográfico:** A base do editor termina num cursor infinito estilo terminal CLI (`>` `_`) programado com `animate-pulse` do Tailwind para manter a ilusão de um terminal live.

### 3. O Console de Comando (`CodeConsole.jsx`)

Um painel satélite em formato CLI para execução real de scripts do backend.

* **Sistema Assíncrono (`runSkill`):** Exibe rotinas clicáveis (Ex: `System Diagnostic`, `Telemetry Ping`, `Obsidian Sync`). Quando o usuário aciona uma, o componente trava a interação, imprime o comando cru e engatilha um `setTimeout` temporal (simulando latência de SO ou RPC na Bridge) antes de imprimir a resposta (sucesso/falha) em cores verde esmeralda ou vermelho.
* **Auto-Scroll Físico:** Como a janela pode cuspir centenas de logs, uma referência atrelada ao `logEndRef` puxa o scroll vertical para baixo a cada mutação do estado `logs`.

---

## 🦝 Integridade de Grife (Badges de Inteligência)

Os submódulos menores `ClaudeBadge.jsx` e `ClaudeOutput.jsx` exercem papel fundamental na comunicação passiva com o usuário:

* Deixam claro, através de crachás estáticos e pequenos logs inseridos em loop contínuo pelo `CodePanel`, que a inteligência de código operando os nós do projeto provém da Anthropic, enquanto J.A.R.V.I.S atua como o orquestrador do frontend e da comunicação.
* Um script de *interval* engatilha atualizações assíncronas no painel simulado a cada 5 segundos reportando ("Refactoring neural pipe...", "Security protocols verified") para garantir imersão.
