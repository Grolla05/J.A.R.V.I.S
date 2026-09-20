# ⚛️ J.A.R.V.I.S. System Interface (Front-End V2.0)

> **"Às vezes, é preciso correr antes de andar." — Tony Stark**

Bem-vindo à documentação oficial do Front-end da interface J.A.R.V.I.S. Este projeto é uma aplicação **React + Vite** altamente otimizada, arquitetada para criar uma experiência de HUD (Heads-Up Display) cinematográfica e de altíssimo rendimento, rompendo as barreiras entre o SO nativo (Python/Backend) e o ambiente web.

Diferente de sistemas baseados pesadamente em WebGL puro que estrangulam a CPU/GPU em tarefas textuais (RAG/LLM), este frontend introduz um paradigma Híbrido (2.5D Canvas + Framer Motion) desenhado sob as rigorosas métricas de UX/UI do *Apple Human Interface Guidelines (HIG)*.

---

## 🛠 Tech Stack (Tecnologias)

A base do sistema foi escolhida com precisão cirúrgica para balancear velocidade de renderização e conforto ao codar:

* **Core:** React 18 (construído sobre a esteira ultrarrápida do Vite).
* **Estilização:** Tailwind CSS (focado em construtores visuais de vidro, tipografia modular e dicionários de cor rígidos).
* **Animações & Física:** Framer Motion (O motor que dita as leis da física neste SO: Molas, inércia, transições de montagem e layout dinâmico usando o `AnimatePresence`).
* **Renderização Gráfica:** HTML5 Dual-Canvas API (Renderização 2.5D Híbrida via Software) - Usado para dar vida orgânica ou estrita aos Reatores sem o gargalo do WebGL.
* **Integração Nativa:** PyWebView API Bridge (`window.pywebview.api`) - O túnel de comunicação que elimina a necessidade de Fetch/Rest APIs, unindo React a Python.
* **Parsing Semântico:** React Markdown + KaTeX (Garante a descompressão de tokens de LLM e matemática pura renderizada esteticamente na tela).

---

## 📚 Documentação Estendida (`/docs`)

Para não poluir o README raiz, nós fragmentamos a engenharia minuciosa desta interface em 6 cadernos essenciais dentro do diretório `/docs`. Se você deseja contribuir com o motor principal, **leia-os na ordem:**

1. **[01-architecture-overview.md](./docs/01-architecture-overview.md):** O mapa geral, englobando a `App.jsx`, State Machines e a fundação UI de *Glassmorphism* que dita as regras do sistema.
2. **[02-bridge-api.md](./docs/02-bridge-api.md):** A ponte do pânico. Detalha como o frontend escuta, responde e sobrevive (mock fallbacks) à comunicação com a engine Python (`BridgeAPI.js`).
3. **[03-core-visuals.md](./docs/03-core-visuals.md):** Um mergulho matemático na renderização 2.5D do Reator Aura e do Pixel Reactor, explicando Z-Sort e Throttling Inteligente de GPU.
4. **[04-chat-system.md](./docs/04-chat-system.md):** Detalhamento do ecossistema de bate-papo, parseamento de Markdown/LaTeX, edição temporal de mensagens e os segredos do streaming em tempo real.
5. **[05-code-environment.md](./docs/05-code-environment.md):** Explora o painel da IDE embarcada, as simulações de Terminal em React, Zebra-striping do parser de código e Propagação de Tema de Emergência.
6. **[06-skills-and-telemetry.md](./docs/06-skills-and-telemetry.md):** Explica a física Drag-and-Drop dos painéis da HUD e a sincronização otimista ("zero-lag") das switches de Skills.

---

## 📂 Estrutura Físcia do Projeto

Abaixo segue a fundação de pastas do ecossistema front-end. O paradigma dita que cada módulo grande (Chat, Code, Telemetria) vive isolado dentro de seu próprio diretório em `/components`.

