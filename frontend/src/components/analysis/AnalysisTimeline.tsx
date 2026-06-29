import { type TimelineStep } from "./mocks";

interface AnalysisTimelineProps {
  steps: TimelineStep[];
}

export function AnalysisTimeline({ steps }: AnalysisTimelineProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center gap-1 min-w-[80px]">
            <div className={`w-3 h-3 rounded-full flex items-center justify-center ${step.status === "completed" ? "bg-emerald-500" : step.status === "active" ? "bg-[#EC9AA3] animate-pulse" : "bg-[#1a1a2e]"}`}>
              {step.status === "completed" && (
                <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              )}
            </div>
            <span className="text-[9px] text-[#B6B8C4] text-center whitespace-nowrap">{step.label}</span>
            {step.duration && <span className="text-[8px] text-[#B6B8C4]/40 tabular-nums">{step.duration}ms</span>}
          </div>
          {i < steps.length - 1 && (
            <div className={`w-6 h-px flex-shrink-0 ${step.status === "completed" ? "bg-emerald-500/40" : "bg-[#1a1a2e]"}`} />
          )}
        </div>
      ))}
    </div>
  );
}
