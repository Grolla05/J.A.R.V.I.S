import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MODES = [
  {
    id: "talk",
    label: "COPILOT",
    subtitle: "Assistente de Voz",
    description: "Interação por comandos de voz em tempo real",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="w-8 h-8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 016 0v8.25a3 3 0 01-3 3z"
        />
      </svg>
    ),
    accentColor: "rgba(0, 188, 255, 1)",
    glowColor: "rgba(0, 188, 255, 0.35)",
    bgGlow: "rgba(0, 188, 255, 0.06)",
  },
  {
    id: "chat",
    label: "CHAT",
    subtitle: "Assistente de Texto",
    description: "Conversas inteligentes com memória de sessão",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="w-8 h-8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
        />
      </svg>
    ),
    accentColor: "rgba(130, 80, 255, 1)",
    glowColor: "rgba(130, 80, 255, 0.35)",
    bgGlow: "rgba(130, 80, 255, 0.06)",
  },
  {
    id: "code",
    label: "CODE",
    subtitle: "Console de Código",
    description: "Análise e geração de código com IA avançada",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="w-8 h-8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
        />
      </svg>
    ),
    accentColor: "rgba(0, 255, 160, 1)",
    glowColor: "rgba(0, 255, 160, 0.35)",
    bgGlow: "rgba(0, 255, 160, 0.06)",
  },
];

export default function ModeSelectionScreen({ onSelect }) {
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const handleSelect = (modeId) => {
    if (selectedId) return;
    setSelectedId(modeId);
    setTimeout(() => onSelect(modeId), 600);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "rgba(8, 8, 12, 0.98)" }}
    >
      {/* Ambient glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 800,
          height: 800,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0, 188, 255, 0.05) 0%, transparent 65%)",
          filter: "blur(60px)",
        }}
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.15,
          type: "spring",
          stiffness: 100,
          damping: 20,
        }}
        className="mb-12 text-center select-none"
      >
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.6em] mb-3"
          style={{ color: "rgba(0, 188, 255, 0.45)" }}
        >
          Boot Complete
        </p>
        <h2
          className="text-3xl font-bold tracking-[0.18em] text-white"
          style={{ textShadow: "0 0 24px rgba(0, 188, 255, 0.3)" }}
        >
          SELECT MODE
        </h2>
        <p
          className="text-[11px] tracking-[0.35em] mt-2 font-medium uppercase"
          style={{ color: "rgba(255,255,255,0.2)" }}
        >
          Choose operating protocol
        </p>
      </motion.div>

      {/* Mode Cards */}
      <div className="flex gap-5 items-stretch">
        {MODES.map((mode, i) => {
          const isHovered = hoveredId === mode.id;
          const isSelected = selectedId === mode.id;
          const isDimmed = selectedId && selectedId !== mode.id;

          return (
            <motion.button
              key={mode.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{
                opacity: isDimmed ? 0.2 : 1,
                y: 0,
                scale: isSelected ? 1.06 : 1,
              }}
              transition={{
                opacity: { duration: 0.3 },
                scale: { type: "spring", stiffness: 260, damping: 22 },
                y: {
                  type: "spring",
                  stiffness: 100,
                  damping: 20,
                  delay: 0.2 + i * 0.08,
                },
              }}
              onClick={() => handleSelect(mode.id)}
              onMouseEnter={() => setHoveredId(mode.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="relative flex flex-col items-center text-left cursor-pointer focus:outline-none"
              style={{
                width: 180,
                padding: "28px 20px 24px",
                borderRadius: 20,
                background:
                  isHovered || isSelected
                    ? `rgba(15, 15, 22, 0.85)`
                    : "rgba(12, 12, 18, 0.6)",
                backdropFilter: "blur(24px) saturate(160%)",
                WebkitBackdropFilter: "blur(24px) saturate(160%)",
                border: isSelected
                  ? `1px solid ${mode.accentColor}`
                  : isHovered
                    ? `1px solid rgba(255,255,255,0.14)`
                    : "1px solid rgba(255,255,255,0.06)",
                boxShadow: isSelected
                  ? `0 0 0 1px ${mode.accentColor}, 0 0 32px ${mode.glowColor}, 0 24px 48px rgba(0,0,0,0.55), inset 3px 3px 6px rgba(255,255,255,0.05)`
                  : isHovered
                    ? `0 0 20px ${mode.glowColor}, 0 16px 36px rgba(0,0,0,0.5), inset 3px 3px 6px rgba(255,255,255,0.04)`
                    : "0 8px 24px rgba(0,0,0,0.4), inset 3px 3px 6px rgba(255,255,255,0.03)",
                transition:
                  "border 0.2s ease, box-shadow 0.2s ease, background 0.2s ease",
              }}
            >
              {/* Top shimmer */}
              <div
                className="absolute top-0 left-6 right-6 h-[1px] rounded-full"
                style={{
                  background: `linear-gradient(90deg, transparent, ${isHovered || isSelected ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)"}, transparent)`,
                }}
              />

              {/* Background glow when hovered */}
              <AnimatePresence>
                {(isHovered || isSelected) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="absolute inset-0 rounded-[20px] pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse at 50% 0%, ${mode.bgGlow} 0%, transparent 70%)`,
                    }}
                  />
                )}
              </AnimatePresence>

              {/* Icon */}
              <motion.div
                animate={{
                  color:
                    isHovered || isSelected
                      ? mode.accentColor
                      : "rgba(255,255,255,0.35)",
                  filter:
                    isHovered || isSelected
                      ? `drop-shadow(0 0 8px ${mode.glowColor})`
                      : "none",
                }}
                transition={{ duration: 0.2 }}
                className="mb-5 relative z-10"
              >
                {mode.icon}
              </motion.div>

              {/* Label */}
              <motion.p
                animate={{
                  color:
                    isHovered || isSelected ? "#fff" : "rgba(255,255,255,0.75)",
                }}
                transition={{ duration: 0.2 }}
                className="text-sm font-bold tracking-[0.22em] mb-1 relative z-10"
              >
                {mode.label}
              </motion.p>

              {/* Subtitle */}
              <motion.p
                animate={{
                  color:
                    isHovered || isSelected
                      ? mode.accentColor
                      : "rgba(255,255,255,0.25)",
                }}
                transition={{ duration: 0.2 }}
                className="text-[9px] font-semibold uppercase tracking-[0.3em] mb-4 relative z-10"
              >
                {mode.subtitle}
              </motion.p>

              {/* Divider */}
              <div
                className="w-full h-[1px] mb-4 relative z-10"
                style={{
                  background:
                    isHovered || isSelected
                      ? `linear-gradient(90deg, transparent, ${mode.accentColor}55, transparent)`
                      : "rgba(255,255,255,0.05)",
                  transition: "background 0.2s ease",
                }}
              />

              {/* Description */}
              <p
                className="text-[10px] text-center leading-[1.55] relative z-10"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                {mode.description}
              </p>

              {/* Selected indicator */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute bottom-3 right-3 w-2 h-2 rounded-full"
                    style={{
                      background: mode.accentColor,
                      boxShadow: `0 0 8px ${mode.glowColor}`,
                    }}
                  />
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="absolute bottom-10 text-[10px] uppercase tracking-[0.3em] font-medium select-none"
        style={{ color: "rgba(255,255,255,0.1)" }}
      >
        Stark Industries · Autonomous Assistant
      </motion.p>
    </motion.div>
  );
}
