# 🖨️ logger.py (Sistema de Observabilidade)

O arquivo `logger.py` engloba a biblioteca padrão `logging` do Python dentro da classe `JarvisLogger`. Ele é a artéria exclusiva de saídas de texto do sistema, funcionando de maneira onipresente. Ao centralizar todo o *output* do J.A.R.V.I.S, ele garante consistência visual, auditoria, cores nativas e proteção sistêmica contra encodings agressivos do Windows.

## 🎯 Responsabilidades Principais

1. **UX de Terminal via `colorama`**: O J.A.R.V.I.S substitui completamente a dependência de `print()` nativos. Os níveis de log injetam cores hexadecimais automáticas que auto-resetam após a mensagem, criando um painel tático para o desenvolvedor (Ex: Cyan para processos paralelos, Verde para sucesso, Vermelho vivo para alertas).
2. **Prevenção de Quebras de Kernel no Windows**: O prompt de comando tradicional (CMD/Powershell) do Windows possui a tendência de operar sob padrão `cp1252`. Se o LLM responder um emoji ou símbolo russo, um `print` padrão jogará um famigerado `UnicodeEncodeError`, matando a thread. O logger previne isso.
3. **Escrituração Dupla (Multiplexing)**: O módulo escreve tudo simultaneamente em dois canais — de forma formatada esteticamente para a tela, e de forma crua, técnica e verbosa para um arquivo real em disco dentro da pasta dinâmica do sistema.

---

## ⚙️ Arquitetura e Engenharia Interna

A classe opera sob o Padrão de Projeto *Singleton*. Ao fim do arquivo, ele exporta `log = JarvisLogger()`.

### 1. O Padrão Singleton Intocável (`__new__`)

O método dunder `__new__` foi sobrescrito para assegurar que, independentemente se você importar `from core import log` em 50 arquivos paralelos, nenhum deles recriará uma instância nova ou canais redundantes de gravação. Existe também uma trava secundária (`if self.logger.handlers: return`) dentro de `_setup_logger()` que aborta a recriação do logger caso ele sofra um "reload" forçado.

### 2. O Bypass de Encoding (Terminal Seguro)

O maior truque de engenharia do arquivo acontece na declaração do `console_handler`. Ele não aponta puramente para `sys.stdout`, e sim reconstrói o arquivo do ponteiro raiz da máquina (File Descriptor 1):

```python
console_handler.stream = open(
    sys.stdout.fileno(),
    mode='w',
    encoding='utf-8',
    errors='replace', # Salvaguarda de crash
    closefd=False,
    buffering=1       # Força a escrita imediata
)
```

Se a fonte enviar um símbolo alienígena indesejado pelo console, a flag `errors='replace'` transformará o caractere em uma interrogação `?` no terminal, em vez de desligar fatalmente toda a aplicação IA.

### 3. Diferenciação de Handlers (Tela vs Disco)

A observabilidade funciona com dois *formatters* divergentes para servir dois propósitos:

- **`console_formatter`**: `%(asctime)s | %(levelname)s | %(message)s`. Suprime o "Nome do Logger" e a "Data", mostrando puramente a hora `%H:%M:%S` para manter o painel clean e visualmente agradável. O injetor de cor da `colorama` (ex: `Fore.CYAN`) atua aqui nas chamadas das funções-wrapper (`log.info`, `log.debug`).
- **`file_formatter`**: O salvamento em disco não possui a sujeira dos códigos ANSI de cores da colorama. O formato fica verboso: `%(asctime)s - %(name)s - %(levelname)s - %(message)s`, incluindo a data absoluta e identificação da aplicação raiz.

### 4. Nomeação Dinâmica de Arquivos e Hierarquia

O nível matriz do logger depende passivamente do `.env`. Se `settings.DEBUG` for ativo, ele desce o sarrafo do pacote `logging` para capturar `logging.DEBUG`. Se desligado, o limitador bloqueia mensagens pequenas na própria raiz poupando ciclos de CPU.
O arquivo físico de *log* é nomeado instantaneamente pegando o dia do boot (`f"jarvis_{datestr}.log"`) e sendo despachado para `settings.DIR_LOGS`.

---

## 🛠️ Manutenção e Boas Práticas (Developer Guide)

- **Abolição Completa do `print()`**: O `print()` nativo quebra o princípio de multiplexing da auditoria (não vai pro disco), é altamente frágil à caracteres Unicode no Windows, e fura a formatação visual do painel. Qualquer desenvolvedor adicionando *Skills* ou *Services* novos deve declarar a importação do log (`from core import log`) e despachar `log.info()`.
- **Dívida Técnica de Rotação (Log Rotation)**: Atualmente, o projeto importa silenciosamente no topo `from logging.handlers import TimedRotatingFileHandler`, mas o motor utiliza instâncias primárias estáticas (`FileHandler` comum). Isso se dá pois o Jarvis atual raramente opera em Uptime ininterrupto de 30 dias sem reboot. Se o uso do projeto escalar para nuvem, substitua no método de setup o `FileHandler` pelo *TimedRotating* ativo para forçar a partição de arquivos físicos à meia-noite.
- **Isolamento de Níveis**:
  - `log.debug()`: Exclusivo para despejos matemáticos, tracking de variáveis em laços For de LLM e I/O de streaming.
  - `log.warning()`: Usado quando o sistema perde pacotes na internet, ou tem demoras severas, mas continuou rodando.
  - `log.critical()`: Vermelho forte (`Style.BRIGHT`). Reservado primariamente para falhas catastróficas iminentes antes de um `sys.exit(1)`.
