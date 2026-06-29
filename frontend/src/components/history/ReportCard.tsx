import { type ReportItem, categoryLabels, statusStyles } from "./mocks";

interface ReportCardProps {
  report: ReportItem;
}

export function ReportCard({ report }: ReportCardProps) {
  const date = new Date(report.createdAt);
  const formatted = date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const style = statusStyles[report.status];
  const statusLabel = report.status.replace("_", " ");

  return (
    <div className="p-4 rounded-xl bg-[#0D0D12]/80 border border-[rgba(236,154,163,0.06)] hover:border-[rgba(236,154,163,0.15)] transition-colors duration-150">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[9px] font-mono text-[#EC9AA3]">{report.reportNumber}</span>
            <span className="text-[10px] font-bold text-[#B6B8C4] uppercase">{categoryLabels[report.category]}</span>
          </div>
          <p className="text-xs text-[#F8F8FA] line-clamp-2">{report.description}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[9px] text-[#B6B8C4]/60">{formatted}</span>
            {report.attachments > 0 && (
              <span className="text-[9px] text-[#B6B8C4]/60">📎 {report.attachments} file{report.attachments > 1 ? "s" : ""}</span>
            )}
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${report.status === "resolved" ? "border-emerald-500/20 bg-emerald-500/5" : report.status === "rejected" ? "border-red-500/20 bg-red-500/5" : report.status === "under_review" ? "border-amber-500/20 bg-amber-500/5" : "border-[rgba(236,154,163,0.1)] bg-[#12121A]"}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${style.bg}`} />
          <span className={`text-[9px] font-semibold capitalize ${style.color}`}>{statusLabel}</span>
        </div>
      </div>
    </div>
  );
}
