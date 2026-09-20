/* eslint-disable */
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

export default function CodeConsole({ jarvisState, isCritical }) {
  const [logs, setLogs] = useState([
    { id: 1, text: "J.A.R.V.I.S. Kernel v2.0.4 - Sincronizado", type: "system" },
    { id: 2, text: "Núcleos de processamento quântico ativos.", type: "system" },
    { id: 3, text: "Pronto para injeção de rotinas de código.", type: "success" }
  ]);

  const [activeSkill, setActiveSkill] = useState(null);
  const logEndRef = useRef(null);

  const skills = [
    { id: "sys_diag", name: "System Diagnostic", cmd: "sys_report --deep" },
    { id: "telemetry", name: "Telemetry Ping", cmd: "ping --core-telemetry" },
    { id: "sec_scan", name: "Security Override", cmd: "sec --scan-ports" },
    { id: "db_sync", name: "Obsidian Sync", cmd: "sync --vault-obsidian" }
  ];

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const runSkill = (skill) => {
    setActiveSkill(skill.id);
    
    // Adiciona log de execução
    const newLogs = [
      ...logs,
      { id: Date.now(), text: `$ execute_routine ${skill.cmd}`, type: "command" }
    ];
    setLogs(newLogs);

    setTimeout(() => {
      let result = "";
      let type = "success";
      
      if (skill.id === "sys_diag") {
        result = "DIAGNÓSTICO: CPU OK, RAM OK, Rede 100Gbps, Núcleo térmico estabilizado em 42°C.";
      } else if (skill.id === "telemetry") {
        result = "PING: Conexão estabelecida com a bridge em 4ms. Pacotes de dados estáveis.";
      } else if (skill.id === "sec_scan") {
        result = "SEGURANÇA: Nenhuma infiltração ou vulnerabilidade detectada nas portas ativas.";
      } else if (skill.id === "db_sync") {
        result = "MEMÓRIA: Sincronização com o Obsidian Vault finalizada com sucesso. 14 novos nós indexados.";
      }

      setLogs((prev) => [
        ...prev,
        { id: Date.now() + 1, text: result, type: type }
      ]);
      setActiveSkill(null);
    }, 800);
  };

  const getThemeColors = () => {
    if (isCritical) {
      return {
        accent: "text-red-400",
        border: "border-red-500/20",
        buttonActive: "bg-red-500/20 border-red-500/40 text-red-300",
        buttonHover: "hover:bg-red-500/10 hover:border-red-500/30",
        logCmd: "text-red-300",
      };
    }
    switch (jarvisState) {
      case "listening":
        return {
          accent: "text-purple-400",
          border: "border-purple-500/20",
          buttonActive: "bg-purple-500/20 border-purple-500/40 text-purple-300",
          buttonHover: "hover:bg-purple-500/10 hover:border-purple-500/30",
          logCmd: "text-purple-300",
        };
      case "speaking":
      case "idle":
      default:
        return {
          accent: "text-cyan-400",
          border: "border-cyan-500/20",
          buttonActive: "bg-cyan-500/20 border-cyan-500/40 text-cyan-300",
          buttonHover: "hover:bg-cyan-500/10 hover:border-cyan-500/30",
          logCmd: "text-cyan-300",
        };
    }
  };

  const theme = getThemeColors();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 30 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="w-full max-w-xl h-[340px] rounded-2xl border border-white/5 bg-black/45 backdrop-blur-[25px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-4 flex flex-col justify-between relative overflow-hidden z-40"
    >
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Cabeçalho */}
      <div className="flex items-center justify-between pb-2 border-b border-white/5 select-none">
        <span className={`text-[10px] font-bold tracking-[0.25em] uppercase ${theme.accent}`}>
          JARVIS CODE CORE
        </span>
        <span className="text-[9px] text-white/30 uppercase tracking-widest">Console Shell</span>
      </div>

      {/* Área Dividida */}
      <div className="flex-1 flex gap-3 my-3 overflow-hidden">
        {/* Esquerda: Rotinas Disponíveis */}
        <div className="w-[180px] border-r border-white/5 pr-3 flex flex-col gap-2 select-none">
          <span className="text-[9px] text-white/20 font-bold tracking-widest uppercase">Rotinas</span>
          {skills.map((skill) => (
            <motion.button
              key={skill.id}
              onClick={() => runSkill(skill)}
              disabled={activeSkill !== null}
              whileHover={{ scale: activeSkill === null ? 1.02 : 1 }}
              whileTap={{ scale: activeSkill === null ? 0.98 : 1 }}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg border text-[10px] font-medium tracking-wide transition-all duration-300 cursor-pointer ${
                activeSkill === skill.id
                  ? theme.buttonActive
                  : `bg-white/[0.01] border-white/5 text-white/60 ${theme.buttonHover}`
              }`}
            >
              {skill.name}
            </motion.button>
          ))}
        </div>

        {/* Direita: Terminal Output */}
        <div className="flex-1 bg-black/25 rounded-xl border border-white/5 p-3 font-mono text-[10px] overflow-y-auto flex flex-col gap-2 scrollbar-thin">
          {logs.map((log) => (
            <div
              key={log.id}
              className={`${
                log.type === "command"
                  ? theme.logCmd
                  : log.type === "success"
                  ? "text-emerald-400"
                  : "text-white/60"
              }`}
            >
              {log.text}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>
    </motion.div>
  );
}
