/* eslint-disable */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ReactorSvg = ({
  ringClass,
  coreClass,
  centerClass,
  style,
  animate,
  transition,
}) => (
  <motion.svg
    viewBox="0 0 16 16"
    className="w-40 h-40"
    style={style}
    animate={animate}
    transition={transition}
  >
    <rect x="6" y="1" width="4" height="1" className={ringClass} />
    <rect x="4" y="2" width="2" height="1" className={ringClass} />
    <rect x="10" y="2" width="2" height="1" className={ringClass} />
    <rect x="2" y="4" width="2" height="2" className={ringClass} />
    <rect x="12" y="4" width="2" height="2" className={ringClass} />
    <rect x="1" y="6" width="1" height="4" className={ringClass} />
    <rect x="14" y="6" width="1" height="4" className={ringClass} />
    <rect x="2" y="10" width="2" height="2" className={ringClass} />
    <rect x="12" y="10" width="2" height="2" className={ringClass} />
    <rect x="4" y="13" width="2" height="1" className={ringClass} />
    <rect x="10" y="13" width="2" height="1" className={ringClass} />
    <rect x="6" y="14" width="4" height="1" className={ringClass} />
    <rect x="6" y="5" width="4" height="6" className={coreClass} />
    <rect x="5" y="6" width="6" height="4" className={coreClass} />
    <rect x="7" y="7" width="2" height="2" className={centerClass} />
  </motion.svg>
);

const ParticleField = () => {
  const particles = Array.from({ length: 40 }).map((_, i) => {
    const xDest = (Math.random() - 0.5) * 80;
    const yDest = 65 + Math.random() * 85;
    const delay = Math.random() * 0.25;
    const size = 1.5 + Math.random() * 2.5;
    return { id: i, xDest, yDest, size, delay };
  });

  return (
    <svg
      viewBox="-50 -50 100 100"
      className="w-48 h-48 absolute select-none pointer-events-none"
    >
      {particles.map((p) => (
        <motion.rect
          key={p.id}
          width={p.size}
          height={p.size}
          x={0}
          y={-15}
          fill="#ffffff"
          initial={{ x: 0, y: -15, opacity: 0.95, scale: 1 }}
          animate={{ x: p.xDest, y: p.yDest, opacity: 0, scale: 0.6 }}
          transition={{ duration: 1.1, ease: "easeOut", delay: p.delay }}
        />
      ))}
    </svg>
  );
};

const LETTER_PIXELS = {
  ">": [[0,1],[1,2],[2,3],[1,4],[0,5]],
  J: [[3,0],[3,1],[3,2],[3,3],[0,4],[3,4],[0,5],[3,5],[1,6],[2,6]],
  A: [[1,0],[2,0],[3,0],[0,1],[4,1],[0,2],[4,2],[0,3],[1,3],[2,3],[3,3],[4,3],[0,4],[4,4],[0,5],[4,5],[0,6],[4,6]],
  R: [[0,0],[1,0],[2,0],[3,0],[0,1],[4,1],[0,2],[4,2],[0,3],[1,3],[2,3],[3,3],[0,4],[2,4],[0,5],[3,5],[0,6],[4,6]],
  V: [[0,0],[4,0],[0,1],[4,1],[0,2],[4,2],[0,3],[4,3],[1,4],[3,4],[1,5],[3,5],[2,6]],
  I: [[0,0],[1,0],[2,0],[1,1],[1,2],[1,3],[1,4],[1,5],[0,6],[1,6],[2,6]],
  S: [[1,0],[2,0],[3,0],[0,1],[0,2],[1,3],[2,3],[3,4],[3,5],[0,6],[1,6],[2,6]],
  C: [[1,0],[2,0],[3,0],[0,1],[0,2],[0,3],[0,4],[0,5],[1,6],[2,6],[3,6]],
  O: [[1,0],[2,0],[0,1],[3,1],[0,2],[3,2],[0,3],[3,3],[0,4],[3,4],[0,5],[3,5],[1,6],[2,6]],
  D: [[0,0],[1,0],[2,0],[0,1],[3,1],[0,2],[3,2],[0,3],[3,3],[0,4],[3,4],[0,5],[3,5],[0,6],[1,6],[2,6]],
  E: [[0,0],[1,0],[2,0],[3,0],[0,1],[0,2],[0,3],[1,3],[2,3],[0,4],[0,5],[0,6],[1,6],[2,6],[3,6]],
};

