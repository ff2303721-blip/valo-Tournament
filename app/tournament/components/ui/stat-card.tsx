type StatCardProps = {
  label: string;
  count: number | string;
  accent?: "cyan" | "green" | "crimson" | "violet" | "gold";
};

const ACCENT_MAP = {
  cyan:    { border: "border-[#06b6d4]/25",  bg: "from-[#06b6d4]/5",   text: "text-[#22d3ee]" },
  green:   { border: "border-[#10b981]/25",  bg: "from-[#10b981]/5",   text: "text-[#34d399]" },
  crimson: { border: "border-[#ff2d55]/30",  bg: "from-[#ff2d55]/8",   text: "text-[#ff4d6a]" },
  violet:  { border: "border-[#7c3aed]/25",  bg: "from-[#7c3aed]/8",   text: "text-[#9d63ff]" },
  gold:    { border: "border-[#f59e0b]/25",  bg: "from-[#f59e0b]/8",   text: "text-[#fbbf24]" },
};

export function StatCard({ label, count, accent = "cyan" }: StatCardProps) {
  const c = ACCENT_MAP[accent];

  return (
    <div
      className={`rounded-xl border ${c.border} bg-gradient-to-br ${c.bg} to-transparent p-5 transition hover:brightness-110`}
      style={{ background: `linear-gradient(135deg, rgba(12,12,24,0.9) 0%, rgba(19,19,38,0.6) 100%)` }}
    >
      <div className={`text-[9px] font-black uppercase tracking-[0.25em] ${c.text}`}>
        {label}
      </div>
      <div className={`mt-3 text-4xl font-black tracking-tighter ${c.text}`}>
        {count}
      </div>
    </div>
  );
}
