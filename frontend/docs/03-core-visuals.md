# 🔮 Core Visuals (O Motor Gráfico e Reatores)

A interface J.A.R.V.I.S. transcende a utilidade de um simples painel web; ela foi projetada como um **Heads-Up Display (HUD)** imersivo. O coração dessa identidade visual pulsa dentro da pasta `src/components/CORE/`, onde as físicas complexas, matemática vetorial e renderizações ricas tomam forma.

Diferente de abordagens pesadas baseadas integralmente em WebGL puro (Three.js estrito para tudo), o J.A.R.V.I.S. utiliza uma **ilusão ótica de 3D projetado sobre Canvas 2D (Renderização de Software)** balanceada com a aceleração de hardware de filtros CSS do Framer Motion.

---

## 🟢 O Reator Principal (`LiquidAuraReactor.jsx`)

Este é o avatar primário, visível durante os modos **Talk** e **Chat**. Ele simula a assinatura energética de um reator nuclear de fusão (Arc Reactor), mas com estética cibernética e auréolas "líquidas".

### 1. Arquitetura de Múltiplas Camadas (Z-Index Sandwich)

O reator é montado como um sanduíche de camadas (DOM e Canvas) interligadas:

* **Camada de Fundo (Blur):** Um `div` de Framer Motion com `filter: blur(60px)` para gerar o preenchimento (Glow) volumétrico traseiro.
* **Canvas Traseiro (Back Canvas):** Uma tag `<canvas>` onde o Javascript puro (2D) desenha os anéis holográficos rotativos estendidos e as partículas que estão **atrás** do centro magnético (Z-Sort positivo).
* **Núcleo Central (`ReactorCoreLens`):** Uma div no meio da pilha simulando uma lente convexa de vidro.
* **Canvas Frontal (Front Canvas):** Uma segunda tag `<canvas>` (Z-Sort negativo) para as partículas que passam pela **frente** do núcleo, criando verdadeira profundidade 3D.
* **Auréola Externa (Squircle):** Um contorno tracejado rodando organicamente simulando contenção magnética.

### 2. O Motor Matemático (2.5D Projection)

O segredo do reator é que ele não usa uma placa de vídeo dedicada (GPU pesada) para o 3D das partículas. A biblioteca matemática injetada via `ReactorMath.js` (funções `generateParticles3D`) gera uma esfera de pontos espaciais `(x, y, z)`. Em cada frame do `<canvas>`, aplica-se matrizes de rotação no eixo Y e uma inclinação de lente (`tiltX = 0.35`) projetando-os bidimensionalmente na tela em altíssima taxa de quadros (60+ FPS).

### 3. Físicas de Partículas (Inércia e Repulsão)

* As partículas não flutuam a esmo; elas conectam-se por linhas vetoriais se estiverem a uma distância curta (`distSq < 1200`), simulando uma teia neural magnética.
* **Repulsão de Mouse**: Ao mover o ponteiro pela tela, o componente rastreia o eixo XY e aplica uma força vetorial (`force * 35`) que empurra violentamente o fluxo das partículas.

### 4. Otimização Agressiva de Renderização

Quando a aplicação transita para o **Modo Chat**, o reator diminui e congela. Uma regra fundamental no loop de renderização corta agressivamente o `requestAnimationFrame` se `activeMode === 'chat'`. Isso derruba o consumo de CPU e GPU de ~15% para quase **0%**, poupando bateria em laptops durante leitura de longos textos de IA.

---

## 🔲 Reator de Matriz (`JarvisPixelReactor.jsx`)

Utilizado estritamente no **Modo Code**, abandonando a fluidez orgânica por precisão geométrica dura e cibernética.

### 1. Sequência Coreografada (Timers)

Ele opera num sistema contínuo (looping) de ciclos baseados em `setTimeout` e `AnimatePresence`:

1. **`spinning`**: Engrenagens em formato de cruz rotacionando furiosamente.
2. **`pulsing_white`**: Hiper-exposição (branca) simulando sobrecarga.
3. **`dispersing`**: O núcleo desaba num campo de partículas vetoriais que voam em direção ao observador.
4. **`writing_ascii`**: Uma matriz de pequenos pontos (`motion.rect` em SVG) digita no ar, caractere por caractere, o termo retrô `> J A R V I S C O D E`.
5. **`deleting`**: A frase apaga de trás para frente.

### 2. Dicionário de Renderização ASCII

A palavra final não é texto comum. É um motor manual onde cada letra mapeia coordenadas em grids lógicos (Exemplo: o vetor do "J" ou do "C"). As letras disparam animações no estilo de molas para pulsar nas cores da bandeira cibernética.

---

## 🚦 Espectro Cromático Reativo (`jarvisState`)

Ambos os reatores (Liquid e Pixel) partilham da mesma reatividade de estado, alterando instantaneamente suas paletas de cores. No Reator de Matriz isso muda a tag `fill`, enquanto no Reator Líquido muda as escalas de opacidade e cores do canvas (eixo `particleGlow` e `ringColor`):

| Estado | Significado Analítico | Cores Visuais Base (Liquid / Pixel) | Comportamento Dinâmico |
| :--- | :--- | :--- | :--- |
| **`idle`** | Monitorando o ambiente. | Azul Oceano / Ciano Escuro | Respiração calma, rotação linear lenta. |
| **`listening`** | A IA está absorvendo áudio útil. | Branco Purificado / Roxo Intenso | Tamanho compacto (absorção física), ondas sonoras globais e fortes. |
| **`processing`** | Processando respostas pesadas. | Roxo Profundo / Violeta | Rotação agressiva. O reator de matriz gira alucinadamente. |
| **`speaking`** | Devolvendo informações (Voz/Texto) | Ciano Brilhante Neon | Escala hiper-expandida (`scale > 1.15`). Anéis sofrem distorção senoidal severa imitando osciloscópios vocais. |
| **`isCritical`** | Alerta Vermelho / Invasão | Vermelho Alarme de Emergência | Sobrescreve todos os parâmetros por luz vermelha e pulsos erráticos urgentes. |

---

## 🎬 Tela de Inicialização (`StartupScreen.jsx`)

Durante o milissegundo zero até a interface e o PyWebView conectarem-se (ou até os scripts DOM estarem assíncronos prontos), a `StartupScreen` cobre tudo.

* Exibe um logotipo fixo minimalista da corporação/sistema.
* Roda timers internos fictícios de checagem (Memory Test, BIOS Load).
* Ao terminar, dispara o Callback `onComplete()` desvendando o HUD num Fade-In liso.
