/* eslint-disable */
import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Paperclip, SendHorizontal } from "lucide-react";
import FileChip from "./FileChip";

const glassCard = {
  background: "rgba(255,255,255,0.05)",
  backdropFilter: "blur(24px) saturate(180%)",
  WebkitBackdropFilter: "blur(24px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "24px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.16)",
};

const clayBtn = (accent) => ({
  background: `linear-gradient(135deg, rgba(${accent},0.40) 0%, rgba(${accent},0.55) 100%)`,
  boxShadow: `0 8px 20px rgba(${accent},0.32), 0 3px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -2px 0 rgba(0,0,0,0.18)`,
  border: `1px solid rgba(${accent},0.38)`,
  borderRadius: "50%",
});

const clayBtnSm = {
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
  boxShadow:
    "0 4px 12px rgba(0,0,0,0.35), 0 1px 4px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.15)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "12px",
};

export default function ChatInput({
  inputValue,
  setInputValue,
  attachedFiles,
  onFileChange,
  onRemoveFile,
  onSend,
  accent,
}) {
  const fileInputRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="w-full max-w-2xl mb-8 flex flex-col items-center gap-3">
      {/* Hidden file input — direct explorer trigger */}
      <input
        ref={fileInputRef}
        type="file"
        accept="*/*"
        multiple
        className="hidden"
        onChange={onFileChange}
      />

      <div className="w-full p-4 flex flex-col gap-2.5" style={glassCard}>
        {/* Attached files preview */}
        <AnimatePresence>
          {attachedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-1.5 pb-2.5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
            >
              <AnimatePresence>
                {attachedFiles.map((f) => (
                  <FileChip
                    key={f.id}
                    file={f}
                    onRemove={onRemoveFile}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Textarea */}
        <textarea
          rows={2}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Peça ao JARVIS ou digite um comando..."
          className="w-full bg-transparent border-none outline-none resize-none text-xs text-white/88 placeholder-white/20 leading-relaxed"
        />

        {/* Bottom toolbar */}
        <div
          className="flex items-center justify-between pt-2.5"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          {/* Left: attach button (direct OS explorer) */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.08, y: -1 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => fileInputRef.current?.click()}
              className="w-7 h-7 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors cursor-pointer text-base"
              style={clayBtnSm}
              title="Anexar arquivo"
            >
              <Paperclip size={11} />
            </motion.button>
          </div>

          {/* Right: send button */}
          <motion.button
            whileHover={{ scale: 1.08, y: -1 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => onSend()}
            className="w-9 h-9 flex items-center justify-center text-white/90 cursor-pointer transition-all duration-200 text-base"
            style={clayBtn(accent)}
            title="Enviar"
          >
            <SendHorizontal
              size={14}
              className="transform translate-x-[0.5px]"
            />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
