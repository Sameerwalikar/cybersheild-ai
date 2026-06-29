import { type ConfidenceData } from "./mocks";

interface ConfidencePanelProps {
  confidence: ConfidenceData;
}

export function ConfidencePanel({ confidence }: ConfidencePanelProps) {
  return (
    <div className="px-4 py-4 rounded-xl bg-[#12121A]/60 border border-[rgba(236,154,163,0.06)]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-[#B6B8C4] uppercase tracking-wider">AI Confidence</span>
        <span className="text-lg font-bold text-[#EC9AA3] tabular-nums">{confidence.score}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#1a1a2e] overflow-hidden mb-3">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#EC9AA3] to-[#F3B3BA]"
          style={{ width: `${confidence.score}%`, transition: "width 1.2s cubic-bezier(0.22, 0.03, 0.26, 1)" }}
        />
      </div>
      <ul className="space-y-1.5">
        {confidence.reasons.map((reason, i) => (
          <li key={i} className="flex items-start gap-2">
            <div className="w-1 h-1 rounded-full bg-[#EC9AA3]/50 mt-1.5 flex-shrink-0" />
            <span className="text-[11px] text-[#B6B8C4] leading-relaxed">{reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
