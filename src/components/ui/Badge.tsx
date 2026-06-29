type BadgeVariant = "default" | "success" | "warning" | "danger" | "accent";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-[#12121A] text-[#B6B8C4] border-[rgba(236,154,163,0.1)]",
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  danger: "bg-red-500/10 text-red-400 border-red-500/20",
  accent: "bg-[rgba(236,154,163,0.08)] text-[#EC9AA3] border-[rgba(236,154,163,0.2)]",
};

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
