"use client";

import { type ReactNode } from "react";
import { Skeleton } from "@/components/ui";

interface WidgetCardProps {
  title: string;
  icon?: ReactNode;
  actions?: ReactNode;
  loading?: boolean;
  status?: "default" | "success" | "warning" | "danger";
  span?: 1 | 2;
  children: ReactNode;
  className?: string;
}

const statusBorder: Record<string, string> = {
  default: "border-[rgba(236,154,163,0.08)]",
  success: "border-emerald-500/15",
  warning: "border-amber-500/15",
  danger: "border-red-500/15",
};

export function WidgetCard({
  title,
  icon,
  actions,
  loading = false,
  status = "default",
  span = 1,
  children,
  className = "",
}: WidgetCardProps) {
  return (
    <div
      className={`
        relative rounded-xl bg-[#0D0D12]/80 backdrop-blur-sm border p-5
        transition-[border-color,box-shadow] duration-200
        hover:border-[rgba(236,154,163,0.15)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.15)]
        ${statusBorder[status]}
        ${span === 2 ? "lg:col-span-2" : ""}
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          {icon && <span className="text-[#EC9AA3]/70">{icon}</span>}
          <h3 className="text-xs font-semibold text-[#B6B8C4] uppercase tracking-wider">{title}</h3>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : (
        children
      )}
    </div>
  );
}
