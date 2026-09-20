export default function ClaudeOutput({ simulatedLogs = [] }) {
  return (
    <div className="flex-1 rounded border border-white/5 bg-black/20 p-3 flex flex-col gap-2 overflow-hidden">
      <div className="flex justify-between items-center border-b border-white/5 pb-1 select-none">
        <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">
          Claude Output
        </span>
        <span className="text-[7px] text-white/10 uppercase">v0.1.0</span>
      </div>
      <div className="flex-1 text-[10px] text-white/60 overflow-y-auto flex flex-col gap-1.5 pr-1 scrollbar-none select-text">
        {simulatedLogs.map((logStr, i) => (
          <div
            key={i}
            className="leading-tight opacity-80 hover:opacity-100 transition-opacity"
          >
            <span className="text-white/20 mr-1">$</span> {logStr}
          </div>
        ))}
      </div>
    </div>
  );
}
