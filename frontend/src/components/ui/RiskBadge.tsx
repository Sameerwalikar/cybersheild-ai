// RiskBadge — risk level dot + optional label
export const RISK_DOT: Record<string, string> = {
  safe:     "bg-emerald-400",
  low:      "bg-emerald-300",
  medium:   "bg-amber-400",
  high:     "bg-orange-400",
  critical: "bg-red-400",
};

export const RISK_TEXT: Record<string, string> = {
  safe:     "text-emerald-400",
  low:      "text-emerald-300",
  medium:   "text-amber-400",
  high:     "text-orange-400",
  critical: "text-red-400",
};

export const RISK_BG: Record<string, string> = {
  safe:     "bg-emerald-500/10 border-emerald-500/20",
  low:      "bg-emerald-500/8 border-emerald-500/15",
  medium:   "bg-amber-500/10 border-amber-500/20",
  high:     "bg-orange-500/10 border-orange-500/20",
  critical: "bg-red-500/10 border-red-500/20",
};

interface RiskBadgeProps {
  level: string;
  score?: number;
  showLabel?: boolean;
}

export function RiskBadge({ level, score, showLabel = false }: RiskBadgeProps) {
  const l = level?.toLowerCase() ?? "low";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${RISK_DOT[l] ?? "bg-[#B6B8C4]"}`} />
      {score !== undefined && (
        <span className={`text-xs font-bold tabular-nums ${RISK_TEXT[l] ?? "text-[#F8F8FA]"}`}>{score}</span>
      )}
      {showLabel && (
        <span className={`text-[9px] uppercase font-semibold ${RISK_TEXT[l] ?? "text-[#B6B8C4]"}`}>{l}</span>
      )}
    </span>
  );
}
