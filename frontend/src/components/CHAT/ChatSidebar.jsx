/* eslint-disable */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, Pencil, Pin } from "lucide-react";

const glassSidebar = {
  background: "rgba(0,0,0,0.38)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  borderRight: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "4px 0 20px rgba(0,0,0,0.2)",
};

const clayNewChat = {
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
  boxShadow:
    "0 6px 18px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.09), inset 0 -1px 0 rgba(0,0,0,0.18)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: "16px",
  outline: "none",
};

const clayActiveSession = {
  background:
    "linear-gradient(135deg, rgba(34,211,238,0.12), rgba(34,211,238,0.03))",
  boxShadow:
    "0 6px 15px rgba(0,0,0,0.35), inset 0 1px 0 rgba(34,211,238,0.22), inset 0 -1px 0 rgba(0,0,0,0.2)",
  border: "1px solid rgba(34,211,238,0.28)",
  borderRadius: "10px",
  color: "rgb(34,211,238)",
  fontWeight: "600",
  outline: "none",
};

export default function ChatSidebar({
  onNewChat,
  onSelectSession,
  onRenameSession,
  onTogglePin,
  recentSessions = [],
  currentSessionId,
}) {
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editTitleText, setEditTitleText] = useState("");
  const [contextMenu, setContextMenu] = useState(null); // { x, y, sessionId, isPinned, title }
  const [hoveredOption, setHoveredOption] = useState(null); // 'edit' | 'pin' | null

  // Fecha o menu de contexto ao clicar em qualquer outro lugar
  useEffect(() => {
    const handleCloseMenu = () => setContextMenu(null);
    window.addEventListener("click", handleCloseMenu);
    return () => window.removeEventListener("click", handleCloseMenu);
  }, []);

  const handleSaveTitle = (sessionId) => {
    if (editTitleText.trim() !== "") {
      onRenameSession(sessionId, editTitleText.trim());
    }
    setEditingSessionId(null);
  };

  // Separa as sessões entre fixadas e recentes
  const pinnedSessions = recentSessions.filter((s) => s.is_pinned);
  const unpinnedSessions = recentSessions.filter((s) => !s.is_pinned);

  // Renderizador reutilizável de itens de sessão para consistência visual absoluta (DRY)
  const renderSessionItem = (session) => {
    const isActive = session.id === currentSessionId;
    const isEditing = editingSessionId === session.id;

    return (
      <motion.div
        key={session.id}
        whileHover={!isEditing ? { x: 3 } : {}}
        className={`text-[11px] py-2 px-3 truncate cursor-pointer transition-all duration-200 outline-none focus:outline-none relative group flex items-center justify-between ${
          isActive ? "" : "text-white/45 hover:text-white/80 hover:bg-white/2"
        }`}
        style={isActive ? clayActiveSession : { borderRadius: "10px" }}
        whileTap={!isEditing ? { scale: 0.98 } : {}}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu({
            x: e.clientX,
            y: e.clientY,
            sessionId: session.id,
            isPinned: session.is_pinned,
            title: session.title,
          });
        }}
      >
        {isEditing ? (
          <input
            type="text"
            value={editTitleText}
            onChange={(e) => setEditTitleText(e.target.value)}
            onBlur={() => handleSaveTitle(session.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSaveTitle(session.id);
              } else if (e.key === "Escape") {
                setEditingSessionId(null);
              }
            }}
            className="w-full bg-black/40 border border-cyan-400/50 rounded px-1.5 py-0.5 text-white outline-none focus:ring-1 focus:ring-cyan-400 text-[10px] font-sans"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div
            className="flex items-center justify-between w-full min-w-0"
            onClick={() => onSelectSession(session.id)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditingSessionId(session.id);
              setEditTitleText(session.title);
            }}
          >
            <span className="truncate flex-1 pr-2 flex items-center gap-1.5">
              {session.title}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingSessionId(session.id);
                setEditTitleText(session.title);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-[10px] text-white/35 hover:text-cyan-400 p-0.5 outline-none focus:outline-none flex items-center justify-center shrink-0"
              title="Renomear conversa"
            >
              <Pencil size={10} />
            </button>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <motion.aside
      initial={{ x: -280, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -280, opacity: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 20 }}
      className="w-64 h-full flex flex-col justify-between p-4 z-40 relative select-none"
      style={glassSidebar}
    >
      <div className="flex flex-col gap-5 overflow-hidden h-full">
        {/* Nova conversa */}
        <motion.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={onNewChat}
          className="w-full py-2.5 px-4 flex items-center justify-between text-xs tracking-wider uppercase font-semibold text-white/75 transition-colors duration-200 cursor-pointer outline-none focus:outline-none"
          style={clayNewChat}
        >
          <span>+ Nova conversa</span>
          <span
            className="text-[9px] opacity-50 px-1.5 py-0.5 rounded-md"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            Ctrl K
          </span>
        </motion.button>

        {/* Listas de Conversas com Categorias */}
        <div className="flex-1 overflow-hidden flex flex-col gap-4 mt-1 pr-1">
          {/* ── SEÇÃO: FIXADOS ── */}
          {pinnedSessions.length > 0 && (
            <div className="flex flex-col gap-1 max-h-[40%] overflow-y-auto glass-scrollbar pr-0.5 border-b border-white/5 pb-3">
              <span className="text-[9px] font-bold text-white/22 uppercase tracking-wider px-3 mb-1 flex items-center gap-1.5">
                <Pin size={9} className="text-cyan-400/60" /> Pinned
              </span>
              {pinnedSessions.map((session) => renderSessionItem(session))}
            </div>
          )}

          {/* ── SEÇÃO: RECENTES ── */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-1 glass-scrollbar pr-0.5">
            <span className="text-[9px] font-bold text-white/22 uppercase tracking-wider px-3 mb-1">
              Recentes
            </span>
            {unpinnedSessions.length === 0 ? (
              <span className="text-[10px] text-white/20 px-3 py-2 italic font-normal">
                Nenhuma conversa recente
              </span>
            ) : (
              unpinnedSessions.map((session) => renderSessionItem(session))
            )}
          </div>
        </div>
      </div>

      {/* ── MENU DE CONTEXTO GLASSMORPHIC (APPLE HIG) ── */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            style={{
              position: "fixed",
              top: contextMenu.y,
              left: contextMenu.x,
              zIndex: 9999,
              background: "rgba(10, 10, 12, 0.75)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "14px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.45)",
              padding: "6px",
              minWidth: "160px",
              display: "flex",
              flexDirection: "col",
              gap: "4px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              onHoverStart={() => setHoveredOption("edit")}
              onHoverEnd={() => setHoveredOption(null)}
              onClick={() => {
                setEditingSessionId(contextMenu.sessionId);
                setEditTitleText(contextMenu.title);
                setContextMenu(null);
              }}
              className="w-full text-left text-[11px] px-3 py-2 rounded-lg flex items-center gap-2 cursor-pointer font-sans outline-none focus:outline-none transition-all duration-200 border border-transparent whitespace-nowrap"
              style={
                hoveredOption === "edit"
                  ? {
                      background:
                        "linear-gradient(135deg, rgba(34,211,238,0.15), rgba(34,211,238,0.05))",
                      boxShadow:
                        "0 6px 15px rgba(0,0,0,0.35), inset 0 1px 0 rgba(34,211,238,0.22), inset 0 -1px 0 rgba(0,0,0,0.2)",
                      borderColor: "rgba(34,211,238,0.3)",
                      color: "rgb(34, 211, 238)",
                      fontWeight: "600",
                    }
                  : {
                      background: "transparent",
                      borderColor: "transparent",
                      color: "rgba(255, 255, 255, 0.8)",
                    }
              }
            >
              <Pencil
                size={11}
                className={
                  hoveredOption === "edit" ? "text-cyan-400" : "text-white/40"
                }
              />{" "}
              Editar Título
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              onHoverStart={() => setHoveredOption("pin")}
              onHoverEnd={() => setHoveredOption(null)}
              onClick={() => {
                onTogglePin(contextMenu.sessionId, !contextMenu.isPinned);
                setContextMenu(null);
              }}
              className="w-full text-left text-[11px] px-3 py-2 rounded-lg flex items-center gap-2 cursor-pointer font-sans outline-none focus:outline-none transition-all duration-200 border border-transparent whitespace-nowrap"
              style={
                hoveredOption === "pin"
                  ? {
                      background:
                        "linear-gradient(135deg, rgba(34,211,238,0.15), rgba(34,211,238,0.05))",
                      boxShadow:
                        "0 6px 15px rgba(0,0,0,0.35), inset 0 1px 0 rgba(34,211,238,0.22), inset 0 -1px 0 rgba(0,0,0,0.2)",
                      borderColor: "rgba(34,211,238,0.3)",
                      color: "rgb(34, 211, 238)",
                      fontWeight: "600",
                    }
                  : {
                      background: "transparent",
                      borderColor: "transparent",
                      color: "rgba(255, 255, 255, 0.8)",
                    }
              }
            >
              <Pin
                size={11}
                className={
                  hoveredOption === "pin" ? "text-cyan-400" : "text-white/40"
                }
              />{" "}
              {contextMenu.isPinned ? "Desafixar Chat" : "Fixar Chat"}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
