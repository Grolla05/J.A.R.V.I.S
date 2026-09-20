# 🔒 Skill: system_security.py

A skill `system_security.py` pertence à categoria **System**. É a linha final de defesa do J.A.R.V.I.S, responsável por gerenciar a camada física de energia (Power Management) e proteção perimetral do núcleo hospedeiro (Windows).

## 📝 Contrato

- **INTENT**: `SYSTEM_SECURITY`
- **PROMPT_TEXT**: Injetada no Cérebro mestre para interceptar qualquer tentativa verbal de desligamento, suspensão ou bloqueio do computador.

---

## ⚙️ Arquitetura e Engenharia Interna

### 1. O Sub-Agente de Defesa (`_ask_ollama_security`)

O motor extrai as intenções táticas através do prompt `SECURITY_DECISION_PROMPT`.

- O retorno JSON é espartano: `{"action": "suspend" | "power_down" | "sentry_mode", "confirmed": bool}`.
- O campo `"confirmed"` permite à IA bypassar os protocolos de segurança dupla se ela notar que o usuário já emitiu o comando de forma imperativa e agressiva (Ex: *"Desliga essa máquina agora!"*).

### 2. Fallback de Off-grid (Sobrevivência)

Diferente das outras skills onde a IA falhando resulta num *"Comando ignorado"*, o módulo de Segurança é construído para sobreviver a perdas severas de conexão ou quedas do servidor Ollama local.

- Se a requisição `requests.post` estourar o limite de tempo (`timeout=5`) retornando `None`, o núcleo não morre. Ele ativa um *Fallback* de expressões de pânico (`if any(x in cmd_lower for x in ["desligar", "encerrar"])`). Isso garante que, mesmo sem cérebro neural, se você gritar *"Desliga!"* o J.A.R.V.I.S fará o *Shutdown* na base do instinto rígido do Python.

### 3. Protocolo: Modo Sentinela (`sentry_mode`)

O ato de travar a estação ("Sair", "Bloquear Tela") é complexo por conta de restrições das APIs de aúdio do kernel NT do Windows:

- **Silenciamento Forçado (`_stop_media`)**: Se você bloquear a tela com um vídeo no YouTube tocando, o Windows continua tocando o som no *Lock Screen*. O Jarvis resolve isso injetando silenciosamente o evento nativo `0xB3` (`VK_MEDIA_PLAY_PAUSE`), pausando tudo na máquina instantaneamente.
- **Micro-threading de Voz (`_delayed_lock`)**: O comando bruto `LockWorkStation()` da *C-Types* assassina imediatamente os canais da placa de áudio do usuário. Se o Jarvis fizesse isso sincronicamente, a fala *"Protocolo Sentinela Ativado"* seria cortada no meio. A skill mitiga isso injetando uma nova `threading.Thread(daemon=True)`. Essa *thread* dorme por precisos `3.5s` (o tempo exato da recitação de áudio do Jarvis terminar) e só então empurra a *LockWorkStation*, criando um bloqueio elegantemente coreografado.

### 4. Protocolo de Desenergização (`power_down_protocol`)

Não existe comando primitivo de "apenas desligue". O J.A.R.V.I.S tem um verdadeiro ritual de "Power Down".

1. **O Gatekeeper (Confirmação Bi-fásica)**: Salvo imperativo, ele injeta `_state["awaiting_power_down"] = True` em memória e paralisa. Ameaça o usuário: *"O protocolo é irreversível. Deseja prosseguir?"*.
2. **Escuta de Pânico**: A função `execute()` da skill passa a agir como ouvinte principal. Se no próximo comando você disser sinônimos afirmativos ("Sim", "Manda ver"), ele engata o tiro fatal. Negativos ("Cancela", "aborta") matam o estado global.
3. **Auto-Zeladoria Antes da Morte**: Antes de desligar o PC, ele invoca as funções da Skill genérica de Limpeza, esvaziando a Lixeira em C-Type silenciosa (`1|2|4`) e vaporizando todo o cache recursivo do `%TEMP%`.
4. **Shutdown Cinematográfico**: O desligamento final é invocado no OS via `shutdown /s /t 15`. A genialidade está no `/t 15` (delay de 15 segundos) e na injeção da flag `/c "Mensagem"`.
   - Os `15s` dão o tempo ideal de a tela do Windows ficar azul, e o Text-To-Speech do Jarvis recitar uma fala imersiva ao fundo: *"Foi um prazer servi-lo, senhor. Sistemas offline."*
   - O `/c` deixa uma marca física do Jarvis escrita na tela azul de desligamento do próprio Windows, informando quantos detritos de lixo ele apagou na sessão atual.

### 5. Suspensão (`suspend_system`)

Suspender a máquina para um estado S3 de energia é feito através da DLL profunda do Windows: `rundll32.exe powrprof.dll,SetSuspendState 0,1,0`. Isso evita os travamentos de permissões do comando de linha `shutdown /h` em algumas máquinas limitadas.

---

## 🛠️ Manutenção e Boas Práticas (Developer Guide)

- **A Risco do Modo Sleep (`SetSuspendState`)**: Dependendo das configurações da placa mãe (BIOS) do usuário em relação a ErP/EuP Ready ou Wake-On-LAN, o comando `powrprof.dll` pode forçar uma Hibernação violenta em vez do modo Dormir (S3). Certifique-se de que a hibernação nativa do Windows no seu PC físico está desativada via CMD Admin (`powercfg -h off`) para que o comando suspenda a máquina rapidamente.
- **Teste Unitário Perigoso**: Cuidado ao rodar testes na Skill de Segurança no meio de um desenvolvimento contínuo. Diferente da maioria dos outros módulos que logarão saídas falsas em tela, disparar testes com `is_confirmed=True` no `power_down_protocol()` vai fisicamente causar o desligamento da sua máquina de desenvolvimento com você programando, correndo risco severo de corrupção de arquivos do Git não salvos.
