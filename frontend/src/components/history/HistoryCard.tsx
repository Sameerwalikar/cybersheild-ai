import Link from "next/link";
import { type HistoryItem, scanTypeLabels, riskColors, riskBg } from "./mocks";

interface HistoryCardProps {
  item: HistoryItem;
}

export function HistoryCard({ item }: HistoryCardProps) {
  const date = new Date(item.timestamp);
  const formatted = date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const time = date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <Link
      href="/scan/analysis"
      className="block p-4 rounded-xl bg-[#0D0D12]/80 border border-[rgba(236,154,163,0.06)] hover:border-[rgba(236,154,163,0.18)] hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold text-[#B6B8C4] uppercase tracking-wider">{scanTypeLabels[item.scanType]}</span>
            <span className={`text-[10px] font-bold capitalize ${riskColors[item.riskLevel]}`}>{item.riskLevel}</span>
          </div>
          <p className="text-xs text-[#F8F8FA] truncate">{item.contentPreview}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[9px] text-[#B6B8C4]/60 font-mono">{item.id}</span>
            <span className="text-[9px] text-[#B6B8C4]/40">{formatted} • {time}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${riskBg[item.riskLevel]}`} />
            <span className="text-sm font-bold text-[#F8F8FA] tabular-nums">{item.riskScore}</span>
          </div>
          <span className={`text-[9px] font-medium ${item.status === "blocked" ? "text-red-400" : "text-emerald-400"}`}>
            {item.status === "blocked" ? "Blocked" : "Clear"}
          </span>
        </div>
      </div>
    </Link>
  );
}
