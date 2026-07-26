"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ListFilter } from "lucide-react";
import { reportsApi, type ReportItem } from "@/services/api/reports";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  CaseCard,
  CaseDetailsPanel,
  CaseFilters,
  CaseFilter,
  filterReports,
  listItemVariants,
  MOTION_EASE,
  PremiumActionButton,
  ReportsEmptyState,
  SearchBar,
} from "@/components/reports";

export default function ReportsPage() {
  const trackSectionRef = useRef<HTMLElement>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [caseFilter, setCaseFilter] = useState<CaseFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, ReportItem>>({});

  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  const loadReports = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }

    try {
      const data = await reportsApi.list({ limit: 100 });
      setReports(data.items);
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : "Failed to load reports");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  useEffect(() => {
    const handleFocus = () => loadReports(true);
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [loadReports]);

  const filteredReports = useMemo(
    () => filterReports(reports, debouncedSearch, caseFilter),
    [reports, debouncedSearch, caseFilter]
  );

  const scrollToTrackSection = useCallback(() => {
    trackSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleToggle = useCallback(
    async (report: ReportItem) => {
      if (expandedId === report.id) {
        setExpandedId(null);
        return;
      }

      setExpandedId(report.id);

      if (detailCache[report.id]) return;

      try {
        const fresh = await reportsApi.getById(report.id);
        setDetailCache((prev) => ({ ...prev, [report.id]: fresh }));
        setReports((prev) => prev.map((item) => (item.id === fresh.id ? fresh : item)));
      } catch {
        // Keep list item data if detail fetch fails.
      }
    },
    [detailCache, expandedId]
  );

  const getReportData = useCallback(
    (report: ReportItem) => detailCache[report.id] ?? report,
    [detailCache]
  );

  return (
    <div className="space-y-8 pb-10">
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: MOTION_EASE }}
        className="space-y-5"
      >
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-[#F8F8FA] sm:text-3xl">Reports</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-[#B6B8C4] sm:text-base">
            Protect yourself by reporting cybercrime and tracking investigation progress.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <PremiumActionButton
            href="/scan/report"
            ariaLabel="Submit a new report"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            }
          >
            Submit Report
          </PremiumActionButton>

          <PremiumActionButton
            variant="secondary"
            onClick={scrollToTrackSection}
            ariaLabel="Scroll to track reports section"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            }
          >
            Track Reports
          </PremiumActionButton>
        </div>
      </motion.header>

      <section
        ref={trackSectionRef}
        id="track-reports"
        aria-labelledby="track-reports-heading"
        className="scroll-mt-6 space-y-5"
      >
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease: MOTION_EASE }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <ListFilter className="h-4 w-4 text-[#EC9AA3]/70" aria-hidden="true" />
            <h2 id="track-reports-heading" className="text-lg font-semibold text-[#F8F8FA]">
              Track Reports
            </h2>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
            <CaseFilters value={caseFilter} onChange={setCaseFilter} />
          </div>
        </motion.div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          >
            {error}
          </div>
        )}

        {loading && (
          <div className="space-y-3" aria-live="polite" aria-busy="true">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-2xl border border-[rgba(236,154,163,0.06)] bg-[rgba(236,154,163,0.03)]"
              />
            ))}
          </div>
        )}

        {!loading && !error && reports.length === 0 && <ReportsEmptyState />}

        {!loading && !error && reports.length > 0 && filteredReports.length === 0 && (
          <div className="rounded-2xl border border-[rgba(236,154,163,0.08)] bg-[rgba(18,18,26,0.45)] px-6 py-12 text-center">
            <h3 className="text-base font-semibold text-[#F8F8FA]">No matching cases</h3>
            <p className="mt-1 text-sm text-[#B6B8C4]">
              Try adjusting your search or filter to find a report.
            </p>
          </div>
        )}

        {!loading && !error && filteredReports.length > 0 && (
          <motion.div
            className="space-y-3"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.04 } },
            }}
          >
            {filteredReports.map((report) => {
              const isExpanded = expandedId === report.id;
              const reportData = getReportData(report);

              return (
                <motion.div key={report.id} variants={listItemVariants} layout="position">
                  <div
                    className={`overflow-hidden rounded-2xl border transition-colors duration-200 ${
                      isExpanded
                        ? "border-[rgba(236,154,163,0.22)] bg-gradient-to-br from-[#0D0D12] to-[#12121A]"
                        : "border-[rgba(236,154,163,0.08)] bg-[rgba(13,13,18,0.82)] hover:border-[rgba(236,154,163,0.18)]"
                    }`}
                  >
                    <CaseCard
                      report={reportData}
                      expanded={isExpanded}
                      onToggle={() => handleToggle(report)}
                    />
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <CaseDetailsPanel key={report.id} report={reportData} />
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {!loading && filteredReports.length > 0 && (
          <p className="text-center text-[11px] text-[#B6B8C4]/45">
            Showing {filteredReports.length} of {reports.length} report
            {reports.length === 1 ? "" : "s"}
          </p>
        )}
      </section>
    </div>
  );
}
