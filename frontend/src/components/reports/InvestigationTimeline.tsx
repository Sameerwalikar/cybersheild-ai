"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { MOTION_EASE, TIMELINE_STEPS, getTimelineIndex } from "./constants";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface InvestigationTimelineProps {
  currentStatus: string;
}

export function InvestigationTimeline({ currentStatus }: InvestigationTimelineProps) {
  const reducedMotion = useReducedMotion();
  const currentIdx = getTimelineIndex(currentStatus);
  const isTerminal = currentStatus === "rejected" || currentStatus === "archived";

  if (isTerminal) {
    return (
      <div className="rounded-xl border border-[rgba(236,154,163,0.08)] bg-[rgba(18,18,26,0.55)] px-4 py-3">
        <p className="text-[10px] uppercase tracking-wider font-bold text-[#B6B8C4] mb-1">
          Investigation Timeline
        </p>
        <p className="text-sm text-[#F8F8FA] capitalize">
          This case is marked as {currentStatus.replace(/_/g, " ")} and is no longer active.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[rgba(236,154,163,0.08)] bg-gradient-to-br from-[rgba(18,18,26,0.75)] to-[rgba(13,13,18,0.55)] px-4 py-4 backdrop-blur-sm">
      <p className="text-[10px] uppercase tracking-wider font-bold text-[#B6B8C4] mb-4">
        Investigation Timeline
      </p>
      <ol className="space-y-0" aria-label="Investigation progress">
        {TIMELINE_STEPS.map((step, index) => {
          const isFullyResolved = currentStatus === "resolved";
          const isCompleted =
            isFullyResolved || (currentIdx >= 0 && index < currentIdx);
          const isCurrent = !isFullyResolved && currentIdx === index;
          const isPending = !isCompleted && !isCurrent;

          return (
            <li key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <motion.div
                  initial={reducedMotion ? false : { scale: 0.85, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.35, delay: index * 0.05, ease: MOTION_EASE }}
                  className={`relative flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
                    isCompleted
                      ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-400"
                      : isCurrent
                        ? "border-[rgba(236,154,163,0.55)] bg-[rgba(236,154,163,0.12)] text-[#EC9AA3]"
                        : "border-[rgba(182,184,196,0.15)] bg-[rgba(182,184,196,0.04)] text-[#B6B8C4]/35"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : isCurrent ? (
                    <span className="h-2 w-2 rounded-full bg-[#EC9AA3] shadow-[0_0_12px_rgba(236,154,163,0.75)] pulse-dot" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#B6B8C4]/25" />
                  )}
                  {isCurrent && !reducedMotion && (
                    <span
                      className="absolute inset-0 rounded-full border border-[rgba(236,154,163,0.35)] animate-ping opacity-40"
                      aria-hidden="true"
                    />
                  )}
                </motion.div>
                {index < TIMELINE_STEPS.length - 1 && (
                  <div
                    className={`my-1 w-px flex-1 min-h-[1.25rem] ${
                      isCompleted ? "bg-emerald-500/35" : "bg-[rgba(182,184,196,0.12)]"
                    }`}
                    aria-hidden="true"
                  />
                )}
              </div>
              <div className={`pb-5 ${index === TIMELINE_STEPS.length - 1 ? "pb-0" : ""}`}>
                <p
                  className={`text-sm font-medium ${
                    isCompleted
                      ? "text-[#F8F8FA]"
                      : isCurrent
                        ? "text-[#EC9AA3]"
                        : isPending
                          ? "text-[#B6B8C4]/45"
                          : "text-[#B6B8C4]/45"
                  }`}
                >
                  {step.label}
                </p>
                {isCurrent && (
                  <p className="mt-0.5 text-[11px] text-[#B6B8C4]/70">Current stage</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
