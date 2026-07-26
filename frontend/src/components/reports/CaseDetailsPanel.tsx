"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { FileText, Shield, Paperclip, MessageSquare } from "lucide-react";
import type { ReportItem } from "@/services/api/reports";
import { CATEGORY_LABELS, MOTION_EASE, formatReportDate } from "./constants";
import { InvestigationTimeline } from "./InvestigationTimeline";
import { PriorityBadge } from "@/components/ui/PriorityBadge";

interface CaseDetailsPanelProps {
  report: ReportItem;
}

function DetailSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[rgba(236,154,163,0.08)] bg-[rgba(8,8,15,0.55)] p-4 backdrop-blur-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[#EC9AA3]/80">{icon}</span>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#B6B8C4]">{title}</h4>
      </div>
      {children}
    </section>
  );
}

export const CaseDetailsPanel = memo(function CaseDetailsPanel({ report }: CaseDetailsPanelProps) {
  const category = CATEGORY_LABELS[report.type] || report.type;
  const hasEvidence = report.evidence?.length > 0 || !!report.aiSummary;
  const hasAttachments = report.evidence?.length > 0;
  const isResolved = report.status === "resolved";

  return (
    <motion.div
      id={`case-details-${report.id}`}
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.35, ease: MOTION_EASE }}
      className="overflow-hidden border-t border-[rgba(236,154,163,0.08)]"
    >
      <div className="space-y-4 p-4 sm:p-5">
        <InvestigationTimeline currentStatus={report.status} />

        <div className="grid gap-4 lg:grid-cols-2">
          <DetailSection title="Case Summary" icon={<FileText className="h-4 w-4" />}>
            <div className="space-y-2 text-sm">
              <p className="text-[#F8F8FA]">{report.description}</p>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-[#B6B8C4]/70">Category</span>
                  <p className="text-[#F8F8FA]">{category}</p>
                </div>
                <div>
                  <span className="text-[#B6B8C4]/70">Priority</span>
                  <div className="mt-1">
                    <PriorityBadge priority={report.priority} />
                  </div>
                </div>
                <div>
                  <span className="text-[#B6B8C4]/70">Filed</span>
                  <p className="text-[#F8F8FA]">{formatReportDate(report.createdAt)}</p>
                </div>
                <div>
                  <span className="text-[#B6B8C4]/70">Last Updated</span>
                  <p className="text-[#F8F8FA]">{formatReportDate(report.updatedAt)}</p>
                </div>
              </div>
            </div>
          </DetailSection>

          <DetailSection title="Evidence Summary" icon={<Shield className="h-4 w-4" />}>
            {hasEvidence ? (
              <div className="space-y-2 text-sm text-[#F8F8FA]">
                {report.aiSummary && (
                  <p className="rounded-lg border border-[rgba(236,154,163,0.08)] bg-[rgba(236,154,163,0.03)] px-3 py-2 text-[#B6B8C4]">
                    {report.aiSummary}
                  </p>
                )}
                {report.evidence?.length > 0 && (
                  <ul className="space-y-1.5">
                    {report.evidence.map((item, index) => (
                      <li
                        key={`${item}-${index}`}
                        className="truncate rounded-md bg-[rgba(255,255,255,0.02)] px-2.5 py-1.5 text-xs text-[#B6B8C4]"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="text-sm text-[#B6B8C4]/60">No evidence summary available yet.</p>
            )}
          </DetailSection>
        </div>

        {report.acknowledgement && (
          <DetailSection title="Police Updates" icon={<MessageSquare className="h-4 w-4" />}>
            <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/5 px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-400">
                Officer Message
              </p>
              <p className="mt-1 text-sm text-[#F8F8FA]">{report.acknowledgement}</p>
            </div>
          </DetailSection>
        )}

        {hasAttachments && (
          <DetailSection title="Attachments" icon={<Paperclip className="h-4 w-4" />}>
            <p className="text-sm text-[#B6B8C4]">
              {report.attachments} attachment{report.attachments === 1 ? "" : "s"} submitted with
              this case.
            </p>
          </DetailSection>
        )}

        {isResolved && (
          <DetailSection title="Resolution Notes" icon={<FileText className="h-4 w-4" />}>
            <p className="text-sm text-[#F8F8FA]">
              {report.acknowledgement ||
                "This case has been marked as resolved by the investigating team."}
            </p>
          </DetailSection>
        )}
      </div>
    </motion.div>
  );
});

CaseDetailsPanel.displayName = "CaseDetailsPanel";
