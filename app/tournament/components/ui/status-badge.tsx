type StatusBadgeProps = {
  status: "Scheduled" | "Live" | "Completed" | "Cancelled";
  className?: string;
};

const CONFIG = {
  Live: {
    label: "LIVE",
    className: "border-[#ff2d55]/50 bg-[#ff2d55]/10 text-[#ff4d6a]",
    dot: true,
  },
  Completed: {
    label: "FINAL",
    className: "border-[#10b981]/40 bg-[#10b981]/10 text-[#34d399]",
    dot: false,
  },
  Scheduled: {
    label: "UPCOMING",
    className: "border-[#06b6d4]/40 bg-[#06b6d4]/10 text-[#22d3ee]",
    dot: false,
  },
  Cancelled: {
    label: "CANCELLED",
    className: "border-[#64748b]/40 bg-[#64748b]/10 text-[#94a3b8]",
    dot: false,
  },
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const cfg = CONFIG[status] ?? CONFIG.Scheduled;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[9px] font-black tracking-widest ${cfg.className} ${className}`}
    >
      {cfg.dot && <span className="live-dot h-1.5 w-1.5 flex-shrink-0" />}
      {cfg.label}
    </span>
  );
}
