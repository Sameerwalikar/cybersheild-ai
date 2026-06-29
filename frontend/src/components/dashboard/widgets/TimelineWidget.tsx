import { type TimelineEvent } from "../intelligence";

interface TimelineWidgetProps {
  events: TimelineEvent[];
}

const typeStyles: Record<string, { dot: string; label: string }> = {
  scan: { dot: "bg-[#EC9AA3]", label: "text-[#EC9AA3]" },
  threat: { dot: "bg-red-400", label: "text-red-400" },
  report: { dot: "bg-amber-400", label: "text-amber-400" },
  action: { dot: "bg-emerald-400", label: "text-emerald-400" },
};

export function TimelineWidget({ events }: TimelineWidgetProps) {
  if (events.length === 0) return null;

  return (
    <div className="space-y-0 pl-3">
      {events.map((event, i) => {
        const style = typeStyles[event.type];
        return (
          <div key={event.id} className="relative pl-5 pb-4 last:pb-0">
            {/* Connector line */}
            {i < events.length - 1 && (
              <div className="absolute left-[5px] top-3 bottom-0 w-px bg-[rgba(236,154,163,0.08)]" />
            )}
            {/* Dot */}
            <div className={`absolute left-0 top-1.5 w-[10px] h-[10px] rounded-full border-2 border-[#0D0D12] ${style.dot}`} />
            {/* Content */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={`text-[11px] font-semibold ${style.label}`}>{event.label}</p>
                <p className="text-[10px] text-[#B6B8C4]/70 truncate mt-0.5">{event.detail}</p>
              </div>
              <span className="text-[9px] text-[#B6B8C4]/50 flex-shrink-0 tabular-nums">{event.time}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
