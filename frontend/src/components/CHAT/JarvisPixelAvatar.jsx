/* eslint-disable */
import { motion } from "framer-motion";

export default function JarvisPixelAvatar({ state, isCritical }) {
  const getColors = () => {
    if (isCritical)
      return { ring: "fill-red-500/85", core: "fill-red-400", center: "fill-white", glow: "rgba(239,68,68,0.4)" };
    switch (state) {
      case "thinking":
        return { ring: "fill-white/80", core: "fill-white/95", center: "fill-white", glow: "rgba(255,255,255,0.45)" };
      case "responding":
        return { ring: "fill-cyan-500/85", core: "fill-cyan-400", center: "fill-white", glow: "rgba(34,211,238,0.45)" };
      case "listening":
        return { ring: "fill-purple-500/85", core: "fill-purple-400", center: "fill-white", glow: "rgba(168,85,247,0.4)" };
      case "speaking":
        return { ring: "fill-cyan-500/85", core: "fill-cyan-400", center: "fill-white", glow: "rgba(34,211,238,0.4)" };
      case "idle":
      default:
        return { ring: "fill-cyan-500/85", core: "fill-cyan-400", center: "fill-white", glow: "rgba(34,211,238,0.2)" };
    }
  };

  const colors = getColors();

  return (
    <div className="w-9 h-9 flex items-center justify-center select-none shrink-0">
      <motion.svg
        viewBox="0 0 16 16"
        className="w-7 h-7"
        style={{ filter: `drop-shadow(0 0 6px ${colors.glow})` }}
        animate={
          state === "thinking"
            ? { scale: [1, 1.05, 1], x: [0, -0.2, 0.2, -0.2, 0], y: [0, 0.2, -0.2, 0.2, 0] }
            : state === "responding"
              ? { rotate: 360 }
              : {}
        }
        transition={
          state === "thinking"
            ? {
                scale: { repeat: Infinity, duration: 1.2, ease: "easeInOut" },
                x: { repeat: Infinity, duration: 0.3 },
                y: { repeat: Infinity, duration: 0.3 },
              }
            : state === "responding"
              ? { repeat: Infinity, ease: "linear", duration: 2.0 }
              : {}
        }
      >
        <rect x="6" y="1" width="4" height="1" className={colors.ring} />
        <rect x="4" y="2" width="2" height="1" className={colors.ring} />
        <rect x="10" y="2" width="2" height="1" className={colors.ring} />
        <rect x="2" y="4" width="2" height="2" className={colors.ring} />
        <rect x="12" y="4" width="2" height="2" className={colors.ring} />
        <rect x="1" y="6" width="1" height="4" className={colors.ring} />
        <rect x="14" y="6" width="1" height="4" className={colors.ring} />
        <rect x="2" y="10" width="2" height="2" className={colors.ring} />
        <rect x="12" y="10" width="2" height="2" className={colors.ring} />
        <rect x="4" y="13" width="2" height="1" className={colors.ring} />
        <rect x="10" y="13" width="2" height="1" className={colors.ring} />
        <rect x="6" y="14" width="4" height="1" className={colors.ring} />
        <rect x="6" y="5" width="4" height="6" className={`${colors.core} animate-pulse`} />
        <rect x="5" y="6" width="6" height="4" className={`${colors.core} animate-pulse`} />
        <rect x="7" y="7" width="2" height="2" className={colors.center} />
      </motion.svg>
    </div>
  );
}
