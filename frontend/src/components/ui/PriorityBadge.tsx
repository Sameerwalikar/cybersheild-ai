// PriorityBadge — compact pill for priority level
const styles: Record<string, string> = {
  critical: "bg-red-500/15 text-red-400 border-red-500/25 ring-1 ring-red-500/20",
  high:     "bg-orange-500/15 text-orange-400 border-orange-500/25",
  medium:   "bg-amber-500/12 text-amber-400 border-amber-500/20",
  low:      "bg-[#B6B8C4]/8 text-[#B6B8C4] border-[#B6B8C4]/15",
};

interface PriorityBadgeProps {
  priority: string;
  className?: string;
}

export function PriorityBadge({ priority, className = "" }: PriorityBadgeProps) {
  const p = priority.toLowerCase();
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${styles[p] ?? styles.low} ${className}`}
    >
      {p}
    </span>
  );
}
