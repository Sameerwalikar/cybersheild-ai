import { type EvidenceItem } from "./mocks";

interface EvidencePanelProps {
  evidence: EvidenceItem[];
}

export function EvidencePanel({ evidence }: EvidencePanelProps) {
  return (
    <div className="space-y-2.5">
      {evidence.map((item) => (
        <div
          key={item.id}
          className="px-4 py-3 rounded-xl bg-[#12121A]/60 border border-[rgba(236,154,163,0.06)]"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-[#EC9AA3] uppercase tracking-wider">{item.highlight}</span>
            <span className="text-[9px] text-[#B6B8C4]/60">{item.category}</span>
          </div>
          <p className="text-xs text-[#F8F8FA] font-mono bg-[rgba(236,154,163,0.04)] px-2.5 py-1.5 rounded-md border border-[rgba(236,154,163,0.08)]">
            {item.text}
          </p>
        </div>
      ))}
    </div>
  );
}
