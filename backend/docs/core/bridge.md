# 🌉 bridge.py (Ponte Bidirecional PyWebView)

O arquivo `bridge.py` expõe a classe `JarvisAPI`, que funciona como a **Ponte Neural Bidirecional** entre o núcleo pesado do Python (Sistema Operacional, LLM, Banco de Dados, Sensores) e a interface gráfica baseada em React (Renderizada via PyWebView). Tudo o que o Javascript precisa solicitar ao computador hospedeiro — ou vice-versa — obrigatoriamente passa por esta classe.

## 🎯 Responsabilidades Principais

1. **Exposição Nativas ao DOM**: Ao injetar a instância de `JarvisAPI` no PyWebView, o JavaScript do frontend ganha "superpoderes" e passa a poder executar Python nativo simplesmente através da chamada global `window.pywebview.api.nome_da_funcao()`.
2. **Telemetria de Baixa Latência**: Prove uma rota ultrarrápida (`get_telemetry()`) que o React interroga repetidamente (geralmente via timers de requisição de animação) para obter o status de hardware em tempo real (CPU, RAM, GPU, Disco, Bateria).
3. **Gestão de Controle da Janela**: Concentra o acesso de redimensionamento e ciclo de vida da interface (`minimize`, `toggle_maximize`, `shutdown`).
4. **Comunicação Multithread (Streaming)**: Processa os comandos de texto longos despachados pelo usuário através de threads secundárias (para não congelar a interface), fatiando as respostas do LLM em pedaços contínuos (*streaming*) que são devolvidos em tempo real para a tela.
5. **Acesso Direto ao Banco de Dados (CRUD do Chat)**: Roteia o frontend direto para o SQLite para funções interativas como carregar histórico, deletar mensagens, alterar títulos e favoritar (pinar) conversas.
6. **Notificações Push Reversas (Backend -> UI)**: Diferente de APIs REST tradicionais, esta ponte não é passiva. O Python pode forçar atualizações no React executando código Javascript dentro do WebView usando o comando `window.evaluate_js()`.

---

## ⚙️ Mapeamento de Funções e Arquitetura

### 1. Sistema de Áudio e Controles

- **`set_active_mode(mode)`**: Interage diretamente com a arquitetura de voz do JARVIS (`services.listen`). Se o usuário clica no frontend para usar modo texto, o backend invoca `ear_pause()` para mutar fisicamente o microfone. Se for `"talk"`, aciona `ear_resume()`.

### 2. Notificações e Interrupções Proativas

- **`send_frontend_alert(level, message)`**: Quando o núcleo detecta perigo sistêmico, esta função é chamada. Ela cria e despacha um evento assíncrono nativo (`CustomEvent('JARVIS_SYS_ALERT')`) na árvore do DOM, forçando o React a exibir um *toast* ou *popup* vermelho sobrepondo a UI, sem o usuário ter requisitado nada.
- **`set_hud_state(is_critical)`**: Dispara `window.updateHudState(true/false)` no Javascript para animar/trocar globalmente a paleta de cores ou estado do *HUD* do JARVIS para modo Crítico.

### 3. Gestão de Habilidades Dinâmicas (Skills)

- **`get_skills()`**: Lê em tempo real da memória viva do sistema (`manager.skills`) quais módulos de inteligência estão carregados e cruza com a tabela de permissões no SQLite (`disabled_skills`, `disabled_categories`). Ele classifica os módulos esteticamente com Ícones (⚡, ⚙️, 🏠, 📅, 🌐) formatando a entrega numa grande lista estruturada JSON (Categorias -> Módulos) para o frontend montar a tela de configurações.
- **`toggle_skill` / `toggle_category`**: Liga ou desliga *skills* e grupos de *skills*, gravando no banco `db.save_config`.

### 4. A Mecânica do Chat (Streaming Multithread)

O método mais complexo da classe é o **`chat_message(text, session_id)`**:

- Quando o usuário digita na UI, esta função lança uma nova `threading.Thread(target=_process, daemon=True)`.
- **Persistência**: Registra imediatamente no SQLite (`db.log_interaction`) o input do usuário atrelado ao Token da Sessão.
- **Streaming Seguro**: Chama `execute_command_stream()` e entra em um laço `for chunk in ...`. Para cada palavra/pedaço que o modelo produz, a ponte executa:

  ```python
  # O Python injeta os pedaços escapados no browser:
  safe_chunk = chunk.replace("\\", "\\\\").replace("'", "\\'").replace('"', '\\"').replace("\n", "\\n")
  js_code = f"if(window.receiveChatStream) {{ window.receiveChatStream('{safe_chunk}', ..., ...); }}"
  self._window.evaluate_js(js_code)
  ```

- **Fechamento e Log**: Ao fim do stream completo, ele salva a resposta maciça inteira novamente no banco de dados e envia uma flag booleana de término (`is_last = true`) para a UI parar a animação de "digitando".

### 5. Manipulação Intensa de Sessões e Histórico (SQLite)

A ponte contém vasto acesso direto SQL para gerenciamento do "Cofre" de histórico de chats:

- **`get_chat_history`**: Extrai interações de uma sessão específica.
- **`delete_history_from` / `update_history_message`**: Permitem edição de log e remoção se o usuário apagar mensagens na interface.
- **`update_session_title` / `toggle_session_pin`**: Manipulações de metadados da tabela `sessions` via chaves `ON CONFLICT DO UPDATE`.
- **`get_recent_sessions`**: Filtra inteligentemente o histórico visual para a *Sidebar*, ignorando sessões vocais automáticas (`WHERE h.session_id NOT LIKE 'voice_%'`). Ele possui um sistema de *fallback* automático caso a sessão nunca tenha sido batizada pelo LLM, extraindo o conteúdo da primeira mensagem que o usuário disse para titular o chat.

---

## 🛠️ Manutenção e Boas Práticas (Developer Guide)

- **Sanitização de Strings (XSS Acidental)**: NUNCA crie chamadas contendo textos variáveis dentro de `evaluate_js` sem utilizar escape severo de caracteres (`replace("\n", "\\n")`). Se a resposta do Ollama contiver uma simples aspa, isso irá quebrar a injeção JS na tela e o frontend ficará paralizado sem erro no Python.
- **Threading Mandatória**: O ambiente do PyWebView é sensível a bloqueios de thread principal (Window GUI). Se for criar funções novas em `JarvisAPI` (como: `baixar_arquivo()`, `processar_video()`), lembre-se de empurrá-las para threads separadas com `daemon=True`, caso contrário, a interface de usuário congelará por completo exibindo a placa de "Não respondendo" do Windows.
- **Telemetria Otimizada**: O método `get_telemetry` usa instâncias referenciadas do mesmo objeto `sys_monitor` inicializado no arquivo `main.py`. Isso garante que as medições de CPU/RAM mostradas na tela sejam as exatas medições analisadas no "cérebro cognitivo" em background, evitando chamadas concorrentes massivas no Kernel do sistema operacional.
