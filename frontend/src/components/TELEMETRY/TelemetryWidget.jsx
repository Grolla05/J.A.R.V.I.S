import { motion } from "framer-motion";
import { springDraggable } from "../../utils/motion";
import { X } from "lucide-react";

export default function TelemetryWidget({
  title,
  onClose,
  positionClasses = "",
  children,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={springDraggable}
      drag
      dragElastic={0.1}
      whileDrag={{ scale: 1.04, cursor: "grabbing" }}
      className={`absolute flex flex-col gap-2.5 p-4 w-56 liquid-glass pointer-events-auto select-none cursor-grab ${positionClasses}`}
      style={{ touchAction: "none" }}
    >
      {/* Titlebar of the Widget */}
      <div className="flex items-center justify-between border-b border-white/5 pb-1.5 select-none">
        <h3 className="text-[9px] font-bold tracking-[0.15em] text-white/40 uppercase">
          {title}
        </h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="text-[10px] text-white/20 hover:text-white/60 transition-colors duration-200 cursor-pointer flex items-center justify-center"
        >
          <X size={10} />
        </button>
      </div>

      {children}
    </motion.div>
  );
}