const LETTER_OFFSETS = {
  ">": 0, J: 5, A: 11, R: 18, V: 25, I: 32, S: 37,
  C: 46, O: 52, D: 58, E: 64,
};

const LETTER_COLORS = {
  ">": "#0a84ff", J: "#2f80ed", A: "#4f7df2", R: "#7f6df2",
  V: "#af5df2", I: "#df4df2", S: "#ff3d91", C: "#ff2d55",
  O: "#ff3b30", D: "#ff453a", E: "#ff9f0a",
};

const LETTER_SHADOW_COLORS = {
  ">": "rgba(0,35,80,0.75)", J: "rgba(0,35,80,0.75)", A: "rgba(20,20,75,0.75)",
  R: "rgba(35,10,80,0.75)", V: "rgba(45,5,80,0.75)", I: "rgba(65,0,75,0.75)",
  S: "rgba(75,0,45,0.75)", C: "rgba(75,0,35,0.75)", O: "rgba(80,0,10,0.75)",
  D: "rgba(80,0,0,0.75)", E: "rgba(80,30,0,0.75)",
};

export default function JarvisPixelReactor({ state, isCritical }) {
  const [phase, setPhase] = useState("spinning");

  useEffect(() => {
    let t1, t2, t3, t4, tReset;

    const runSequence = () => {
      setPhase("spinning");
      t1 = setTimeout(() => setPhase("pulsing_white"), 2500);
      t2 = setTimeout(() => setPhase("dispersing"), 5000);
      t3 = setTimeout(() => setPhase("writing_ascii"), 6200);
      t4 = setTimeout(() => {
        setPhase("deleting");
        tReset = setTimeout(() => runSequence(), 1500);
      }, 13200);
    };

    runSequence();

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(tReset);
    };
  }, []);

  const getColors = () => {
    if (isCritical) return { ring: "fill-red-500/85", core: "fill-red-400", center: "fill-white", glow: "rgba(239, 68, 68, 0.5)" };
    switch (state) {
      case "listening": return { ring: "fill-purple-500/85", core: "fill-purple-400", center: "fill-white", glow: "rgba(168, 85, 247, 0.5)" };
      case "speaking": return { ring: "fill-cyan-500/85", core: "fill-cyan-400", center: "fill-white", glow: "rgba(34, 211, 238, 0.6)" };
      case "idle":
      default: return { ring: "fill-cyan-500/85", core: "fill-cyan-400", center: "fill-white", glow: "rgba(34, 211, 238, 0.35)" };
    }
  };

  const colors = getColors();

  const asciiPixels = [];
  Object.entries(LETTER_PIXELS).forEach(([char, pixels]) => {
    const xOffset = LETTER_OFFSETS[char];
    const color = LETTER_COLORS[char];
    const shadowColor = LETTER_SHADOW_COLORS[char];
    pixels.forEach(([px, py]) => {
      asciiPixels.push({ id: `${char}-${px}-${py}`, x: xOffset + px, y: py, color, shadowColor, char });
    });
  });

  return (
    <div className="w-[720px] h-[450px] flex flex-col items-center justify-center select-none shrink-0 relative">
      <div
        className="absolute w-[380px] h-[380px] rounded-full blur-[75px] pointer-events-none -z-10 transition-all duration-1000"
        style={{
          background:
            phase === "writing_ascii" || phase === "deleting"
              ? "radial-gradient(circle, rgba(10, 132, 255, 0.25) 0%, transparent 70%)"
              : phase === "pulsing_white"
                ? "radial-gradient(circle, rgba(255, 255, 255, 0.25) 0%, transparent 70%)"
                : `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
        }}
      />

      <AnimatePresence mode="wait">
        {phase === "spinning" && (
          <motion.div key="spinning" initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center">
            <ReactorSvg
              ringClass={colors.ring}
              coreClass={`${colors.core} animate-pulse`}
              centerClass={colors.center}
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, ease: "linear", duration: 1.8 }}
              style={{ filter: `drop-shadow(0 0 14px ${colors.glow})` }}
            />
          </motion.div>
        )}

        {phase === "pulsing_white" && (
          <motion.div key="pulsing_white" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center">
            <ReactorSvg
              ringClass="fill-white/80"
              coreClass="fill-white/95"
              centerClass="fill-white"
              animate={{ scale: [1, 1.02, 1], rotate: 360, x: [0, -0.2, 0.2, -0.2, 0], y: [0, 0.2, -0.2, 0.2, 0] }}
              transition={{
                scale: { repeat: Infinity, duration: 1.2, ease: "easeInOut" },
                rotate: { repeat: Infinity, duration: 8, ease: "linear" },
                x: { repeat: Infinity, duration: 0.3 },
                y: { repeat: Infinity, duration: 0.3 },
              }}
              style={{ filter: `drop-shadow(0 0 16px rgba(255, 255, 255, 0.45))` }}
            />
          </motion.div>
        )}

        {phase === "dispersing" && (
          <motion.div key="dispersing" initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative flex items-center justify-center w-full h-full">
            <motion.div animate={{ scale: 0.4, y: 70, opacity: 0 }} transition={{ duration: 1.0, ease: "easeInOut" }}>
              <ReactorSvg
                ringClass="fill-white/70"
                coreClass="fill-white/80"
                centerClass="fill-white"
                style={{ filter: `drop-shadow(0 0 12px rgba(255, 255, 255, 0.3))` }}
              />
            </motion.div>
            <ParticleField />
          </motion.div>
        )}

        {(phase === "writing_ascii" || phase === "deleting") && (
          <motion.div
            key="writing_ascii"
            initial={{ opacity: 0, scale: 0.8, y: 15 }}
            animate={{ opacity: 1, scale: 1.45, y: -10 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 130, damping: 20 }}
            className="flex flex-col items-center justify-center select-none"
          >
            <svg
              viewBox="-1 -1 70 9"
              className="w-[660px] h-[95px]"
              style={{ filter: "drop-shadow(0 0 28px rgba(10, 132, 255, 0.5))" }}
            >
              {asciiPixels.map((p, idx) => {
                const CHAR_ORDER = [">", "J", "A", "R", "V", "I", "S", "C", "O", "D", "E"];
                const charIdx = CHAR_ORDER.indexOf(p.char);
                const isDeleting = phase === "deleting";
                const animDelay = isDeleting
                  ? (CHAR_ORDER.length - 1 - charIdx) * 0.12
                  : charIdx * 0.2;

                return (
                  <g key={p.id}>
                    <motion.rect
                      width="0.84" height="0.84"
                      x={p.x + 0.08} y={p.y + 0.08}
                      fill={p.shadowColor}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={isDeleting ? { opacity: 0, scale: 0 } : { opacity: 1, scale: 1 }}
                      transition={{ type: isDeleting ? "tween" : "spring", stiffness: 280, damping: 18, delay: animDelay, duration: isDeleting ? 0.12 : undefined }}
                    />
                    <motion.rect
                      width="0.84" height="0.84"
                      x={p.x} y={p.y}
                      fill={p.color}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={isDeleting ? { opacity: 0, scale: 0 } : { opacity: 1, scale: 1 }}
                      transition={{ type: isDeleting ? "tween" : "spring", stiffness: 300, damping: 20, delay: animDelay, duration: isDeleting ? 0.12 : undefined }}
                      className={isDeleting ? "" : "animate-pulse"}
                      style={{ animationDuration: "2s", animationDelay: `${charIdx * 0.2}s` }}
                    />
                  </g>
                );
              })}
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
