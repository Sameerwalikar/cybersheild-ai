import { type ThreatIndicator } from "./mocks";

interface ThreatBreakdownProps {
  threats: ThreatIndicator[];
}

const severityColor: Record<string, string> = {
  low: "bg-emerald-400",
  medium: "bg-amber-400",
  high: "bg-orange-400",
  critical: "bg-red-400",
};

export function ThreatBreakdown({ threats }: ThreatBreakdownProps) {
  return (
    <div className="space-y-3">
      {threats.map((threat) => (
        <div
          key={threat.id}
          className="px-4 py-3 rounded-xl bg-[#12121A]/60 border border-[rgba(236,154,163,0.06)] hover:border-[rgba(236,154,163,0.15)] transition-colors duration-150"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${severityColor[threat.severity]}`} />
              <span className="text-sm font-medium text-[#F8F8FA]">{threat.label}</span>
            </div>
            <span className="text-[10px] font-bold text-[#B6B8C4] tabular-nums">
              {Math.round(threat.confidence * 100)}%
            </span>
          </div>
          <p className="text-[11px] text-[#B6B8C4] leading-relaxed pl-4">{threat.description}</p>
        </div>
      ))}
    </div>
  );
}
