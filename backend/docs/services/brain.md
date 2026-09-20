# 🧠 brain.py (O Cérebro Cognitivo)

O arquivo `brain.py` atua como o **Motor Cognitivo Primário** do J.A.R.V.I.S. Diferente de *chatbots* comuns que operam como repetidores estúpidos repassando texto para uma API em nuvem, o cérebro local do Jarvis foi arquitetado como um **Roteador Semântico com Injeção Dinâmica de Contexto**. Ele "pensa" silenciosemente sobre o input antes de decidir como responder: classificando intenções reais, executando ações no sistema operacional e até julgando alarmes do hardware de forma invisível ao usuário.

## 🎯 Responsabilidades Principais

1. **Gestão do "Jailbreak" de Identidade (`SYSTEM_PROMPT`)**: Armazena as rigorosas leis absolutas de comportamento da IA. Determina que o J.A.R.V.I.S responda de maneira fria, educada e sarcástica, e aplica bifurcações de estilo (Ex: Respostas por Voz são proibidas de usar Markdown; Respostas por Tela são OBRIGADAS a usar formatação pesada e KaTeX puro para fórmulas matemáticas usando `$` e `$$`).
2. **Integração LLM Resiliente (Ollama Wrappers)**: Expõe wrappers (`query_ollama` e `query_ollama_stream`) que envelopam a comunicação HTTP com o modelo local. Suporta fatiamento de respostas (Streaming) para a UI e controla os _timeouts_ massivos (120s) da engine neural.
3. **Scanner Físico de PC (`scan_system_hardware`)**: Executa injeções limpas no *PowerShell* do Windows via subprocessos no exato segundo do boot. Ele descobre, calcula de Bytes para Gigabytes e grava no banco de dados a CPU, RAM, GPU e Placa-Mãe que estão hospedando a inteligência artificial, garantindo auto-ciência de *Hardware*.
4. **O Juiz Neural (`process_system_alert`)**: Atua como a mente cautelosa por trás da infraestrutura. Se a RAM atinge limite crítico e o culpado for o `chrome.exe`, o sistema joga o processo para a LLM na surdina com `Temperatura 0`, forçando-a a julgar se é um processo esperado (Jogo/Renderizador) ou uma anomalia (Navegador travado).
5. **Ação Pendente (Sistema de Interrupção)**: Mecanismo avançado de diálogo bloqueante (`pending_critical_action`). Se a IA pergunta "Deseja que eu encerre este processo?", ela abre uma janela de 30 segundos no núcleo para interceptar a próxima fala sua, engatilhando um _kill_ via *Skill* imediatamente se você concordar com "sim" ou "ok".
6. **Classificador de Intenções Dinâmico (`classify_intent`)**: Lê o catálogo atual de habilidades ativadas (`manager.skills`) e força a IA a devolver um arquivo JSON validado (`format='json'`). A IA tem que enquadrar sua fala nos silos: `HARDWARE`, `MEMORY_READ`, `MEMORY_WRITE`, `CHAT` ou em uma Skill.

---

## ⚙️ A Árvore de Decisão (`execute_command_stream`)

A interface UI do projeto utiliza massivamente o `execute_command_stream`, rodando sob múltiplas *Threads*. O fluxo mental é estritamente o seguinte quando você digita "Olá":

1. **Checagem de Emergência Imediata**:
   - Existe uma confirmação urgente pendente (`pending_critical_action`) dentro do limite de tempo?
   - Se a fala conter palavras assertivas (ex: "sim", "vai", "feche"), ele aciona nativamente a skill de `APP_CONTROL` para fuzilar o processo, ignorando o resto do ciclo LLM para poupar tempo.
2. **Classificação Silenciosa (Roteamento de JSON)**:
   - Pergunta ao Cérebro: "Qual é a intenção e a entidade alvo da frase?". O retorno é destrinchado.
3. **Bifurcação Direta de Carga de Trabalho**:
   - Se for salvar um Fato (`MEMORY_WRITE`): Roda o LLM de novo em modo puramente extrator, arrancando o substantivo (`extract_fact_to_memory`) e gravando a string no cofre do Obsidian silenciosamente.
   - Se for uma *Skill Ativa*: O sistema engatilha a ação correspondente (ex: abrir Spotify, tocar luz), devolve o texto estático da execução e encerra a cadeia de pensamentos. Nenhuma LLM generativa gasta hardware elaborando textos aqui.
4. **RAG Conversacional Final (`ask_local_ai_stream`)**:
   - Se o intento for genérico (Dúvidas de `CHAT`, Leituras de Hardware `HARDWARE` ou Perguntas sobre si mesmo `MEMORY_READ`):
     - Puxa as últimas **8 mensagens** do histórico do SQLite para contexto contínuo.
     - Puxa o *Status do PC ao vivo* do `SystemInfo` e apensa silenciosamente.
     - Invoca o `get_vault_context` e apensa qualquer documento secreto do Obsidian relacionado à pergunta.
     - **Regulagem de Temperatura Dinâmica**: Crava `Temperature=0.1` (Gelada) para questões técnicas de hardware para não mentir estatísticas, mas eleva para `0.7` se for um chat trivial, permitindo ironias criativas.

---

## 🛠️ Manutenção e Boas Práticas (Developer Guide)

- **Sanitização do Modo JSON**: O Classificador de Intenções é a parte mais crítica e letal do sistema. Ao rodar a chamada de API usando `format='json'`, se você substituir o modelo por um LLM mal treinado (ex: modelos sub 2-Billion parameters), ele quebrará o padrão de resposta do parse do Python (`json.loads()`). Quando isso acontecer, o Jarvis retornará cegamente `{"intent": "CHAT"}`, inutilizando todas as skills operacionais de computador. Cuidado com o modelo configurado no `.env`.
- **Cache do Juiz (PROCESS_JUDGEMENT_CACHE)**: Se você fechar o Chrome, ele pode reabrir e travar novamente. O dicionário de cache foi construído em RAM para impedir que o JARVIS fique gastando os limitados ciclos de processamento de IA tentando "julgar" o mesmo processo a cada pico do monitor do PC. Ele lembra da decisão anterior da sessão.
- **Formatação Matemática Estrita e Regex**: No `SYSTEM_PROMPT` o Jarvis é terminantemente proibido de usar marcadores matemáticos arcaicos do LaTeX como `\(` e `\[`. Qualquer modificação nas diretivas do sistema precisa preservar a regra de que fórmulas em bloco usam `$$` e em linha usam `$`. Senão, o interpretador visual do componente `Markdown` do React não conseguirá injetar o renderizador KaTeX e as equações aparecerão como uma sopa de códigos inúteis para o usuário.
- **Limpeza de Saída e Asteriscos**: No final de `ask_local_ai`, a string é limpa de sujeiras de RPG do modelo usando `reply.replace("*", "").replace("#", "")` antes da voz sair. Lembre-se sempre de sanitizar os `chunks` de voz, mas **nunca** limpe os `chunks` de texto da função `_stream` que vai para o front, ou você destruirá os bullets e negritos!
