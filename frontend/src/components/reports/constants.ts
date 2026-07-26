export const TIMELINE_STEPS = [
  { key: "submitted", label: "Submitted" },
  { key: "under_review", label: "Reviewed" },
  { key: "investigating", label: "Investigation Started" },
  { key: "action_taken", label: "Action Taken" },
  { key: "resolved", label: "Resolved" },
] as const;

export const STATUS_STYLES: Record<string, { bg: string; color: string; label: string; border: string }> = {
  submitted: {
    bg: "bg-blue-400",
    color: "text-blue-400",
    label: "Submitted",
    border: "border-blue-500/20 bg-blue-500/5",
  },
  under_review: {
    bg: "bg-amber-400",
    color: "text-amber-400",
    label: "Under Review",
    border: "border-amber-500/20 bg-amber-500/5",
  },
  investigating: {
    bg: "bg-[#EC9AA3]",
    color: "text-[#EC9AA3]",
    label: "Investigating",
    border: "border-[rgba(236,154,163,0.25)] bg-[rgba(236,154,163,0.08)]",
  },
  action_taken: {
    bg: "bg-emerald-400",
    color: "text-emerald-400",
    label: "Action Taken",
    border: "border-emerald-500/20 bg-emerald-500/5",
  },
  resolved: {
    bg: "bg-emerald-300",
    color: "text-emerald-300",
    label: "Resolved",
    border: "border-emerald-500/25 bg-emerald-500/8",
  },
  rejected: {
    bg: "bg-red-400",
    color: "text-red-400/80",
    label: "Rejected",
    border: "border-red-500/20 bg-red-500/5",
  },
  archived: {
    bg: "bg-[#B6B8C4]",
    color: "text-[#B6B8C4]/70",
    label: "Archived",
    border: "border-[#B6B8C4]/15 bg-[#B6B8C4]/5",
  },
};

export const CATEGORY_LABELS: Record<string, string> = {
  Phishing: "Phishing",
  "Financial Fraud": "Financial Fraud",
  "Identity Theft": "Identity Theft",
  "Vishing (Voice Scam)": "Vishing",
  "UPI Fraud": "UPI Fraud",
  Other: "Other",
};

export const CLOSED_STATUSES = new Set(["resolved", "rejected", "archived"]);

export const MOTION_EASE = [0.22, 0.03, 0.26, 1] as [number, number, number, number];

export function getTimelineIndex(status: string): number {
  const idx = TIMELINE_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : -1;
}

export function isOpenCase(status: string): boolean {
  return !CLOSED_STATUSES.has(status);
}

export function formatReportDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
