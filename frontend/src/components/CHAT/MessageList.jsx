/* eslint-disable */
import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import JarvisPixelAvatar from "./JarvisPixelAvatar";
import { MD_COMPONENTS } from "./MarkdownComponents";
import { Copy, Check, Pencil, RotateCw } from "lucide-react";
import "katex/dist/katex.min.css";

const glassBubbleJarvis = {
  background: "linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01))",
  backdropFilter: "blur(24px) saturate(180%)",
  WebkitBackdropFilter: "blur(24px) saturate(180%)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  borderRadius: "4px 20px 20px 20px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
};

const glassBubbleUser = (accent) => ({
  background: `linear-gradient(135deg, rgba(${accent},0.12), rgba(${accent},0.03))`,
  backdropFilter: "blur(24px) saturate(180%)",
  WebkitBackdropFilter: "blur(24px) saturate(180%)",
  border: `1px solid rgba(${accent},0.28)`,
  borderRadius: "20px 4px 20px 20px",
  boxShadow: `0 10px 30px rgba(${accent},0.06), 0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.12)`,
});

const preprocessMarkdown = (text) => {
  if (!text) return "";
  // Substitui \[ ... \] por $$ ... $$ para blocos de matemática
  let processed = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, equation) => {
    return `\n$$\n${equation.trim()}\n$$\n`;
  });
  // Substitui \( ... \) por $ ... $ para matemática em linha
  processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (_, equation) => {
    return `$${equation.trim()}$`;
  });
  return processed;
};

