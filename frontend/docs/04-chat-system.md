# 💬 Chat System (Modo Foco e Streaming)

O Chat System (ativado pela flag `activeMode === 'chat'`) é onde a mágica semântica e a experiência literária do LLM brilham. Projetado para emular o rigor estético do ecossistema Apple, este ambiente prioriza legibilidade, retenção de sessões nativas e fluxo (stream) em tempo real, empurrando o reator 3D principal para fora do foco visual central.

O sistema inteiro é estruturado modularmente em `src/components/CHAT/`.

---

## 🏛️ O Controlador Central (`ChatPanel.jsx`)

É o Maestro do fluxo conversacional, gerindo todo o estado que flui para as pontas. A complexidade do ChatPanel vai muito além de guardar um `array` de strings:

### 1. Sistema Criptográfico de Sessões

Cada chat precisa de um identificador robusto para o banco SQLite do backend (para que contextos não vazem). O painel roda a função `generateSessionToken()`, que tenta acessar o módulo de hardware do browser (`window.crypto.getRandomValues`) e criar um hash Base64 seguro de 32 bytes para blindar a nova conversa.

### 2. Streaming em Tempo Real (Chunking)

Para que a IA não pareça engasgada ao pensar, o `ChatPanel` injeta um ouvinte de streaming global:

* `window.receiveChatStream = (chunk, isFirst, isDone) => {}`
* No primeiro pacote (`isFirst`), ele cria a bolha falsa de ID `streaming-msg`.
* Nos próximos ciclos, ele apensa velozmente o chunk textual ao estado React sem re-renderizar todo o domo estrutural.
* Quando recebe `isDone`, oficializa o ID da mensagem com um Unix Timestamp limpo.

### 3. Histórico e Manipulação no Tempo (Time-Travel)

Se o usuário cometeu um erro de digitação no prompt, ele clica em **Editar** (`handleEditMessage`). O `ChatPanel` não apenas altera a UI:

* Ele avisa ao PyWebView via IPC para deletar (`delete_history_from`) todas as mensagens subsequentes no SQLite, trunca o Array local e envia a nova mensagem ao modelo (Ollama/Claude) como se nada tivesse acontecido.

---

## 📚 A Interface de Conversa

### `ChatSidebar.jsx` (Navegação & Memória)

Painel lateral construído puramente de *Vidro* (`backdrop-blur(20px) saturate(180%)`).

* **Integração:** Consome a tabela de chats persistidos (`get_recent_sessions`) e agrupa entre *Fixados (Pinned)* e *Recentes*.
* **Menu de Contexto Nativo:** Clique direito nas conversas desativa a janela flutuante cinza e morta do Windows/OS e injeta um pop-up de `Framer Motion` flutuante no `X,Y` do mouse. Permite **Renomear Chat** e **Fixar/Desafixar**, espelhando imediatamente no banco SQLite.
* **Produtividade (Shortcut):** Um listener ouve perpetuamente por `Ctrl+K` (ou `Cmd+K` no macOS) para disparar instantaneamente uma "Nova Conversa" de qualquer lugar do software.

### `MessageList.jsx` (O Campo de Batalha Visual)

É quem de fato mapeia e desenha as *Bubbles*.

* **Design assimétrico:** As bolhas de quem envia ficam esticadas à direita usando o accent (`cyan`, `purple` de acordo com o estado do Jarvis), e as do Jarvis alinham à esquerda num tom de vidro neutro (`bg-white/5`).
* **Auto-Scroll Inteligente:** Possui uma Ref atracada ao fim da lista que rola suavemente em cada ciclo do streaming text.
* **Micro-Ações Ocultas:** Abaixo da bolha, ao dar hover, surgem botões de vidro minúsculos com feedback tátil de `lucide-react`: *Copiar (Check Verde)*, *Editar (só User)* e *Regenerar (só Jarvis)*.

---

## 📝 Parsing Pesado: Markdown e Matemática (`MarkdownComponents.jsx`)

Para suportar código escrito pelo JARVIS e documentação algorítmica ou física complexa, o Markdown passa por um tratamento de choque:

### 1. Matemática (KaTeX / LaTeX)

Equações escritas pelo modelo como `\\[ E = mc^2 \\]` são duras pro interpretador base. A função `preprocessMarkdown` intercepta isso em milissegundos e converte para blocos padrão legíveis. Então a cadeia de Plugins do `react-markdown` entra em ação: `remark-math` isola a matemática e `rehype-katex` injeta a árvore de estilo puro, criando visualização de fórmulas perfeitas (iguais aos livros de cálculo).

### 2. Substituição Estética (MD_COMPONENTS)

O arquivo re-escreve todos os retornos padrão do HTML:

* As **tabelas** (`table`, `th`, `td`) perdem bordas grosseiras e recebem filetes translucidos de 1px.
* Os **textos monoespaçados** em linha (`code`) ganham tags luminosas azuis simulando terminais.
* **Blocos Gigantes** (`pre`) recebem caixas com sombras pesadas e sombreamento inset para se destacarem brutalmente no fundo da tela.

---

## ⌨️ Comando e Anexos (`ChatInput.jsx`)

Mais do que apenas disparar botões:

* A tecla `Enter` sozinha engatilha o `onSend`, mas o clássico `Shift+Enter` continua preservando a quebra de linha.
* **Integração Nativa de Arquivos**: O botão do clipe engana a segurança estrita do browser ao dar *"click invisível"* num componente nativo `<input type="file" hidden />`, invocando o File Explorer do Windows/Mac.
* Cada arquivo lido entra como um **FileChip**, renderizando botões brilhantes customizados para que futuramente o Backend possa analisar e usar RAG nestes PDFs ou Códigos que o usuário anexe à mensagem.
