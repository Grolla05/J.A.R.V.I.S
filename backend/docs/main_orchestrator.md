# 🎬 main.py (Orquestrador)

O arquivo `main.py` atua como o **Orquestrador Central** (ou a Unidade de Processamento Central) do J.A.R.V.I.S. Ele é a ponte principal entre o ecossistema Python (Machine Learning, Hardware, STT/TTS) e o frontend em JavaScript (React/PyWebView). O `main.py` inicializa todos os subsistemas essenciais, configura a janela gráfica nativa, gerencia as threads em background e mantém o ciclo de vida ininterrupto da aplicação.

## 🎯 Responsabilidades Principais

1. **Bootstrap & Checagem de Sanidade**: Garante que recursos críticos (pastas de banco de dados, build do frontend `index.html`, configurações base) existam e estejam íntegros antes da inicialização propriamente dita, abortando de forma segura em caso de falha.
2. **Carregamento Seguro de Módulos (Cognição)**: Importa serviços pesados (Escuta, Fala e Cérebro) de forma encapsulada em blocos `try...except`, prevenindo que a aplicação silenciosamente quebre e alertando caso haja dependências faltantes.
3. **PyWebView Bridge & GUI Setup**: Instancia a janela nativa do Sistema Operacional. Configura as dimensões, propriedades (como janela sem bordas/`frameless=True`) e acopla a classe `JarvisAPI` (Bridge) para estabelecer comunicação bidirecional com o JS através do objeto `window.pywebview.api`.
4. **Loop Cognitivo Autônomo (`jarvis_auto_loop`)**: Executa o ciclo contínuo onde o JARVIS escuta de forma bloqueante, pensa, e responde. Tudo isso roda isolado em uma thread independente (`daemon=True`), garantindo que a renderização da interface gráfica nunca congele ou sofra gargalos.
5. **Monitoramento de Hardware Proativo**: Inicializa observadores de sistema (`sys_monitor`) que monitoram uso de CPU/RAM em curtos intervalos, possuindo capacidade de disparar interrupções e alertas visuais urgentes direto para a UI.
6. **Gerenciamento de Lifecycle e Shutdown**: Captura eventos de desligamento via voz ("PROTOCOL_SHUTDOWN") ou de interrupções de teclado (`KeyboardInterrupt`), orquestrando o fim das threads e matando o processo de maneira forçada e limpa (`os._exit(0)`).

---

## ⚙️ Arquitetura e Funcionamento Interno

### 1. Sistema de Rastreamento de Sessão (`voice_session_id`)

Logo na primeira linha útil, o script gera um **Token de Sessão Criptográfico Único** (`secrets.token_urlsafe(32)`).
Este token identifica unicamente toda a vida útil daquela execução. Cada vez que o usuário fala e o Jarvis responde, esses registros são salvos no banco de dados SQLite atrelados a este token. Isso permite que no futuro o LLM possa buscar ou restaurar o "contexto específico" de uma conversa passada, agrupando a interação não só por data, mas por sessão real de uso interativa.

### 2. Inicialização da Interface Nativa (`start_jarvis`)

A função principal que levanta o sistema, realizando:

- **Verificação de Build Frontend**: Confere se `frontend/dist/index.html` existe. Se não existir, exibe um erro nativo de fallback e interrompe.
- **Configurações PyWebView**: A janela é criada inicialmente em `1280x800` e é maximizada logo após o evento `shown`. É configurada para possuir fundo estritamente preto (`#000000` para transições limpas), impedir o reposicionamento simples pelo conteúdo (`easy_drag=False`) e não ter molduras de sistema operacional (`frameless=True`), forçando a imersão total.
- A thread principal do Python é delegada inteiramente para a interface gráfica (bloqueante). Por isso, logo antes da UI disparar, o cérebro cognitivo é lançado via `jarvis_auto_loop` em uma thread apartada.

### 3. O Ciclo de Auto-Escuta (Thread Cognitiva Isolada)

A verdadeira "consciência" do sistema reside na função `jarvis_auto_loop`. O fluxo lógico segue esta ordem estrita:

