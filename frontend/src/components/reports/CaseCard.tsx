"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Paperclip } from "lucide-react";
import type { ReportItem } from "@/services/api/reports";
import { CATEGORY_LABELS, MOTION_EASE, formatReportDate } from "./constants";
import { StatusBadge } from "./StatusBadge";
import { PriorityBadge } from "@/components/ui/PriorityBadge";

interface CaseCardProps {
  report: ReportItem;
  expanded: boolean;
  onToggle: () => void;
}

export const CaseCard = memo(function CaseCard({ report, expanded, onToggle }: CaseCardProps) {
  const category = CATEGORY_LABELS[report.type] || report.type;
  const formattedDate = formatReportDate(report.createdAt);

  return (
    <motion.article layout className="group relative overflow-hidden">
      <div
        className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 ${
          expanded ? "opacity-100" : "group-hover:opacity-100"
        }`}
        aria-hidden="true"
      >
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[rgba(236,154,163,0.08)] blur-2xl" />
      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={`case-details-${report.id}`}
        className="relative w-full p-4 sm:p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EC9AA3]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050508]"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-[#F8F8FA]">{category}</h3>
              {report.priority && report.priority !== "low" && (
                <PriorityBadge priority={report.priority} />
              )}
            </div>

            <p className="line-clamp-2 text-sm leading-relaxed text-[#B6B8C4]">
              {report.description}
            </p>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#B6B8C4]/65">
              <span>{formattedDate}</span>
              <span className="font-mono text-[#EC9AA3]/75">{report.reportNumber}</span>
              {report.attachments > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Paperclip className="h-3 w-3" aria-hidden="true" />
                  {report.attachments}
                </span>
              )}
              <span className="text-[#B6B8C4]/35">ID {report.id.slice(0, 8)}</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
            <StatusBadge status={report.status} />
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold transition-colors ${
                expanded ? "text-[#EC9AA3]" : "text-[#B6B8C4] group-hover:text-[#F8F8FA]"
              }`}
            >
              {expanded ? "Hide Details" : "View Details"}
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
      </button>
    </motion.article>
  );
});

CaseCard.displayName = "CaseCard";

export const listItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: MOTION_EASE } },
};
