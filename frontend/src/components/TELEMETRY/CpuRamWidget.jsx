export default function CpuRamWidget({ data }) {
  if (!data) return null;

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-[11px] font-medium text-white/70">
          <span>CPU Usage</span>
          <span className="font-semibold text-cyan-400">{data.cpu.usage}%</span>
        </div>
        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
          <div
            className="bg-cyan-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${data.cpu.usage}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-[11px] font-medium text-white/70">
          <span>RAM Memory</span>
          <span className="font-semibold text-cyan-300">
            {data.ram.used_gb} GB
          </span>
        </div>
      </div>

      <div className="flex justify-between text-[11px] font-medium text-white/60 border-t border-white/5 pt-2 mt-1 select-text">
        <span>Uptime</span>
        <span className="text-white/80 font-mono text-[10px]">
          {data.sys?.uptime || "02:14:35"}
        </span>
      </div>
    </>
  );
}
