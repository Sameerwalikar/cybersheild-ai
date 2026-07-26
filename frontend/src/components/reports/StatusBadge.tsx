import { STATUS_STYLES } from "./constants";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? {
    bg: "bg-[#B6B8C4]",
    color: "text-[#B6B8C4]",
    label: status.replace(/_/g, " "),
    border: "border-[rgba(236,154,163,0.1)] bg-[#12121A]",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${style.border} ${className}`}
      aria-label={`Status: ${style.label}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.bg}`} aria-hidden="true" />
      <span className={`text-[10px] font-semibold capitalize ${style.color}`}>{style.label}</span>
    </span>
  );
}