1. **Delay de Estabilidade**: Aguarda 4 segundos de boot para assegurar que a DOM do React e o Webview estejam totalmente prontos para receber mensagens.
2. **Conexão de Monitoramento**: Acopla o callback (`ui_aware_alert_callback`) ao monitor de sistema e inicia o ciclo de verificações autônomas (a cada 3 segundos).
3. **Boot Dinâmico e Saudação**:
   - Procura de forma inteligente nas *skills* globais se a habilidade nativa de relatórios do sistema (`SYSTEM_REPORT`) existe.
   - Se existir, delega a saudação inicial e a análise do boot diretamente a esta habilidade via gatilho `"boot_protocol_auto"`.
   - Se não existir, o sistema possui uma lógica segura de *fallback*, buscando localmente na memória (Obsidian) pelo nome do usuário para uma saudação genérica.
4. **O Loop Infinito (`while is_running`)**:
   - `listen()`: Congela a thread local em estado "Ouvindo" aguardando detecção de despertar do microfone (VAD + Whisper).
   - **Log no Banco de Dados**: Assim que reconhece a voz do usuário (`command`), armazena o evento no banco.
   - **Processamento (`execute_command`)**: Submete a string para avaliação cerebral.
   - **Protocolo de Shutdown (`PROTOCOL_SHUTDOWN`)**: Se o comando de encerramento for invocado, silencia os módulos de audição, processa uma mensagem de saída ("Até logo"), desliga a GUI via `window_instance.destroy()` e invoca `os._exit(0)` para derrubar de vez os processos subjacentes.
   - **Resposta Vocal (`speak`)**: Sincroniza a atualização de eventos da interface para mudar o estado para `"SPEAKING"` somente no exato momento que o áudio começar a tocar fisicamente via o callback `on_audio_start`. A audição principal é desativada (`ear_pause()`) durante a fala para prevenir "auto-alucinação" (O microfone escutando as próprias respostas do sistema) e religada imediatamente ao fim da reprodução (`ear_resume()`). Todos os textos da IA são paralelamente salvos no log de interações.

### 4. Comunicação Reativa Frontend-Backend (UI Updates)

O orquestrador implementa duas pontes de comunicação direta (via injeção de `evaluate_js`) do Python para o DOM do frontend:

- **`update_ui(status, message)`**: Sanitiza e formata as strings enviadas pelo Python (escapando aspas, quebras de linhas, etc, para prevenir um erro de sintaxe no JS do lado de lá). Em seguida, chama nativamente `window.receiveStatus(status, message)`. Transita os painéis HUD para os status `LISTENING`, `PROCESSING` ou `SPEAKING` de forma assíncrona.
- **`ui_aware_alert_callback(message, is_proactive, is_status_signal)`**: Um handler dedicado que gerencia as manifestações do hardware na interface:
  - Pode ligar e desligar a red light do HUD (emissão de `CRITICAL_START`) sem interromper processos de fala ou threads ativas.
  - Ouve eventos urgentes e os lança para a tela via `api.send_frontend_alert()`.

---

## 🛠️ Manutenção e Boas Práticas (Developer Guide)

1. **Proteção Contra Crashes de UI**: Nunca realize chamadas cruas ou pesadas à interface após acionar qualquer variável ou método de desligamento (como setar `is_running = False`). Chamar uma janela webview inativa gera crash total. Sempre confie no wrapper `update_ui()`, o qual internamente atua protegendo o envio.
2. **Importação Lenta / Contextual**: Para manter o tempo de start-up o mais veloz possível e evitar alocação precoce de VRAM, **nunca** efetue importação global de bibliotecas focadas em *Deep Learning* ou utilitários complexos e lentos dentro de `main.py`. Mantenha essas importações sob lazy-loading no escopo interno das `skills`, ou dentro de `services` protegidos com blocos `try`.
3. **Ponteiro de Threading (`daemon=True`)**: O J.A.R.V.I.S possui forte restrição à threads órfãs. Todo cron, scheduler ou socket contínuo em background novo que precise ser acoplado no `main.py` obrigatoriamente tem que nascer com `daemon=True`. Garantindo que um simples `os._exit(0)` desintegre a tarefa no mesmo momento da janela.
4. **Segurança do Loop (Throttling)**: A proteção `try-except` envolvendo todo o ciclo da escuta no `jarvis_auto_loop` obriga que erros inesperados entrem em repouso por `time.sleep(1)`. Sem esta trava microscópica, um travamento sequencial em cadeia da IA criaria um superaquecimento instantâneo no processo Python. Mantenha isso intocado.
