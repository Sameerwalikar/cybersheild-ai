// StatusDot — semantic colored dot for record status
type StatusKey =
  | "new" | "submitted" | "under_review" | "investigating"
  | "action_taken" | "resolved" | "rejected" | "archived"
  | "active" | "monitoring" | "pending_review" | "closed";

const dotColor: Record<string, string> = {
  new:            "bg-blue-400",
  submitted:      "bg-blue-400",
  under_review:   "bg-amber-400",
  investigating:  "bg-[#EC9AA3]",
  action_taken:   "bg-emerald-400",
  resolved:       "bg-emerald-400",
  active:         "bg-emerald-400",
  monitoring:     "bg-amber-400",
  rejected:       "bg-red-400/60",
  archived:       "bg-[#B6B8C4]/40",
  pending_review: "bg-amber-400",
  closed:         "bg-[#B6B8C4]/40",
};

interface StatusDotProps {
  status: string;
  pulse?: boolean;
  size?: "sm" | "md";
}

export function StatusDot({ status, pulse = false, size = "sm" }: StatusDotProps) {
  const color = dotColor[status.toLowerCase()] ?? "bg-[#B6B8C4]/40";
  const dim = size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5";
  return (
    <span className={`relative inline-flex flex-shrink-0 ${dim}`}>
      {pulse && (
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-60`} />
      )}
      <span className={`relative inline-flex rounded-full ${dim} ${color}`} />
    </span>
  );
}
