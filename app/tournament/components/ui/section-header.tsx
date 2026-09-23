type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  eyebrowColor?: string;
  action?: React.ReactNode;
};

export function SectionHeader({
  eyebrow,
  title,
  eyebrowColor = "text-[#94a3b8]",
  action,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className={`text-[11px] font-black uppercase tracking-[0.3em] ${eyebrowColor}`}>
          {eyebrow}
        </div>
        <h2 className="mt-1 text-xl font-black tracking-tight text-[#f1f5f9]">
          {title}
        </h2>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
