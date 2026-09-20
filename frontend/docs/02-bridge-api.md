# 🌉 Bridge API (Integração Frontend-Backend via PyWebView)

A arquitetura do J.A.R.V.I.S. rompe com o modelo cliente-servidor tradicional web (onde o frontend consome APIs RESTful via `fetch` ou `axios`). Como a interface é empacotada e executada nativamente em uma janela de sistema operacional através da biblioteca **PyWebView**, a comunicação é feita através de **Inter-Process Communication (IPC)** injetando JavaScript no DOM.

O coração desse sistema é o Hook Customizado genérico `useBridgeAPI`, localizado em `src/hooks/BridgeAPI.js`.

---

## 🔌 A Implementação do `useBridgeAPI.js`

Este Hook é a única porta de saída (Egress) de dados do React para o motor Python. Ele gerencia o estado da conexão e fornece métodos unificados para requisições com segurança de falha (Mocks).

### 1. Sincronização de Ciclo de Vida (`isReady`)

O WebView nativo não injeta o objeto de comunicação no milissegundo 0 da renderização do React. Para evitar que componentes tentem conversar com o Python antes da ponte estar pronta, o Hook implementa um listener global:

```javascript
const [isReady, setIsReady] = useState(
  !!(window.pywebview && window.pywebview.api)
);

useEffect(() => {
  if (isReady) return;
  const handleReady = () => setIsReady(true);
  window.addEventListener("pywebviewready", handleReady);
  return () => window.removeEventListener("pywebviewready", handleReady);
}, [isReady]);
```

Componentes da UI frequentemente monitoram a variável `isReady` (exportada pelo hook) antes de tentar carregar dados essenciais.

### 2. O Método de Despacho (`callApi`)

Quando a UI precisa solicitar dados ou disparar comandos físicos, ela invoca `callApi(metodo, ...argumentos)`.

```javascript
const callApi = async (method, ...args) => {
  // 1. Caminho Feliz (Produção no PyWebView)
  if (window.pywebview && window.pywebview.api) {
    if (typeof window.pywebview.api[method] === "function") {
      try {
        return await window.pywebview.api[method](...args);
      } catch (err) {
        console.error(`[BridgeAPI ERR] Failed calling ${method}:`, err);
        throw err;
      }
    }
  }

  // 2. Caminho de Fallback (Desenvolvimento em Chrome/Edge Local)
  return getMockFallback(method, ...args);
};
```

---

## 📡 Lista de Métodos e Comandos Mapeados (Frontend ➔ Backend)

Através do `callApi`, o frontend atualmente solicita e despacha os seguintes métodos mapeados:

| Método da API | Argumentos | Retorno Esperado | Propósito / Uso Atual |
| :--- | :--- | :--- | :--- |
| `set_active_mode` | `mode` (String) | `void` | Chamado no `App.jsx` sempre que a UI transita. Pausa a escuta global de voz do JARVIS se a UI entrar em modo onde o áudio não é o foco principal. |
| `get_telemetry` | Nenhum | `Object` (cpu, ram, etc) | Disparado pelo `LiveTelemetry.jsx` para popular os anéis e widgets de consumo de recursos computacionais reais. |
| `get_skills` | Nenhum | `Array<Object>` | Solicitado pela `SkillsSidebar.jsx` para montar a árvore de habilidades ativas (como App Control, Keyboard e System Diagnostic). |
| `get_recent_sessions`| Nenhum | `Array<Object>` | Usado na barra lateral de chats (`ChatSidebar.jsx`) para listar o histórico persistido. |
| `get_chat_history` | `sessionId` | `Array<Message>` | Usado em `ChatPanel.jsx` para restaurar conversas antigas. |
| `update_session_title`| `id, newTitle` | `Boolean` | Chamado no menu de contexto do Chat para renomear sessões no banco de dados. |
| `toggle_session_pin` | `id, isPinned` | `Boolean` | Usado para fixar ou desfixar conversas vitais no painel lateral. |

---

## 🛡️ O Sistema de Mocks Substituto (Fallback Local)

Para manter uma das maiores vantagens do React — o **Hot-Module Replacement (HMR)** instantâneo via Vite em um navegador padrão (Chrome/Firefox) —, o sistema não pode quebrar ao rodar fora da janela embutida.

Se `window.pywebview` for indefinido, a função `getMockFallback` entra em ação, imprimindo um aviso no console e despachando pacotes JSON artificiais precisos que mimetizam as respostas do backend em Python.

* **Mock de Skills:** Devolve uma estrutura JSON complexa, contendo categorias fictícias (`automation`, `system`) e suas *skills* atreladas para validar a renderização das switches (alavancas).
* **Mock de Telemetria:** Usa um gerador numérico flutuante (Ex: `Math.floor(15 + Math.random() * 20)`) para simular flutuações constantes e validar as animações (Anime.js) dos gráficos circulares.
* **Mock de Chat:** Injeta mensagens de boas-vindas falsas e histórico para que a equipe de UI refine o design (Claymorphism e KaTeX) sem aguardar respostas de Modelos Locais como Ollama/Claude.

---

## 📢 Eventos Inversos (Backend ➔ Frontend)

A via contrária de comunicação **não requer polling** por parte do React. Para eficiência e reatividade em milissegundos, o Python avalia código JavaScript ativamente usando `webview.window.evaluate_js()`.

O frontend (`App.jsx`) providencia listeners globais em `window` para absorver o impacto:

1. **`window.receiveStatus(status, text)`**
    Sempre que o microfone muda de estado no backend (de "ouvindo ruído" para "processando áudio"), a HUD muda. Se há tradução e transcrição (Speech-to-Text), a variável `text` renderiza instantaneamente o subtítulo das legendas visuais.
    * *Mapeamento Visual:* `listening` -> `idle` (estado neutro da UI); `processing` -> `listening` (UI acende reagindo à voz).

2. **`window.updateHudState(isActive)`**
    Acionado via Python quando há violação grave (Alertas Terminais, Erros de API Massivos). Altera o booleano `isCritical` para injetar o _Protocolo Stark_ de HUD (vermelho) no CSS.

---
> [!NOTE]
> Adicionar novos métodos no Python requer a exposição deles na classe Api injetada no PyWebView. Lembre-se sempre de adicionar também uma cláusula em `getMockFallback` no frontend para garantir que a equipe de UI consiga estilizar as novas integrações.
