export default function CodeEditor({ activeFile, codeContent = "", theme }) {
  return (
    <div className="flex-1 rounded border border-white/5 bg-black/40 p-4 overflow-hidden h-full flex flex-col relative">
      <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-3 select-none">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white font-bold tracking-tight">
            {activeFile}
          </span>
          <span className="px-1 py-0.5 rounded bg-white/5 text-[7px] text-white/30 uppercase">
            Read
          </span>
        </div>
        <span className="text-[8px] text-white/10">UTF-8</span>
      </div>

      <div className="flex-1 text-[11px] text-white/80 overflow-y-auto pr-1 select-text scrollbar-thin leading-relaxed">
        <pre className="m-0 h-full w-full">
          <code>
            {codeContent.split("\n").map((line, idx) => (
              <div
                key={idx}
                className={`flex items-start group ${
                  idx % 2 === 0 ? "bg-white/[0.01]" : ""
                }`}
              >
                <span className="w-8 text-[9px] text-white/10 select-none text-right pr-3 mt-0.5 group-hover:text-white/30 transition-colors">
                  {idx + 1}
                </span>
                <span className="flex-1 break-all whitespace-pre-wrap">
                  {line}
                </span>
              </div>
            ))}
          </code>
        </pre>
      </div>

      {/* Prompt de Comando Mockado */}
      <div className="mt-3 pt-2 border-t border-white/5 flex items-center gap-2 text-[10px] text-white/40 select-none">
        <span className="text-white/60 font-bold">{">"}</span>
        <span className="animate-pulse">_</span>
      </div>
    </div>
  );
}
