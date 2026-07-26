"use client";

import { FileSearch } from "lucide-react";
import { PremiumActionButton } from "./PremiumActionButton";

export function ReportsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[rgba(236,154,163,0.14)] bg-gradient-to-b from-[rgba(18,18,26,0.45)] to-[rgba(13,13,18,0.25)] px-6 py-16 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-[rgba(236,154,163,0.12)] bg-[rgba(236,154,163,0.05)] text-[#EC9AA3]/50 shadow-[0_8px_32px_rgba(236,154,163,0.08)]">
        <FileSearch className="h-9 w-9" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-[#F8F8FA]">No Reports Yet</h3>
      <p className="mt-2 max-w-sm text-sm text-[#B6B8C4]">
        Submit your first cybercrime report to start tracking investigation progress here.
      </p>
      <div className="mt-6">
        <PremiumActionButton
          href="/scan/report"
          ariaLabel="Submit your first report"
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          }
        >
          Submit Report
        </PremiumActionButton>
      </div>
    </div>
  );
}
