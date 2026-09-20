export default function useJarvisTheme(state = "idle", isCritical = false) {
  const getColors = () => {
    if (isCritical) {
      return {
        accent: "239,68,68", // red for chat panel
        coreGradStart: "rgba(255, 51, 51, 0.25)",
        coreGradEnd: "rgba(100, 0, 0, 0.05)",
        coreBorder: "rgba(255, 51, 51, 0.2)",
        glowColor: "rgba(255, 51, 51, 0.4)",
        particleColor: (opacity) => `rgba(255, 80, 80, ${opacity})`,
        particleGlow: (opacity) => `rgba(255, 51, 51, ${opacity * 0.3})`,
        ringColor: (opacity) => `rgba(255, 51, 51, ${opacity * 0.2})`,
        scale: 1.15,
        centerGlow: "rgba(255, 51, 51, 0.2)",
      };
    }

    switch (state) {
      case "listening": // React listening = Python PROCESSING
        return {
          accent: "168,85,247", // purple
          coreGradStart: "rgba(255, 255, 255, 0.2)",
          coreGradEnd: "rgba(255, 255, 255, 0.02)",
          coreBorder: "rgba(255, 255, 255, 0.25)",
          glowColor: "rgba(255, 255, 255, 0.5)",
          particleColor: (opacity) => `rgba(255, 255, 255, ${opacity * 0.95})`,
          particleGlow: (opacity) => `rgba(255, 255, 255, ${opacity * 0.45})`,
          ringColor: (opacity) => `rgba(255, 255, 255, ${opacity * 0.25})`,
          scale: 1.1,
          centerGlow: "rgba(255, 255, 255, 0.15)",
        };
      case "processing":
        return {
          accent: "139,92,246", // deep purple
          coreGradStart: "rgba(139, 92, 246, 0.2)",
          coreGradEnd: "rgba(30, 27, 75, 0.02)",
          coreBorder: "rgba(167, 139, 250, 0.15)",
          glowColor: "rgba(139, 92, 246, 0.4)",
          particleColor: (opacity) => `rgba(180, 140, 255, ${opacity * 0.9})`,
          particleGlow: (opacity) => `rgba(139, 92, 246, ${opacity * 0.35})`,
          ringColor: (opacity) => `rgba(139, 92, 246, ${opacity * 0.25})`,
          scale: 1.05,
          centerGlow: "rgba(139, 92, 246, 0.15)",
        };
      case "speaking":
        return {
          accent: "34,211,238", // cyan
          coreGradStart: "rgba(0, 240, 255, 0.22)",
          coreGradEnd: "rgba(0, 50, 255, 0.02)",
          coreBorder: "rgba(0, 240, 255, 0.25)",
          glowColor: "rgba(0, 240, 255, 0.55)",
          particleColor: (opacity) => `rgba(0, 240, 255, ${opacity * 0.95})`,
          particleGlow: (opacity) => `rgba(0, 180, 255, ${opacity * 0.4})`,
          ringColor: (opacity) => `rgba(0, 240, 255, ${opacity * 0.3})`,
          scale: 1.2,
          centerGlow: "rgba(0, 240, 255, 0.25)",
        };
      case "idle":
      default:
        return {
          accent: "34,211,238", // cyan
          coreGradStart: "rgba(0, 188, 255, 0.12)",
          coreGradEnd: "rgba(0, 50, 150, 0.01)",
          coreBorder: "rgba(0, 188, 255, 0.15)",
          glowColor: "rgba(0, 188, 255, 0.3)",
          particleColor: (opacity) => `rgba(0, 188, 255, ${opacity * 0.7})`,
          particleGlow: (opacity) => `rgba(0, 150, 255, ${opacity * 0.25})`,
          ringColor: (opacity) => `rgba(0, 188, 255, ${opacity * 0.15})`,
          scale: 1.0,
          centerGlow: "rgba(0, 188, 255, 0.1)",
        };
    }
  };

  return getColors();
}
