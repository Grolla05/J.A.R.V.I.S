/* eslint-disable */

export default function ClaudeBadge() {
  return (
    <div className="flex items-center gap-2 px-2 py-0.5 bg-white/10 rounded border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
      <svg width="12" height="12" viewBox="0 0 16 16" fill="white" className="opacity-80">
        <path d="M4 4h8v8H4V4zm1 1v6h6V5H5z" />
        <rect x="7" y="7" width="2" height="2" />
      </svg>
      <span className="text-[9px] font-bold tracking-tighter text-white uppercase">
        Claude Code
      </span>
    </div>
  );
}
