# 🏛️ Visão Geral da Arquitetura (HUD HUD J.A.R.V.I.S.)

O frontend do **J.A.R.V.I.S.** foi projetado como uma **Single Page Application (SPA)** altamente reativa e interativa, focada em entregar uma experiência imersiva de HUD (Heads-Up Display). Em vez de um site tradicional, a aplicação simula o painel de controle e a visão de uma Inteligência Artificial avançada, inspirada em filmes de ficção científica (Iron Man). O design e as animações baseiam-se em física simulada, profundidade 3D e renderização de dados em tempo real.

---

## 🛠️ Stack Tecnológico Detalhado

O ecossistema do frontend foi escolhido para maximizar a performance e a fidelidade visual:

### Core Frameworks

* **[React 19](https://react.dev/) + [Vite](https://vitejs.dev/)**: A base de componentes e empacotamento rápido.
* **[Tailwind CSS v3/v4](https://tailwindcss.com/)**: Motor de estilização utilitário para design ágil.

### Motor de Animação e Interação

* **[Framer Motion](https://www.framer.com/motion/)**: Utilizado estruturalmente (no `App.jsx`) para orquestrar layouts baseados em molas (`spring`) e transições entre modos (Talk/Chat/Code) com `AnimatePresence` e `layoutId`.
* **[Anime.js](https://animejs.com/)**: Direcionado a micro-interações do DOM e elementos matemáticos.

### Gráficos e 3D

* **Ecossistema React Three Fiber**: `@react-three/fiber`, `@react-three/drei` e `@react-three/postprocessing` para a renderização do reator 3D (`LiquidAuraReactor`) e shaders pós-processados diretamente no navegador.

### Processamento de Conteúdo e UX

* **Markdown e Matemática**: `react-markdown`, suportado por `remark-math`, `remark-gfm` e `rehype-katex` para visualização sofisticada de blocos de código e fórmulas em formato LaTeX dentro do painel de chat.
* **Ícones**: `lucide-react`, priorizando ícones limpos e alinhados ao Apple HIG.

---

## 🏗️ Estrutura de Diretórios (`src/`)

O código fonte está modularizado para separar lógica contextual da HUD.

```text
src/
├── App.jsx                 # Controlador principal de estado e layouts
├── index.css               # Estilos globais (.liquid-glass, .hud-critical-mode, animations)
├── components/
│   ├── CHAT/               # Componentes do Modo Conversacional (ChatSidebar, MessageList, ChatInput)
│   ├── CODE/               # Ambiente IDE (CodeConsole, CodeEditor, CodeFileTree)
│   ├── CORE/               # Elementos visuais centrais (JarvisPixelReactor, ReactorMath, NavIcons)
│   ├── TELEMETRY/          # Widgets do HUD de telemetria (CpuRamWidget, NetworkWidget)
│   └── (Raiz)              # Paineis estruturais (ChatPanel, SkillsSidebar, HeaderNavigation, etc.)
├── hooks/
│   ├── BridgeAPI.js        # Gancho para comunicação com o backend PyWebView
│   └── useJarvisTheme.js   # Gerenciamento de temas (se aplicável)
└── utils/
    └── motion.js           # Utilitários globais de animações
```

---

## 🧠 Arquitetura de Estado (`App.jsx`)

Em vez de depender de um roteador clássico baseado em URLs (como `react-router`), o sistema opera sob o conceito de **Estados de Modo**, mantidos centralmente em `App.jsx`:

1. **Modos de Interface (`activeMode`)**:
    * `talk` (Assistente de Voz): O reator orbita ao centro e as legendas (`JarvisSubtitles`) exibem o processamento verbal em tempo real.
    * `chat` (Comunicação Longa): O painel intercala para visualização focada. O reator é deslocado e escalonado suavemente (utilizando animação espacial) para acomodar o `ChatPanel`.
    * `code` (Ambiente IDE): Abre o espaço de trabalho integrado (`CodePanel`) para leitura e aprovação de execuções de software elaboradas pelo J.A.R.V.I.S.

2. **Estados de Agente (`jarvisState`)**:
    Determina o comportamento visual dos reatores. Pode transitar entre `idle`, `listening`, `processing` e `error`.

3. **Estado Crítico (`isCritical`)**:
    Um booleano global que reconfigura toda a aplicação para o **Protocolo Stark**, injetando a classe `.hud-critical-mode` na hierarquia do CSS para pulsar a tela em vermelho, sobrepondo o visual normal.

---

## 🎨 Princípios de Design de Interface (UI/UX)

O frontend adere estritamente a um misto entre **Apple Human Interface Guidelines** e a estética de dados fictícia militar/sci-fi, apelidado de **Apple-Like HUD**:

* **Glassmorphism Avançado**: A classe global `.liquid-glass` (definida em `index.css`) aplica fundos quase translúcidos (`rgba(255, 255, 255, 0.02)`) com blur denso (`backdrop-filter: blur(25px)`). O visual remete a painéis de vidro holográfico.
* **Geometria "Squircle"**: Ausência total de bordas afiadas brutas. Usam-se arredondamentos amplos (ex: `border-radius: 20px`) com contornos sutis de 1px.
* **Spring Physics Total**: Evita-se animações de curva linear (`ease`). As transições espaciais usam parâmetros de mola (`type: "spring", stiffness: 110, damping: 22`) criando inércia, massa e sensação tátil nos elementos virtuais.
* **Feedback Espacial (AnimatePresence)**: Mudanças de tela não cortam de forma seca. Componentes saem (`exit={{ opacity: 0, y: 30 }}`) e entram no DOM fluidamente, enquanto a HUD nunca perde o ritmo de processamento.

---

## 📡 Fluxo de Dados e Bridge API (PyWebView)

Como este React roda embutido numa janela de SO (PyWebView), o fluxo de dados quebra o paradigma tradicional de requisições HTTP REST:

### Injeção de Callbacks (Backend ➔ Frontend)

O backend expõe métodos e injeta estados diretamente no contexto `window` do navegador:

```javascript
window.receiveStatus = (status, text) => {
  setJarvisState(status); // 'listening', 'processing'
  setSubtitlesText(text); // Legendas instantâneas
};

window.updateHudState = (isActive) => {
  setIsCritical(isActive); // Aciona modo de emergência
};
```

### Requisições Assíncronas (Frontend ➔ Backend)

Para enviar comandos (como uma nova mensagem ou troca de modo), o hook `useBridgeAPI` expõe o comando `callApi`:

```javascript
// Exemplo de uso
const { callApi } = useBridgeAPI();
callApi("set_active_mode", "chat");
```

Para obter detalhes de implementação e a lista de mocks virtuais de desenvolvimento, ver o documento: [Bridge API](./02-bridge-api.md).
