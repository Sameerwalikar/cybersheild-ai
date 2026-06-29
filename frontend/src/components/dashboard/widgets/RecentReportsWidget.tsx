import { type ReportItem, categoryLabels, statusStyles } from "@/components/history/mocks";

interface RecentReportsWidgetProps {
  reports: ReportItem[];
}

export function RecentReportsWidget({ reports }: RecentReportsWidgetProps) {
  if (reports.length === 0) return null;

  return (
    <div className="space-y-2">
      {reports.map((report) => {
        const style = statusStyles[report.status];
        const d = new Date(report.createdAt);
        const date = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
        return (
          <div key={report.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-[rgba(236,154,163,0.03)] transition-colors">
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-[#F8F8FA]">{categoryLabels[report.category]}</p>
              <span className="text-[9px] text-[#B6B8C4]/60">{date} • {report.reportNumber}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className={`w-1.5 h-1.5 rounded-full ${style.bg}`} />
              <span className={`text-[9px] font-semibold capitalize ${style.color}`}>{report.status.replace("_", " ")}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
