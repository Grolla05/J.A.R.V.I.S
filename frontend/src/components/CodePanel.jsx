/* eslint-disable no-unused-vars */
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import ClaudeBadge from "./CODE/ClaudeBadge";
import CodeFileTree from "./CODE/CodeFileTree";
import ClaudeOutput from "./CODE/ClaudeOutput";
import CodeEditor from "./CODE/CodeEditor";

export default function CodePanel({ jarvisState, isCritical }) {
  const [activeFile, setActiveFile] = useState("brain.py");
  const [simulatedLogs, setSimulatedLogs] = useState(() => [
    `[${new Date().toLocaleTimeString()}] CLAUDE: System initialized.`,
    `[${new Date().toLocaleTimeString()}] CLAUDE: Ready for neural debugging.`,
  ]);

  // Premium mock files database
  const fileContents = {
    "brain.py": `import os
import tensorflow as tf
from services.listen import listen
from services.speak import speak

class JarvisBrain:
    def __init__(self):
        self.model = tf.keras.models.load_model("models/jarvis_core.h5")
        self.is_critical = False
        
    def process_neuro_signal(self, input_signal):
        """
        Decodifica estímulos acústicos em comandos cognitivos
        """
        prediction = self.model.predict(input_signal)
        return self.resolve_intent(prediction)
        
    def resolve_intent(self, intent_vector):
        if intent_vector[0] > 0.95:
            return "ACTIVATE_TELEMETRY"
        return "STANDBY_MODE"`,
    "sys_monitor.py": `import psutil
import time

def monitor_core_temperatures():
    while True:
        cpu_temp = psutil.cpu_percent(interval=1)
        if cpu_temp > 92.0:
            trigger_system_alert("CPU THERMAL WARNING")
        time.sleep(3)
        
def trigger_system_alert(msg):
    # Ponte de hardware direta com o HUD
    print(f"[CRITICAL ALERT]: {msg}")`,
    "obsidian.py": `import os
import sqlite3

class ObsidianVault:
    def __init__(self, vault_path):
        self.path = vault_path
        self.db = sqlite3.connect("database/jarvis_memory.db")
        
    def query_neural_link(self, keyword):
        cursor = self.db.cursor()
        cursor.execute("SELECT content FROM memory WHERE key = ?", (keyword,))
        return cursor.fetchone()`,
  };

  // Real-time CLI logs generator simulation
  useEffect(() => {
    const logsTemplates = [
      "Claude: Analyzing file patterns...",
      "Claude: Optimization suggestions ready.",
      "Claude: Refactoring neural pipe structure.",
      "Claude: Security protocols verified.",
      "Claude: Memory leak detected in bridge.py (Fixed).",
      "Claude: Jarvis Core is running efficiently.",
      "Claude: Latency reduced by 12ms.",
    ];

    const interval = setInterval(() => {
      const randomLog =
        logsTemplates[Math.floor(Math.random() * logsTemplates.length)];
      setSimulatedLogs((prev) => {
        const updated = [
          ...prev,
          `[${new Date().toLocaleTimeString()}] ${randomLog}`,
        ];
        if (updated.length > 6) updated.shift();
        return updated;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Theme resolution config
  const getThemeColors = () => {
    if (isCritical) {
      return {
        accent: "text-red-400",
        border: "border-red-500/20",
        bg: "bg-red-950/10",
        lineActive: "bg-red-500/10 border-l-2 border-red-500",
        btnActive: "bg-red-500/20 border-red-500/30 text-red-300",
        textAccent: "text-red-400/90",
      };
    }
    const baseTheme = {
      accent: "text-white",
      border: "border-white/10",
      bg: "bg-[#0a0a0a]/95",
      lineActive: "bg-white/5 border-l-2 border-white/40",
      btnActive: "bg-white/10 border-white/20 text-white",
      textAccent: "text-white/70",
    };

    switch (jarvisState) {
      case "listening":
        baseTheme.border = "border-purple-500/30";
        break;
      case "speaking":
        baseTheme.border = "border-cyan-500/30";
        break;
    }
    return baseTheme;
  };

  const theme = getThemeColors();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 40 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className={`w-full max-w-4xl h-[410px] rounded-xl border ${theme.border} ${theme.bg} backdrop-blur-[30px] shadow-[0_40px_100px_rgba(0,0,0,0.8)] p-5 flex flex-col justify-between relative overflow-hidden z-40 font-mono`}
    >
      {/* Luz de brilho de topo (Claude Style: minimalista) */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      {/* Header Estilo Claude Code */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5 select-none">
        <div className="flex items-center gap-3">
          <ClaudeBadge />
          <span className="text-[10px] font-medium tracking-tight text-white/40 uppercase">
            /workspace/jarvis
          </span>
        </div>
        <div className="flex items-center gap-4 text-[9px] text-white/20 uppercase tracking-[0.2em]">
          <span>Python 3.11</span>
          <div className="flex gap-1 items-center">
            <span className="w-1.5 h-1.5 rounded-sm bg-white/20" />
            <span>Ready</span>
          </div>
        </div>
      </div>

      {/* Corpo da IDE Estilo CLI */}
      <div className="flex-1 flex gap-5 mt-4 overflow-hidden">
        {/* Lado Esquerdo: Sidebar de Arquivos & Console */}
        <div className="w-[28%] flex flex-col gap-4 overflow-hidden h-full">
          <CodeFileTree
            fileNames={Object.keys(fileContents)}
            activeFile={activeFile}
            onSelectFile={setActiveFile}
            theme={theme}
          />
          <ClaudeOutput simulatedLogs={simulatedLogs} />
        </div>

        {/* Lado Direito: Editor de Código Estilo Terminal */}
        <CodeEditor
          activeFile={activeFile}
          codeContent={fileContents[activeFile]}
          theme={theme}
        />
      </div>
    </motion.div>
  );
}