```bash
src/
├── components/
│   ├── REACT_CORE/          # Motores gráficos customizados
│   │   ├── LiquidAuraReactor.jsx   # O Reator Orgânico Principal (2.5D Canvas)
│   │   └── JarvisPixelReactor.jsx  # Reator em Pixel Art (Modo Analítico)
│   ├── CHAT/                # Ecossistema do Modo Chat
│   │   ├── ChatPanel.jsx           # Master Controller do Streaming LLM
│   │   ├── MessageList.jsx         # Motor de renderização de bolhas e histórico
│   │   ├── ChatInput.jsx           # Caixa de comando e anexos globais
│   │   ├── MarkdownComponents.jsx  # Override global das tags de Markdown
│   │   └── ChatSidebar.jsx         # Sidebar Glassmorphic de sessões salvas
│   ├── CODE/                # Ecossistema do Modo Engenharia (IDE)
│   │   ├── CodePanel.jsx           # O ambiente de revisão de código
│   │   ├── CodeEditor.jsx          # Leitor monospaced em zebra-striping
│   │   └── CodeConsole.jsx         # Terminal simulado para execução de skills
│   ├── TELEMETRY/           # Widgets e Monitoramento
│   │   ├── LiveTelemetry.jsx       # Motor de Polling assíncrono do J.A.R.V.I.S
│   │   └── TelemetryWidget.jsx     # Wrapper arrastável (Draggable) do Framer Motion
│   └── HUD/                 # Camada Estática Global
│       └── HeaderNavigation.jsx    # Troca Global de Modos (Chat, Talk, Code)
├── hooks/
│   └── BridgeAPI.js         # Interceptador Singleton IPC para o Backend Python
├── utils/                   # Variáveis auxiliares de inércia e molas
├── App.jsx                  # State Machine Root (Modos, Cores e Loop Principal)
└── index.css                # CSS puro (Scrollbars vítreas, Variáveis CSS, Backgrounds)
```

---

## 🎛 Diretrizes Visuais (Estilo de Código e Apple HIG)

A UI do projeto segue **Regras Draconianas de Apple Human Interface Guidelines** atreladas à imersão Sci-fi. Ao desenvolver novos componentes, nunca desobedeça as três leis:

1. **Física de Mola Absoluta (Spring Physics):** Transições de CSS lineares não existem aqui. Componentes interativos DEVEM ter massa e inércia usando o pacote *Framer Motion*. Quando o usuário clica num botão, ele não "diminui", ele afunda elasticamente como um botão de hardware real de liga de titânio (ex: `whileTap={{ scale: 0.95 }}`).
2. **O Império do Vidro (Glass & Claymorphism):** Cores chapadas e sólidas são proibidas no backplate. Tudo é construído usando `backdrop-filter: blur(20px)` atrelado a saturações intensas e fundos quase invisíveis (`rgba(255,255,255, 0.05)`). Componentes ativos usam Claymorphism: múltiplas camadas de sombreamento Inset e bordas luminescentes para parecerem tridimensionais mesmo estando num renderizador 2D.
3. **Transições Graciosas (AnimatePresence):** Elementos que nascem ou morrem no DOM (novas abas, modais, sub-widgets) jamais piscam ou cortam na tela seca. Eles entram com opacidade fade-in atrelada à movimentação no Eixo Y/X garantindo ausência total de estresse visual ao usuário.

---

## 🚀 Instalação e Execução

Você pode, e deve, trabalhar na UI sem estar com a monstruosidade do backend local (Llama, Python, SQLite) pesando em seus ombros.

**1. Instale as dependências essenciais do pacote:**

```bash
npm install
```

**2. Rode o servidor de desenvolvimento veloz (Vite):**

```bash
npm run dev
```

**3. Build para Produção (A Preparação):**

```bash
# Isso minimificará, ofuscará e embalará o front dentro da pasta /dist,
# que é a exata pasta onde o pywebview fará a leitura no Host final.
npm run build
```

---

## ⚠️ Notas Críticas de Integração

* **Ponte Mockada:** Se você rodar a interface direto pelo browser (`localhost:5173`), a `BridgeAPI.js` falhará intencionalmente em encontrar o objeto local `window.pywebview`. E ao invés de quebrar, ela **ativará seus Mock Fallbacks automaticamente**. A UI fingirá que o servidor está vivo, gerando chats falsos, sessões fantasma e simulação temporal de logs para que seu fluxo de trabalho frontend seja ininterrupto.
* **O Casamento Real:** Para experimentar o software em sua forma verdadeira, você deve executar o passo 3 (`build`), descer para a pasta do seu Backend e invocar o script root Python. O J.A.R.V.I.S fundirá os mundos num executável sem bordas nativo ao seu sistema.
