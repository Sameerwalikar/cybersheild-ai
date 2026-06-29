import Link from "next/link";
import { type HistoryItem, scanTypeLabels, riskColors, riskBg } from "@/components/history/mocks";

interface RecentAnalysisWidgetProps {
  items: HistoryItem[];
}

export function RecentAnalysisWidget({ items }: RecentAnalysisWidgetProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const d = new Date(item.timestamp);
        const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
        return (
          <Link
            key={item.id}
            href="/scan/analysis"
            className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-[rgba(236,154,163,0.03)] transition-colors group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${riskBg[item.riskLevel]}`} />
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-[#F8F8FA] truncate group-hover:text-[#EC9AA3] transition-colors">{item.contentPreview.slice(0, 35)}...</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] text-[#B6B8C4]/60 uppercase">{scanTypeLabels[item.scanType]}</span>
                  <span className="text-[9px] text-[#B6B8C4]/40">{time}</span>
                </div>
              </div>
            </div>
            <span className={`text-xs font-bold tabular-nums ${riskColors[item.riskLevel]}`}>{item.riskScore}</span>
          </Link>
        );
      })}
    </div>
  );
}
