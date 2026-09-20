/* eslint-disable */
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LiquidAuraReactor from "./components/LiquidAuraReactor";
import StartupScreen from "./components/StartupScreen";
import ModeSelectionScreen from "./components/ModeSelectionScreen";
import LiveTelemetry from "./components/LiveTelemetry";
import HeaderNavigation from "./components/HeaderNavigation";
import JarvisSubtitles from "./components/JarvisSubtitles";
import ChatPanel from "./components/ChatPanel";
import SkillsSidebar from "./components/SkillsSidebar";
import JarvisPixelReactor from "./components/CORE/JarvisPixelReactor";
import CodePanel from "./components/CodePanel";
import useBridgeAPI from "./hooks/BridgeAPI";

export default function App() {
  // phase: 'loading' | 'mode-select' | 'active'
  const [phase, setPhase] = useState("loading");
  const [isLoading, setIsLoading] = useState(true);
  const [jarvisState, setJarvisState] = useState("idle");
  const [isCritical, setIsCritical] = useState(false);
  const [activeMode, setActiveMode] = useState("talk"); // talk, chat, code
  const [subtitlesText, setSubtitlesText] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isCentering, setIsCentering] = useState(false);
  const isModeInitialized = useRef(false);
  const { isReady, callApi } = useBridgeAPI();

  useEffect(() => {
    // Primeira vez que isLoading vira false = seleção inicial de modo
    // on_initial_mode_selected já tratou mic + greeting — não repetir aqui
    if (!isLoading) {
      if (!isModeInitialized.current) {
        isModeInitialized.current = true;
        return;
      }
      setIsCentering(true);
      const timer = setTimeout(() => setIsCentering(false), 700);
      callApi("set_active_mode", activeMode);
      return () => clearTimeout(timer);
    }
  }, [activeMode, isLoading]);

  useEffect(() => {
    // OUVINTE DE ESTADO (Voz/Processamento)
    window.receiveStatus = (status, text) => {
      console.log(`[PYTHON SAYS]: ${status} - ${text}`);

      let rawState = status.toLowerCase();
      let visualState = rawState;

      if (rawState === "listening") visualState = "idle";
      if (rawState === "processing") visualState = "listening";
      if (rawState === "error") visualState = "idle";

      setJarvisState(visualState);
      if (text !== undefined) {
        setSubtitlesText(text);
      }
    };

    // OUVINTE DE HUD (Sensores/Alerta Vermelho)
    window.updateHudState = (isActive) => {
      console.log("🚨 ALERTA VISUAL:", isActive ? "ATIVADO" : "NORMALIZADO");
      setIsCritical(isActive);
    };

    if (isReady) {
      console.log("Bridge detectada. Sistemas prontos.");
    }

    return () => {
      delete window.receiveStatus;
      delete window.updateHudState;
    };
  }, []);

  const handleBootComplete = () => {
    setPhase("mode-select");
  };

  const handleModeSelect = (modeId) => {
    setActiveMode(modeId);
    setPhase("active");
    setIsLoading(false);
    callApi("on_initial_mode_selected", modeId);
  };

  return (
    <main className="w-screen h-screen bg-transparent backdrop-blur-md overflow-hidden flex flex-col items-center justify-center relative text-white font-sans cursor-default">
      {/* Camada Visual do HUD Crítico */}
      <div className={isCritical ? "hud-critical-mode" : ""} />

      <AnimatePresence mode="wait">
        {phase === "loading" && (
          <StartupScreen key="startup" onComplete={handleBootComplete} />
        )}
        {phase === "mode-select" && (
          <ModeSelectionScreen key="mode-select" onSelect={handleModeSelect} />
        )}
      </AnimatePresence>

      {phase === "active" && (
        <>
          {/* Navegação Superior de Modos (Talk, Chat, Code) */}
          <HeaderNavigation
            activeMode={activeMode}
            setActiveMode={setActiveMode}
            jarvisState={jarvisState}
            isCritical={isCritical}
          />

          {/* Reator Orbe 3D Central com Posicionamento Absoluto Orquestrado de Alta Fidelidade */}
          <motion.div
            layout
            transition={{ type: "spring", stiffness: 110, damping: 22 }}
            style={{
              x: "-50%",
              y: "-50%",
            }}
            animate={{
              opacity: activeMode === "chat" && chatMessages.length > 0 ? 0 : 1,
              scale: isCentering
                ? 1.15
                : activeMode === "chat" && chatMessages.length > 0
                  ? 0.3
                  : 1,
            }}
            className={`absolute z-50 pointer-events-none ${
              isCentering
                ? "top-1/2 left-1/2 mt-[-100px]"
                : activeMode === "talk"
                  ? "top-1/2 left-1/2 mt-[-60px]"
                  : activeMode === "chat"
                    ? "top-1/2 left-[calc(50%+125px)] mt-[-120px]"
                    : "top-1/2 left-1/2 mt-[-240px]"
            }`}
          >
            <div className="pointer-events-auto">
              <motion.div
                animate={{
                  scale:
                    activeMode === "talk"
                      ? 1
                      : activeMode === "chat" && chatMessages.length === 0
                        ? 1
                        : activeMode === "chat"
                          ? 0.78
                          : 0.62,
                }}
                transition={{ type: "spring", stiffness: 110, damping: 22 }}
              >
                <AnimatePresence mode="wait">
                  {activeMode === "code" ? (
                    <motion.div
                      key="pixel-reactor"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <JarvisPixelReactor
                        state={jarvisState}
                        isCritical={isCritical}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="liquid-reactor"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <LiquidAuraReactor
                        state={jarvisState}
                        isCritical={isCritical}
                        activeMode={activeMode}
                        hasMessages={chatMessages.length > 0}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </motion.div>

          {/* Seletor de Modos Estrutural: Chat em Tela Cheia vs Talk/Code Centralizados */}
          {activeMode === "chat" ? (
            <ChatPanel
              jarvisState={jarvisState}
              isCritical={isCritical}
              messages={chatMessages}
              setMessages={setChatMessages}
              currentSessionId={currentSessionId}
              setCurrentSessionId={setCurrentSessionId}
            />
          ) : (
            <>
              {/* Barra Lateral de Skills do Lado Direito */}
              <SkillsSidebar isCritical={isCritical} />

              {/* Painel Inferior Dinâmico (Legendas ou Console de Código) */}
              <div className="absolute bottom-16 left-0 right-0 flex justify-center w-full pointer-events-none z-40">
                <div className="w-full flex justify-center pointer-events-auto px-4">
                  <AnimatePresence mode="wait">
                    {activeMode === "talk" && (
                      <motion.div
                        key="talk"
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.95 }}
                        transition={{
                          type: "spring",
                          stiffness: 100,
                          damping: 20,
                        }}
                        className="w-full flex justify-center"
                      >
                        <JarvisSubtitles
                          jarvisState={jarvisState}
                          isCritical={isCritical}
                          text={subtitlesText}
                        />
                      </motion.div>
                    )}

                    {activeMode === "code" && (
                      <motion.div
                        key="code"
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.95 }}
                        transition={{
                          type: "spring",
                          stiffness: 100,
                          damping: 20,
                        }}
                        className="w-full flex justify-center"
                      >
                        <CodePanel
                          jarvisState={jarvisState}
                          isCritical={isCritical}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </>
          )}

          {/* Telemetria Flutuante no Canto Inferior (Escondida no Modo Chat) */}
          {activeMode !== "chat" && <LiveTelemetry />}
        </>
      )}
    </main>
  );
}
