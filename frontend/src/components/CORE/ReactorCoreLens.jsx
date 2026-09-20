import { motion } from "framer-motion";

export default function ReactorCoreLens({ colors }) {
  return (
    <motion.div
      animate={{ scale: colors.scale }}
      transition={{ type: "spring", stiffness: 140, damping: 16 }}
      style={{
        width: 120,
        height: 120,
        borderRadius: "50%",
        // Borda translúcida para delimitar o vidro
        border: `1px solid ${colors.coreBorder}`,
        // Gradiente base radial deslocado para simular iluminação direcional (top-left)
        background: `radial-gradient(circle at 35% 35%, ${colors.coreGradStart} 0%, ${colors.coreGradEnd} 100%)`,
        // Múltiplas sombras para simular Volume 3D:
        // 1. Sombra externa para destacar do fundo
        // 2. Brilho interno superior esquerdo (Luz ambiente)
        // 3. Sombra interna forte inferior direita (Oclusão/Volume)
        // 4. Glow colorido interno da própria aura
        boxShadow: `
          0 15px 35px rgba(0, 0, 0, 0.4),
          inset 6px 6px 12px rgba(255, 255, 255, 0.25),
          inset -12px -12px 25px rgba(0, 0, 0, 0.6),
          inset 0 0 20px ${colors.glowColor}
        `,
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        overflow: "hidden", // Contém o plasma interno
      }}
      className="absolute z-20 flex items-center justify-center pointer-events-none transition-all duration-700"
    >
      {/* Reflexo Especular Curvado (Brilho da luz principal batendo no vidro curvo) */}
      <div 
        style={{
          position: "absolute",
          top: "6%",
          left: "14%",
          width: "50%",
          height: "28%",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 100%)",
          borderRadius: "50%",
          transform: "rotate(-25deg)",
        }}
        className="filter blur-[1px]"
      />

      {/* Reflexo Secundário (Luz rebatida na base da esfera) */}
      <div 
        style={{
          position: "absolute",
          bottom: "8%",
          right: "12%",
          width: "40%",
          height: "15%",
          background:
            "radial-gradient(ellipse at center, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 80%)",
          borderRadius: "50%",
          transform: "rotate(-20deg)",
        }}
        className="filter blur-[2px]"
      />
    </motion.div>
  );
}
