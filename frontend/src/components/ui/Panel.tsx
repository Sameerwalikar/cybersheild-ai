// Panel — premium surface card used throughout police pages
import type { ReactNode } from "react";

interface PanelProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  /** "default" | "critical" | "warning" | "success" */
  variant?: "default" | "critical" | "warning" | "success";
  noPadding?: boolean;
}

const variantBorder: Record<string, string> = {
  default:  "border-[rgba(236,154,163,0.07)] hover:border-[rgba(236,154,163,0.13)]",
  critical: "border-red-500/20 hover:border-red-500/30",
  warning:  "border-amber-500/20 hover:border-amber-500/30",
  success:  "border-emerald-500/15 hover:border-emerald-500/25",
};

const variantGlow: Record<string, string> = {
  default:  "",
  critical: "shadow-[0_0_0_1px_rgba(239,68,68,0.05),0_4px_24px_rgba(239,68,68,0.06)]",
  warning:  "shadow-[0_0_0_1px_rgba(245,158,11,0.05),0_4px_24px_rgba(245,158,11,0.06)]",
  success:  "",
};

export function Panel({
  title,
  subtitle,
  action,
  footer,
  children,
  className = "",
  variant = "default",
  noPadding = false,
}: PanelProps) {
  return (
    <div
      className={`
        flex flex-col rounded-2xl bg-[#0D0D14]/85 backdrop-blur-sm border
        transition-[border-color,box-shadow] duration-200
        ${variantBorder[variant]}
        ${variantGlow[variant]}
        ${noPadding ? "" : "p-4"}
        ${className}
      `}
    >
      {(title || action) && (
        <div className={`flex items-start justify-between gap-3 mb-3 ${noPadding ? "p-4 pb-0" : ""}`}>
          <div className="min-w-0">
            {title && (
              <h2 className="text-[10px] font-bold text-[#B6B8C4]/80 uppercase tracking-[0.08em] leading-none">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-[9px] text-[#B6B8C4]/40 mt-1 leading-tight">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className={`flex-1 min-h-0 ${noPadding ? "px-4 pb-4" : ""}`}>{children}</div>
      {footer && (
        <div className={`mt-3 pt-3 border-t border-[rgba(236,154,163,0.05)] ${noPadding ? "px-4 pb-4" : ""}`}>
          {footer}
        </div>
      )}
    </div>
  );
}
