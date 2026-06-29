import { type Recommendation } from "./mocks";

interface RecommendationsListProps {
  recommendations: Recommendation[];
}

const priorityStyles: Record<string, { dot: string; label: string }> = {
  high: { dot: "bg-red-400", label: "text-red-400" },
  medium: { dot: "bg-amber-400", label: "text-amber-400" },
  low: { dot: "bg-[#B6B8C4]", label: "text-[#B6B8C4]" },
};

export function RecommendationsList({ recommendations }: RecommendationsListProps) {
  return (
    <div className="space-y-2.5">
      {recommendations.map((rec, i) => {
        const style = priorityStyles[rec.priority];
        return (
          <div key={rec.id} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#12121A]/60 border border-[rgba(236,154,163,0.06)]">
            <div className="flex items-center gap-2 mt-0.5 flex-shrink-0">
              <span className="text-[10px] font-bold text-[#B6B8C4]/50 tabular-nums w-4">{i + 1}</span>
              <div className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#F8F8FA]">{rec.action}</p>
              <p className="text-[10px] text-[#B6B8C4]/70 mt-0.5">{rec.impact}</p>
            </div>
            <span className={`text-[9px] font-bold uppercase ${style.label} flex-shrink-0`}>{rec.priority}</span>
          </div>
        );
      })}
    </div>
  );
}
