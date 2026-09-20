# 📊 Skills & Telemetry (Gerenciamento e HUD)

Tão crucial quanto conversar com a inteligência artificial, é gerenciar o que ela tem permissão para ouvir ou operar no sistema host. No J.A.R.V.I.S., isso é feito pela árvore de **Skills** e visualizado graficamente através do anel de **Telemetria**.

Estes componentes rodam em concorrência silenciosa nas bordas da tela enquanto o usuário opera os reatores ou os painéis de código.

---

## 🛠️ Skills Sidebar (`SkillsSidebar.jsx`)

Localizada no limite direito absoluto da tela, a barra de habilidades atua como o Painel de Controle de Segurança do Usuário. Permanece oculta na aba retrátil (com botão de texto vertical `[writing-mode:vertical-lr]`) até ser invocada.

### 1. Árvore de Dados e Renderização Hierárquica

Quando a janela de `pywebviewready` é resolvida ou o painel expande, ele puxa passivamente o esquema de objetos JSON vindo de `get_skills()`. As skills são desenhadas em formato sanfona (Accordion):

* **Grupo (Categoria Pai):** (Ex: *System*, *Automation*, *IoT*). Possuem um `Toggle Switch` Master. Ao desligar a categoria (`toggle_category`), a UI imediatamente desliga a si mesma e todas as sub-skills atreladas numa tacada só.
* **Micro-Skills (Filhos 1-a-1):** (Ex: *System Diagnostic* ou *App Control*). Toggles individuais (`toggle_skill`) para um pente-fino nas rotinas do bot. Desabilitados automaticamente caso o Pai esteja offline.

### 2. Zero-Latency Feedback e Spring Física

Para entregar uma sensação táctil Premium de iOS, as *switches* (alavancas) ativam as bolinhas físicas através de props de layout do Framer Motion:

`layout transition={{ type: "spring", stiffness: 500, damping: 28 }}`

Em adição, o hook *atualiza a árvore localmente* antes mesmo do `await callApi` do Python terminar, mascarando qualquer latência do processo Python subjacente.

### 3. Parseador de Iconografia

Um dicionário estático cruza chaves em string retornadas pelo backend (`"web"`, `"productivity"`) gerando Ícones vetoriais perfeitos da biblioteca `lucide-react` para ancorar visualmente cada família de Skill.

---

## 📉 Live Telemetry (`src/components/TELEMETRY/`)

A Telemetria materializa a ponte entre a HUD fictícia e o hardware real em que a máquina (SO Local) está operando.

### 1. Polling e Sincronização Constante (`LiveTelemetry.jsx`)

O contêiner gerencia os disparos globais na classe Pai. Ele não aguarda chamadas reativas, mas possui um `setInterval` rígido ancorado no `useEffect` que executa chamadas IPC de leitura `callApi("get_telemetry")` rigorosamente a cada **1.000 milissegundos (1 segundo)**.

### 2. Interatividade Física e Arraste (Draggable)

Todas as mini-janelas cibernéticas geradas compartilham o wrapper base genérico `TelemetryWidget.jsx`.
Graças a integração deste Wrapper com a tag `drag` do Framer Motion e elásticos de fricção (`dragElastic={0.1}`), o usuário pode pegar as métricas pelo título e atirá-las livremente por todo o espectro da HUD, customizando seu próprio painel de informações de forma persistente enquanto o Reator gira ao fundo.

### 3. Reatividade de Dados Sub-Módulos

* **`CpuRamWidget.jsx`**: Transforma flutuadores da CPU numa barra de luz de neon (`div` com `width: data.cpu.usage%`). Ao invés da barra "piscar" a cada segundo que o polling atualiza o dado, o CSS injeta `transition-all duration-500` para garantir que o mostrador deslize progressivamente.

* **`NetworkWidget.jsx`**: Espelha métricas de upload/download e possui mapeamento condicional de emergência: se os bytes do array baterem `< 20` para a Bateria Local, a fonte muda imediatamente do tom Esmeralda de estabilidade para `text-red-400 animate-pulse`, instigando ação urgencial ao usuário.

### 4. Reciclagem e Fechamento

Para despoluir o centro do HUD, os usuários podem fechar os Widgets nos "X" superiores. O `LiveTelemetry` percebe isso e injeta no rodapé minúsculos links holográficos ("+ Core Diagnostic", "+ Network Uplink") aguardando o usuário querer visualizá-los de volta na composição.