export default function MessageList({
  messages = [],
  isThinking,
  jarvisAvatarState,
  isCritical,
  accent,
  onEditMessage,
  onRegenerateMessage,
}) {
  const messagesEndRef = useRef(null);
  const [copiedId, setCopiedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");

  const handleCopy = (msgId, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const lastUserMessage = [...messages].reverse().find((m) => m.sender === "user");
  const lastUserMessageId = lastUserMessage?.id;

  return (
    <div className="flex-1 min-h-0 w-full flex flex-col items-center overflow-hidden">
      {messages.length > 0 ? (
        <div className="w-full max-w-3xl flex-1 min-h-0 overflow-y-auto my-4 pr-2 flex flex-col gap-5 glass-scrollbar select-text">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isJarvis = msg.sender === "jarvis";
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 180, damping: 20 }}
                  className={`flex items-start gap-4 w-full ${isJarvis ? "justify-start" : "justify-end"}`}
                >
                  {isJarvis && (
                    <JarvisPixelAvatar
                      state={
                        msg.id === "streaming-msg"
                          ? jarvisAvatarState
                          : "idle"
                      }
                      isCritical={isCritical}
                    />
                  )}

                  <div className={`flex flex-col gap-1 max-w-[75%] group ${isJarvis ? "items-start" : "items-end"}`}>
                    {/* Message bubble */}
                    {editingId === msg.id ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        className="w-full p-4 text-xs leading-relaxed relative min-w-[280px]"
                        style={glassBubbleUser(accent)}
                      >
                        <span
                          className="block text-[8px] font-bold opacity-28 uppercase tracking-widest mb-2.5 select-none text-white/55"
                        >
                          SENHOR • {msg.time} (EDITANDO)
                        </span>
                        <div className="flex flex-col gap-3">
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="w-full bg-black/50 border border-white/8 rounded-xl p-3 text-white/90 text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 resize-y min-h-[70px] max-h-[200px] glass-scrollbar font-sans transition-all duration-200"
                            autoFocus
                            placeholder="Edite sua mensagem..."
                            style={{
                              lineHeight: "1.5",
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = `rgb(${accent})`;
                              e.target.style.boxShadow = `0 0 15px rgba(${accent}, 0.25)`;
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = "rgba(255, 255, 255, 0.08)";
                              e.target.style.boxShadow = "none";
                            }}
                          />
                          <div className="flex justify-end gap-2.5">
                            <motion.button
                              whileHover={{ scale: 1.03, y: -0.5 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => setEditingId(null)}
                              className="px-3.5 py-1.5 rounded-xl text-[10px] font-semibold transition-all cursor-pointer outline-none focus:outline-none"
                              style={{
                                background: "rgba(255, 255, 255, 0.04)",
                                border: "1px solid rgba(255, 255, 255, 0.08)",
                                color: "rgba(255, 255, 255, 0.75)",
                                boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                                e.currentTarget.style.color = "#fff";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                                e.currentTarget.style.color = "rgba(255, 255, 255, 0.75)";
                              }}
                            >
                              Cancelar
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.03, y: -0.5 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => {
                                if (editingText.trim() && editingText.trim() !== msg.text) {
                                  onEditMessage(msg.id, editingText);
                                }
                                setEditingId(null);
                              }}
                              className="px-3.5 py-1.5 rounded-xl text-black text-[10px] font-bold transition-all cursor-pointer outline-none focus:outline-none"
                              style={{
                                background: `linear-gradient(135deg, rgba(${accent}, 0.95), rgba(${accent}, 0.8))`,
                                boxShadow: `0 4px 12px rgba(${accent}, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25), inset 0 -1px 0 rgba(0, 0, 0, 0.2)`,
                                border: `1px solid rgba(${accent}, 0.4)`,
                              }}
                            >
                              Salvar e Enviar
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div
                        className="w-full p-4 text-xs leading-relaxed relative"
                        style={
                          isJarvis ? glassBubbleJarvis : glassBubbleUser(accent)
                        }
                      >
                        <span
                          className="block text-[8px] font-bold opacity-28 uppercase tracking-widest mb-1.5 select-none"
                          style={{
                            color: isJarvis
                              ? `rgba(${accent},0.7)`
                              : "rgba(255,255,255,0.55)",
                          }}
                        >
                          {isJarvis ? "J.A.R.V.I.S." : "SENHOR"} • {msg.time}
                        </span>
                        {isJarvis ? (
                          <div className="jarvis-md text-white/88 text-xs leading-relaxed">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm, remarkMath]}
                              rehypePlugins={[rehypeKatex]}
                              components={MD_COMPONENTS}
                            >
                              {preprocessMarkdown(msg.text)}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <span className="text-white/88 whitespace-pre-wrap">{msg.text}</span>
                        )}

                        {/* Attachment chips inside bubble */}
                        {msg.attachments?.length > 0 && (
                          <div
                            className="flex flex-wrap gap-1.5 mt-2.5 pt-2.5"
                            style={{
                              borderTop: "1px solid rgba(255,255,255,0.06)",
                            }}
                          >
                            {msg.attachments.map((f) => (
                              <span
                                key={f.id}
                                className="flex items-center gap-1 text-[10px] text-white/65 px-2 py-1"
                                style={{
                                  background: `rgba(${f.glow},0.12)`,
                                  border: `1px solid rgba(${f.glow},0.22)`,
                                  borderRadius: "8px",
                                }}
                              >
                                {f.icon}{" "}
                                <span className="max-w-[100px] truncate">
                                  {f.name}
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action buttons BELOW the bubble, subtly styled */}
                    {msg.id !== "streaming-msg" && editingId !== msg.id && (
                      <div className="flex items-center gap-2 mt-1.5 px-2 opacity-0 group-hover:opacity-100 transition-all duration-200 text-white/45">
                        {/* Copy Button */}
                        <motion.button
                          whileHover={{ scale: 1.05, y: -0.5 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleCopy(msg.id, msg.text)}
                          title="Copiar mensagem"
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-medium transition-all cursor-pointer backdrop-blur-md"
                          style={{
                            background: "rgba(255, 255, 255, 0.04)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                            color: "rgba(255, 255, 255, 0.75)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = `rgba(${accent}, 0.12)`;
                            e.currentTarget.style.borderColor = `rgba(${accent}, 0.35)`;
                            e.currentTarget.style.color = `rgb(${accent})`;
                            e.currentTarget.style.boxShadow = `0 4px 12px rgba(${accent}, 0.2)`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                            e.currentTarget.style.color = "rgba(255, 255, 255, 0.75)";
                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.15)";
                          }}
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-2.5 h-2.5 text-emerald-400" />
                              <span className="text-emerald-400 font-semibold">Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-2.5 h-2.5" />
                              <span>Copiar</span>
                            </>
                          )}
                        </motion.button>

                        {/* Edit Button (Only User & Only Last Message) */}
                        {!isJarvis && msg.id === lastUserMessageId && (
                          <motion.button
                            whileHover={{ scale: 1.05, y: -0.5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setEditingId(msg.id);
                              setEditingText(msg.text);
                            }}
                            title="Editar mensagem"
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-medium transition-all cursor-pointer backdrop-blur-md"
                            style={{
                              background: "rgba(255, 255, 255, 0.04)",
                              border: "1px solid rgba(255, 255, 255, 0.08)",
                              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                              color: "rgba(255, 255, 255, 0.75)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = `rgba(${accent}, 0.12)`;
                              e.currentTarget.style.borderColor = `rgba(${accent}, 0.35)`;
                              e.currentTarget.style.color = `rgb(${accent})`;
                              e.currentTarget.style.boxShadow = `0 4px 12px rgba(${accent}, 0.2)`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                              e.currentTarget.style.color = "rgba(255, 255, 255, 0.75)";
                              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.15)";
                            }}
                          >
                            <Pencil className="w-2.5 h-2.5" />
                            <span>Editar</span>
                          </motion.button>
                        )}

                        {/* Regenerate Button (Only Jarvis) */}
                        {isJarvis && onRegenerateMessage && (
                          <motion.button
                            whileHover={{ scale: 1.05, y: -0.5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onRegenerateMessage(msg.id)}
                            title="Regenerar resposta"
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-medium transition-all cursor-pointer backdrop-blur-md"
                            style={{
                              background: "rgba(255, 255, 255, 0.04)",
                              border: "1px solid rgba(255, 255, 255, 0.08)",
                              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                              color: "rgba(255, 255, 255, 0.75)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = `rgba(${accent}, 0.12)`;
                              e.currentTarget.style.borderColor = `rgba(${accent}, 0.35)`;
                              e.currentTarget.style.color = `rgb(${accent})`;
                              e.currentTarget.style.boxShadow = `0 4px 12px rgba(${accent}, 0.2)`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                              e.currentTarget.style.color = "rgba(255, 255, 255, 0.75)";
                              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.15)";
                            }}
                          >
                            <RotateCw className="w-2.5 h-2.5" />
                            <span>Regenerar</span>
                          </motion.button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Thinking bubble */}
          {isThinking && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ type: "spring", stiffness: 180, damping: 20 }}
              className="flex items-center gap-4 w-full justify-start"
            >
              <JarvisPixelAvatar state="thinking" isCritical={isCritical} />
              <div
                className="max-w-[75%] p-4 text-xs leading-relaxed"
                style={glassBubbleJarvis}
              >
                <span
                  className="block text-[8px] font-bold uppercase tracking-widest mb-2 select-none"
                  style={{ color: `rgba(${accent},0.6)` }}
                >
                  J.A.R.V.I.S • PROCESSANDO
                </span>
                <div className="flex gap-1.5 items-center py-1">
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{
                      background: `rgba(${accent},0.85)`,
                      animationDelay: "0ms",
                    }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{
                      background: `rgba(${accent},0.85)`,
                      animationDelay: "150ms",
                    }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{
                      background: `rgba(${accent},0.85)`,
                      animationDelay: "300ms",
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-end select-none text-center max-w-2xl pb-16">
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
            className="text-[28px] font-bold tracking-tight text-white/90 font-serif"
          >
            Back at it, Felipe
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xs text-white/38 mt-1 font-medium tracking-wide"
          >
            Como posso auxiliar no controle de sistemas e rotinas quânticas
            hoje?
          </motion.p>
        </div>
      )}
    </div>
  );
}
