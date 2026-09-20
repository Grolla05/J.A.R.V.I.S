import { motion } from "framer-motion";

export default function CodeFileTree({
  fileNames = [],
  activeFile,
  onSelectFile,
  theme,
}) {
  return (
    <div className="flex flex-col gap-1 select-none">
      <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest mb-2 px-1">
        Files
      </span>
      {fileNames.map((fileName) => {
        const isActive = activeFile === fileName;
        return (
          <motion.button
            key={fileName}
            onClick={() => onSelectFile(fileName)}
            whileHover={{ x: 2 }}
            className={`w-full text-left px-2 py-1.5 rounded text-[11px] transition-all duration-200 cursor-pointer flex items-center gap-2 ${
              isActive
                ? `${theme.btnActive}`
                : "text-white/40 hover:text-white/60 hover:bg-white/5"
            }`}
          >
            <span className={isActive ? "text-white" : "text-white/20"}>
              _
            </span>
            {fileName}
          </motion.button>
        );
      })}
    </div>
  );
}
