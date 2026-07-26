"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronRight, FolderClosed } from "lucide-react";
import { policeApi, type PoliceReportItem, type PoliceReportDetail } from "@/services/api/police";
import { isActiveReport, isClosedReport, requiresOfficerAction } from "@/lib/policeReportStatus";

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];

/* ─── Token maps ─────────────────────────────────────────────────────── */
const STATUS_DOT: Record<string, string> = {
  submitted: "bg-blue-400", under_review: "bg-amber-400",
  investigating: "bg-[#EC9AA3]", action_taken: "bg-emerald-400",
  resolved: "bg-emerald-300", rejected: "bg-red-400/60", archived: "bg-[#B6B8C4]/40",
};
const STATUS_TEXT: Record<string, string> = {
  submitted: "text-blue-400", under_review: "text-amber-400",
  investigating: "text-[#EC9AA3]", action_taken: "text-emerald-400",
  resolved: "text-emerald-300", rejected: "text-red-400/60", archived: "text-[#B6B8C4]/40",
};
const PRIORITY_PILL: Record<string, string> = {
  critical: "bg-red-500/15 text-red-400 border border-red-500/25 ring-1 ring-red-500/15",
  high:     "bg-orange-500/15 text-orange-400 border border-orange-500/25",
  medium:   "bg-amber-500/12 text-amber-400 border border-amber-500/20",
  low:      "bg-[#B6B8C4]/8 text-[#B6B8C4] border border-[#B6B8C4]/15",
};
const PRIORITY_ROW: Record<string, string> = {
  critical: "bg-red-500/5 border-red-500/14 hover:border-red-500/22",
  high:     "bg-orange-500/4 border-orange-500/10 hover:border-orange-500/18",
  medium:   "bg-white/[0.012] border-[rgba(236,154,163,0.05)] hover:border-[rgba(236,154,163,0.14)]",
  low:      "bg-white/[0.012] border-[rgba(236,154,163,0.04)] hover:border-[rgba(236,154,163,0.1)]",
};

const PRIORITY_FILTERS = ["all", "CRITICAL", "HIGH", "MEDIUM", "LOW"];
const STATUS_ACTIONS = ["UNDER_REVIEW", "INVESTIGATING", "ACTION_TAKEN", "RESOLVED", "REJECTED"];

type InvestigationScope = "active" | "closed";
type SortOption = "newest" | "oldest" | "priority" | "loss";

const PRIORITY_RANK: Record<string, number> = {
  critical: 4, high: 3, medium: 2, low: 1,
};

function formatLoss(amount: number): string {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(1)} Cr`;
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(1)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

function riskFromPriority(priority: string): number {
  return { critical: 95, high: 82, medium: 58, low: 28 }[priority.toLowerCase()] ?? 50;
}

function rel(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  if (d < 60_000) return "just now";
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`;
  return `${Math.floor(d / 86_400_000)}d ago`;
}

export default function PoliceReportsPage() {
  const [reports, setReports] = useState<PoliceReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<InvestigationScope>("active");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [priFilter, setPriFilter] = useState("all");
  const [detail, setDetail] = useState<PoliceReportDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [ackMsg, setAckMsg] = useState("");
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    setLoading(true);
    policeApi.getReports({ limit: 100 })
      .then(d => setReports(d.items))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const scopedReports = useMemo(
    () => reports.filter(r => scope === "active" ? isActiveReport(r.status) : isClosedReport(r.status)),
    [reports, scope]
  );

  const activeCount = useMemo(() => reports.filter(r => isActiveReport(r.status)).length, [reports]);
  const closedCount = useMemo(() => reports.filter(r => isClosedReport(r.status)).length, [reports]);
  const actionRequiredCount = useMemo(
    () => reports.filter(r => isActiveReport(r.status) && requiresOfficerAction(r.status)).length,
    [reports]
  );

  const categories = useMemo(() => {
    const map = new Map<string, { count: number; totalLoss: number; highPriority: number }>();
    for (const r of scopedReports) {
      const cur = map.get(r.type) ?? { count: 0, totalLoss: 0, highPriority: 0 };
      cur.count += 1;
      cur.totalLoss += r.financialLoss?.amount ?? 0;
      if (r.priority === "high" || r.priority === "critical") cur.highPriority += 1;
      map.set(r.type, cur);
    }
    return [...map.entries()]
      .map(([type, stats]) => ({ type, ...stats }))
      .sort((a, b) => b.count - a.count);
  }, [scopedReports]);

  const workspaceReports = useMemo(() => {
    if (!selectedCategory) return [];
    let items = scopedReports.filter(r => r.type === selectedCategory);
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      items = items.filter(r =>
        [r.reportNumber, r.description, r.citizenName, r.type, r.status]
          .join(" ").toLowerCase().includes(q)
      );
    }
    if (priFilter !== "all") {
      items = items.filter(r => r.priority === priFilter.toLowerCase());
    }
    return [...items].sort((a, b) => {
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "priority") return (PRIORITY_RANK[b.priority] ?? 0) - (PRIORITY_RANK[a.priority] ?? 0);
      if (sortBy === "loss") return (b.financialLoss?.amount ?? 0) - (a.financialLoss?.amount ?? 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [scopedReports, selectedCategory, searchQuery, sortBy, priFilter]);

  const openCategory = useCallback((type: string) => {
    setSelectedCategory(type);
    setSearchQuery("");
    setPriFilter("all");
    setSortBy("newest");
  }, []);

  const backToCategories = useCallback(() => setSelectedCategory(null), []);

  const openDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try { setDetail(await policeApi.getReport(id)); } catch {}
    setDetailLoading(false);
  }, []);

  const closeDetail = useCallback(() => {
    setDetail(null); setAckMsg(""); setNoteText("");
  }, []);

  const handleStatus = async (s: string) => {
    if (!detail) return;
    setActionLoading(true);
    try {
      await policeApi.updateReportStatus(detail.id, s);
      setDetail(d => d ? { ...d, status: s.toLowerCase() } : d);
      setReports(prev => prev.map(r => r.id === detail.id ? { ...r, status: s.toLowerCase() } : r));
    } catch {} finally { setActionLoading(false); }
  };

  const handleAck = async () => {
    if (!detail || !ackMsg.trim()) return;
    setActionLoading(true);
    try {
      await policeApi.acknowledgeReport(detail.id, ackMsg);
      setDetail(d => d ? { ...d, acknowledgement: ackMsg } : d);
      setAckMsg("");
    } catch {} finally { setActionLoading(false); }
  };

  const handleNote = async () => {
    if (!detail || !noteText.trim()) return;
    setActionLoading(true);
    try {
      await policeApi.addReportNote(detail.id, noteText);
      const ts = new Date().toISOString();
      setDetail(d => d ? { ...d, internalNotes: [...d.internalNotes, `[${ts}] ${noteText}`] } : d);
      setNoteText("");
    } catch {} finally { setActionLoading(false); }
  };

  return (
    <div className="space-y-6 pb-8">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }} className="space-y-1">
        <h1 className="text-2xl font-black text-[#F8F8FA] tracking-tight">Investigation Dashboard</h1>
        <p className="text-xs text-[#B6B8C4]/55 font-medium">
          Browse investigations by crime type — status is managed inside each case.
        </p>
      </motion.div>

      {/* Scope entry cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <ScopeCard
          title="Active Investigations"
          count={activeCount}
          subtitle={`${actionRequiredCount} Requires Officer Action`}
          icon="🚨"
          selected={scope === "active"}
          onClick={() => { setScope("active"); setSelectedCategory(null); }}
        />
        <ScopeCard
          title="Closed Investigations"
          count={closedCount}
          subtitle="Successfully Resolved"
          icon="✅"
          selected={scope === "closed"}
          onClick={() => { setScope("closed"); setSelectedCategory(null); }}
        />
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 rounded-2xl bg-[rgba(236,154,163,0.03)]" />
          ))}
        </div>
      ) : !selectedCategory ? (
        <CategoryGrid
          scope={scope}
          categories={categories}
          onSelect={openCategory}
        />
      ) : (
        <WorkspaceView
          category={selectedCategory}
          scope={scope}
          reports={workspaceReports}
          searchQuery={searchQuery}
          sortBy={sortBy}
          priFilter={priFilter}
          onSearchChange={setSearchQuery}
          onSortChange={setSortBy}
          onPriFilterChange={setPriFilter}
          onBack={backToCategories}
          onOpen={openDetail}
        />
      )}

    {/* ───────────────── REPORT INTELLIGENCE HUD ───────────────── */}
<AnimatePresence>
  {(detail || detailLoading) && (
    <motion.div
      className="fixed inset-0 z-50 bg-[#050508]/95 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(236,154,163,0.12), transparent 45%), radial-gradient(circle at 80% 70%, rgba(236,154,163,0.06), transparent 45%)",
        }}
      />

      {/* Scan lines */}
      <div
        className="fixed inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(236,154,163,0.025) 0px, rgba(236,154,163,0.025) 1px, transparent 1px, transparent 4px)",
        }}
      />

      <div className="relative max-w-[1500px] mx-auto p-5 md:p-8 font-mono">

        {/* ───────── TOP BAR ───────── */}
        <div className="flex items-center justify-between mb-4">

          <div>
            <p className="text-[9px] tracking-[0.35em] text-[#EC9AA3]/50">
              CYBERSHIELD // POLICE INTELLIGENCE
            </p>

            <h1 className="text-xl md:text-2xl font-bold tracking-[0.15em] text-[#F8F8FA] mt-1">
              REPORT INTELLIGENCE
            </h1>
          </div>

          <button
            onClick={closeDetail}
            className="
              w-9 h-9
              border border-[rgba(236,154,163,0.25)]
              rounded-md
              flex items-center justify-center
              text-[#EC9AA3]
              hover:bg-[rgba(236,154,163,0.1)]
              transition-colors
            "
          >
            <CloseIcon />
          </button>

        </div>

        {/* Loading */}
        {detailLoading && !detail && (
          <HudPanel className="p-10">
            <div className="space-y-4 animate-pulse">
              <div className="h-5 w-52 bg-[#EC9AA3]/10 rounded" />
              <div className="h-32 bg-[#EC9AA3]/5 rounded" />
              <div className="h-32 bg-[#EC9AA3]/5 rounded" />
            </div>
          </HudPanel>
        )}

        {detail && (
          <div className="space-y-4">

            {/* ═══════════════════════════════════════════
                MAIN CITIZEN PROFILE
            ═══════════════════════════════════════════ */}

            <HudPanel>

              <div className="flex flex-col lg:flex-row gap-6 p-5">

                {/* Citizen portrait */}
                <div
                  className="
                    relative
                    w-full lg:w-44
                    h-52
                    border border-[rgba(236,154,163,0.35)]
                    rounded-md
                    overflow-hidden
                    bg-[#0E0E16]
                    flex-shrink-0
                  "
                >

                  {/* Anonymous person */}
                  <div className="absolute inset-0 flex items-center justify-center">

                    <svg
                      viewBox="0 0 200 240"
                      className="w-[75%] h-[75%] text-[#EC9AA3]/55"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="100" cy="70" r="38" />

                      <path
                        d="
                          M55 190
                          C58 145 75 125 100 125
                          C125 125 142 145 145 190
                        "
                      />

                      <path d="M70 65 Q100 35 130 65" />

                      <line x1="80" y1="72" x2="90" y2="72" />
                      <line x1="110" y1="72" x2="120" y2="72" />

                    </svg>

                  </div>

                  {/* portrait scanlines */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(0deg, rgba(236,154,163,0.08) 0px, rgba(236,154,163,0.08) 1px, transparent 1px, transparent 4px)",
                    }}
                  />

                  {/* corners */}
                  <span className="absolute top-2 left-2 w-4 h-4 border-l border-t border-[#EC9AA3]" />
                  <span className="absolute top-2 right-2 w-4 h-4 border-r border-t border-[#EC9AA3]" />

                  <div
                    className="
                      absolute bottom-0 inset-x-0
                      py-2
                      text-center
                      text-[9px]
                      tracking-[0.35em]
                      text-[#EC9AA3]
                      bg-[#EC9AA3]/5
                      border-t border-[#EC9AA3]/20
                    "
                  >
                    COMPLAINANT
                  </div>

                </div>

                {/* Citizen information */}
                <div className="flex-1 min-w-0">

                  <div className="flex flex-wrap gap-2 items-center">

                    <span className="text-[10px] text-[#EC9AA3]/70 tracking-[0.2em]">
                      {detail.reportNumber}
                    </span>

                    <span
                      className={`text-[8px] font-black uppercase px-2 py-1 rounded-md
                      ${PRIORITY_PILL[detail.priority] ?? PRIORITY_PILL.medium}`}
                    >
                      {detail.priority}
                    </span>

                    <span
                      className={`text-[9px] uppercase font-semibold
                      ${STATUS_TEXT[detail.status] ?? "text-[#B6B8C4]"}`}
                    >
                      {detail.status.replace(/_/g, " ")}
                    </span>

                  </div>

                  <h2
                    className="
                      mt-3
                      text-2xl md:text-3xl
                      text-[#F8F8FA]
                      tracking-[0.1em]
                      uppercase
                    "
                  >
                    {detail.citizenName}
                  </h2>

                  <div className="h-px max-w-lg bg-[#EC9AA3]/30 my-3" />

                  <p className="text-[9px] tracking-[0.3em] text-[#EC9AA3]/60 mb-5">
                    CITIZEN / COMPLAINANT PROFILE
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">

                    <IntelField
                      label="EMAIL"
                      value={detail.citizenEmail}
                    />

                    {detail.citizenPhone && (
                      <IntelField
                        label="PHONE"
                        value={detail.citizenPhone}
                      />
                    )}

                    {detail.citizenLocation && (
                      <IntelField
                        label="LOCATION"
                        value={detail.citizenLocation}
                      />
                    )}

                    <IntelField
                      label="PRIORITY"
                      value={detail.priority.toUpperCase()}
                    />

                  </div>

                </div>

              </div>

              {/* report description */}

              <div className="mx-5 mb-5 border-t border-[#EC9AA3]/15 pt-4">

                <p className="text-[8px] tracking-[0.3em] text-[#EC9AA3]/50 mb-2">
                  CITIZEN STATEMENT
                </p>

                <p className="text-sm text-[#F8F8FA]/85 leading-relaxed max-w-5xl">
                  {detail.description}
                </p>

              </div>

            </HudPanel>


            {/* ═══════════════════════════════════════════
                INTELLIGENCE GRID
            ═══════════════════════════════════════════ */}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

              {/* ───────── SUSPECT ───────── */}

              <HudPanel className="p-5">

                <SectionTitle>
                  REPORTED ENTITY
                </SectionTitle>

                {detail.scammerContact &&
                Object.values(detail.scammerContact).some(Boolean) ? (

                  <div className="flex flex-col sm:flex-row gap-5 mt-4">

                    {/* Unknown suspect portrait */}

                    <div
                      className="
                        relative
                        w-32 h-36
                        border border-red-500/25
                        bg-red-500/[0.025]
                        flex-shrink-0
                        rounded-md
                        overflow-hidden
                      "
                    >

                      <div className="absolute inset-0 flex items-center justify-center">

                        <svg
                          viewBox="0 0 200 240"
                          className="w-[70%] h-[70%] text-red-400/45"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="100" cy="70" r="38" />

                          <path
                            d="
                              M55 190
                              C58 145 75 125 100 125
                              C125 125 142 145 145 190
                            "
                          />

                          <text
                            x="100"
                            y="82"
                            textAnchor="middle"
                            fill="currentColor"
                            stroke="none"
                            fontSize="45"
                          >
                            ?
                          </text>

                        </svg>

                      </div>

                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(0deg, rgba(239,68,68,0.07) 0px, rgba(239,68,68,0.07) 1px, transparent 1px, transparent 4px)",
                        }}
                      />

                      <div
                        className="
                          absolute bottom-0 inset-x-0
                          text-center py-1.5
                          text-[8px]
                          tracking-[0.25em]
                          text-red-400
                          border-t border-red-500/20
                        "
                      >
                        UNKNOWN ENTITY
                      </div>

                    </div>


                    <div className="flex-1 space-y-3">

                      {detail.scammerContact.phone && (
                        <IntelField
                          label="PHONE"
                          value={detail.scammerContact.phone}
                        />
                      )}

                      {detail.scammerContact.email && (
                        <IntelField
                          label="EMAIL"
                          value={detail.scammerContact.email}
                        />
                      )}

                      {detail.scammerContact.upiId && (
                        <IntelField
                          label="UPI ID"
                          value={detail.scammerContact.upiId}
                        />
                      )}

                      {detail.scammerContact.website && (
                        <IntelField
                          label="WEBSITE"
                          value={detail.scammerContact.website}
                        />
                      )}

                    </div>

                  </div>

                ) : (

                  <p className="text-xs text-[#B6B8C4]/40 mt-4">
                    No reported suspect identifiers.
                  </p>

                )}

              </HudPanel>


              {/* ───────── AI ANALYSIS ───────── */}

              <HudPanel className="p-5">

                <SectionTitle>
                  AI ANALYSIS
                </SectionTitle>

                {detail.aiSummary ? (

                  <div className="mt-4">

                    <div
                      className="
                        p-4
                        bg-[#EC9AA3]/[0.035]
                        border border-[#EC9AA3]/10
                        rounded-md
                      "
                    >

                      <p className="text-xs text-[#B6B8C4] leading-relaxed">
                        {detail.aiSummary}
                      </p>

                    </div>

                    {detail.extractedEntities?.length > 0 && (

                      <div className="mt-4">

                        <p className="text-[8px] tracking-[0.25em] text-[#EC9AA3]/50 mb-2">
                          EXTRACTED ENTITIES
                        </p>

                        <div className="flex flex-wrap gap-2">

                          {detail.extractedEntities.map((entity, index) => (

                            <span
                              key={index}
                              className="
                                px-2 py-1
                                text-[9px]
                                text-[#EC9AA3]
                                bg-[#EC9AA3]/5
                                border border-[#EC9AA3]/15
                                rounded
                              "
                            >
                              {entity.type}: {entity.value}
                            </span>

                          ))}

                        </div>

                      </div>

                    )}

                  </div>

                ) : (

                  <p className="text-xs text-[#B6B8C4]/40 mt-4">
                    AI analysis unavailable.
                  </p>

                )}

              </HudPanel>


              {/* ───────── FINANCIAL INTELLIGENCE ───────── */}

              <HudPanel className="p-5">

                <SectionTitle>
                  FINANCIAL INTELLIGENCE
                </SectionTitle>

                <div className="mt-4">

                  {detail.financialLoss?.amount ? (

                    <>
                      <p className="text-[8px] tracking-[0.25em] text-[#B6B8C4]/40">
                        REPORTED FINANCIAL LOSS
                      </p>

                      <p className="text-3xl text-red-400 mt-1 tracking-wider">
                        ₹{detail.financialLoss.amount.toLocaleString("en-IN")}
                      </p>
                    </>

                  ) : (

                    <p className="text-xs text-[#B6B8C4]/40">
                      No financial loss reported.
                    </p>

                  )}

                </div>

              </HudPanel>


              {/* ───────── REPEAT OFFENDER ───────── */}

              <HudPanel className="p-5">

                <SectionTitle>
                  REPEAT OFFENDER INTELLIGENCE
                </SectionTitle>

                {detail.scammerProfile ? (

                  <div className="mt-4 grid grid-cols-2 gap-4">

                    <IntelField
                      label="OCCURRENCES"
                      value={`${detail.scammerProfile.occurrences}×`}
                    />

                    <IntelField
                      label="REPORTS"
                      value={String(detail.scammerProfile.totalReports)}
                    />

                    <IntelField
                      label="THREAT LEVEL"
                      value={detail.scammerProfile.threatLevel.toUpperCase()}
                    />

                    {detail.scammerProfile.phones.length > 0 && (
                      <IntelField
                        label="KNOWN PHONES"
                        value={detail.scammerProfile.phones.join(", ")}
                      />
                    )}

                    {detail.scammerProfile.emails.length > 0 && (
                      <IntelField
                        label="KNOWN EMAILS"
                        value={detail.scammerProfile.emails.join(", ")}
                      />
                    )}

                    {detail.scammerProfile.upiIds.length > 0 && (
                      <IntelField
                        label="KNOWN UPI IDS"
                        value={detail.scammerProfile.upiIds.join(", ")}
                      />
                    )}

                  </div>

                ) : (

                  <p className="text-xs text-[#B6B8C4]/40 mt-4">
                    No repeat-offender profile detected.
                  </p>

                )}

              </HudPanel>

            </div>


            {/* ═══════════════════════════════════════════
                INTERNAL NOTES
            ═══════════════════════════════════════════ */}

            {detail.internalNotes?.length > 0 && (

              <HudPanel className="p-5">

                <SectionTitle>
                  INTERNAL INVESTIGATION NOTES
                </SectionTitle>

                <div className="mt-4 space-y-2">

                  {detail.internalNotes.map((note, index) => (

                    <div
                      key={index}
                      className="
                        px-3 py-2
                        bg-white/[0.015]
                        border-l-2 border-[#EC9AA3]/30
                        text-[10px]
                        text-[#B6B8C4]/75
                        leading-relaxed
                      "
                    >
                      {note}
                    </div>

                  ))}

                </div>

              </HudPanel>

            )}


            {/* ═══════════════════════════════════════════
                ACTION CENTER
            ═══════════════════════════════════════════ */}

            <HudPanel className="p-5">

              <SectionTitle>
                OPERATION CENTER
              </SectionTitle>

              <div className="mt-5 space-y-5">

                {/* Status */}

                <div>

                  <p className="text-[8px] tracking-[0.25em] text-[#B6B8C4]/40 mb-2">
                    UPDATE REPORT STATUS
                  </p>

                  <div className="flex flex-wrap gap-2">

                    {STATUS_ACTIONS.map(status => (

                      <button
                        key={status}
                        onClick={() => handleStatus(status)}
                        disabled={
                          actionLoading ||
                          detail.status === status.toLowerCase()
                        }
                        className={`
                          px-3 py-2
                          rounded-md
                          text-[9px]
                          tracking-wider
                          border
                          transition-all
                          disabled:opacity-30

                          ${
                            detail.status === status.toLowerCase()

                              ? `
                                bg-[#EC9AA3]/15
                                text-[#EC9AA3]
                                border-[#EC9AA3]/30
                              `

                              : `
                                bg-[#12121A]
                                text-[#B6B8C4]
                                border-[#EC9AA3]/10
                                hover:text-[#F8F8FA]
                                hover:border-[#EC9AA3]/30
                              `
                          }
                        `}
                      >
                        {status.replace(/_/g, " ")}
                      </button>

                    ))}

                  </div>

                </div>


                {/* Acknowledgement + Note */}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                  <div>

                    <p className="text-[8px] tracking-[0.25em] text-[#B6B8C4]/40 mb-2">
                      CITIZEN ACKNOWLEDGEMENT
                    </p>

                    {detail.acknowledgement && (

                      <div className="mb-2 text-[10px] text-emerald-400">
                        SENT: {detail.acknowledgement}
                      </div>

                    )}

                    <div className="flex gap-2">

                      <input
                        value={ackMsg}
                        onChange={event =>
                          setAckMsg(event.target.value)
                        }
                        placeholder="Message to citizen..."
                        className="
                          flex-1
                          px-3 py-2.5
                          bg-[#0D0D14]
                          border border-[#EC9AA3]/10
                          rounded-md
                          text-xs
                          text-[#F8F8FA]
                          placeholder:text-[#B6B8C4]/25
                          focus:outline-none
                          focus:border-[#EC9AA3]/40
                        "
                      />

                      <button
                        onClick={handleAck}
                        disabled={
                          actionLoading ||
                          !ackMsg.trim()
                        }
                        className="
                          px-4
                          bg-[#EC9AA3]
                          text-[#050508]
                          text-[10px]
                          font-bold
                          rounded-md
                          disabled:opacity-30
                        "
                      >
                        SEND
                      </button>

                    </div>

                  </div>


                  <div>

                    <p className="text-[8px] tracking-[0.25em] text-[#B6B8C4]/40 mb-2">
                      INTERNAL NOTE
                    </p>

                    <div className="flex gap-2">

                      <input
                        value={noteText}
                        onChange={event =>
                          setNoteText(event.target.value)
                        }
                        placeholder="Add investigation note..."
                        className="
                          flex-1
                          px-3 py-2.5
                          bg-[#0D0D14]
                          border border-[#EC9AA3]/10
                          rounded-md
                          text-xs
                          text-[#F8F8FA]
                          placeholder:text-[#B6B8C4]/25
                          focus:outline-none
                          focus:border-[#EC9AA3]/40
                        "
                      />

                      <button
                        onClick={handleNote}
                        disabled={
                          actionLoading ||
                          !noteText.trim()
                        }
                        className="
                          px-4
                          bg-[#EC9AA3]/10
                          text-[#EC9AA3]
                          border border-[#EC9AA3]/20
                          text-[10px]
                          font-bold
                          rounded-md
                          disabled:opacity-30
                        "
                      >
                        ADD
                      </button>

                    </div>

                  </div>

                </div>

              </div>

            </HudPanel>

          </div>
        )}

      </div>
    </motion.div>
  )}
</AnimatePresence>
  </div>
  );
}
/* ─── Dashboard sub-components ─────────────────────────────────────── */
function ScopeCard({ title, count, subtitle, icon, selected, onClick }: {
  title: string; count: number; subtitle: string; icon: string;
  selected: boolean; onClick: () => void;
}) {
  return (
    <motion.button type="button" onClick={onClick} whileHover={{ y: -2 }} transition={{ duration: 0.2, ease }}
      className={`relative overflow-hidden rounded-2xl border p-6 text-left transition-all duration-200
        ${selected
          ? "border-[rgba(236,154,163,0.28)] bg-gradient-to-br from-[rgba(236,154,163,0.08)] to-[rgba(13,13,18,0.9)] shadow-[0_8px_32px_rgba(236,154,163,0.1)]"
          : "border-[rgba(236,154,163,0.08)] bg-[rgba(13,13,18,0.65)] hover:border-[rgba(236,154,163,0.18)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
        }`}
      aria-pressed={selected}
    >
      <span className="text-2xl">{icon}</span>
      <h2 className="mt-3 text-lg font-bold text-[#F8F8FA]">{title}</h2>
      <p className="mt-1 text-3xl font-black tracking-tight text-[#EC9AA3]">{count}</p>
      <p className="mt-1 text-xs text-[#B6B8C4]/60">{subtitle}</p>
    </motion.button>
  );
}

function CategoryGrid({ scope, categories, onSelect }: {
  scope: InvestigationScope;
  categories: { type: string; count: number; totalLoss: number; highPriority: number }[];
  onSelect: (type: string) => void;
}) {
  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-[rgba(236,154,163,0.12)]">
        <FolderClosed className="h-8 w-8 text-[#B6B8C4]/25 mb-3" />
        <p className="text-sm font-semibold text-[#B6B8C4]/50">
          No {scope === "active" ? "active" : "closed"} investigations
        </p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease }} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {categories.map((cat, i) => (
        <motion.button key={cat.type} type="button" onClick={() => onSelect(cat.type)}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: i * 0.04, ease }}
          className="group relative overflow-hidden rounded-2xl border border-[rgba(236,154,163,0.08)]
            bg-gradient-to-br from-[rgba(18,18,26,0.85)] to-[rgba(8,8,15,0.6)] p-5 text-left
            transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(236,154,163,0.2)]
            hover:shadow-[0_8px_28px_rgba(0,0,0,0.25)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#B6B8C4]/50">Investigation Folder</p>
              <h3 className="mt-1 text-base font-bold text-[#F8F8FA]">{cat.type}</h3>
            </div>
            <span className="text-xl opacity-60">📁</span>
          </div>
          <div className="mt-4 space-y-1">
            <p className="text-sm font-semibold text-[#EC9AA3]">{cat.count} Case{cat.count !== 1 ? "s" : ""}</p>
            {cat.totalLoss > 0 && (
              <p className="text-xs text-[#B6B8C4]/70">{formatLoss(cat.totalLoss)} Total Loss</p>
            )}
            {cat.highPriority > 0 && (
              <p className="text-xs text-orange-400/80">{cat.highPriority} High Priority</p>
            )}
          </div>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#B6B8C4]/60 group-hover:text-[#EC9AA3] transition-colors">
            View Cases <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </motion.button>
      ))}
    </motion.div>
  );
}

function WorkspaceView({ category, scope, reports, searchQuery, sortBy, priFilter,
  onSearchChange, onSortChange, onPriFilterChange, onBack, onOpen }: {
  category: string;
  scope: InvestigationScope;
  reports: PoliceReportItem[];
  searchQuery: string;
  sortBy: SortOption;
  priFilter: string;
  onSearchChange: (v: string) => void;
  onSortChange: (v: SortOption) => void;
  onPriFilterChange: (v: string) => void;
  onBack: () => void;
  onOpen: (id: string) => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease }} className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold
            text-[#B6B8C4] hover:text-[#F8F8FA] hover:bg-[rgba(236,154,163,0.05)] transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Folders
        </button>
        <div>
          <h2 className="text-lg font-bold text-[#F8F8FA]">{category}</h2>
          <p className="text-xs text-[#B6B8C4]/60">
            {reports.length} {scope === "active" ? "Active" : "Closed"} Cases
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <input type="search" value={searchQuery} onChange={e => onSearchChange(e.target.value)}
          placeholder="Search cases..."
          aria-label="Search cases"
          className="flex-1 rounded-xl border border-[rgba(236,154,163,0.1)] bg-[#12121A] px-4 py-2.5
            text-sm text-[#F8F8FA] placeholder:text-[#B6B8C4]/35 focus:outline-none focus:border-[rgba(236,154,163,0.3)]"
        />
        <select value={sortBy} onChange={e => onSortChange(e.target.value as SortOption)}
          aria-label="Sort cases"
          className="rounded-xl border border-[rgba(236,154,163,0.1)] bg-[#12121A] px-3 py-2.5 text-xs
            text-[#B6B8C4] focus:outline-none focus:border-[rgba(236,154,163,0.3)]">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="priority">Highest Priority</option>
          <option value="loss">Highest Loss</option>
        </select>
        <select value={priFilter} onChange={e => onPriFilterChange(e.target.value)}
          aria-label="Filter by priority"
          className="rounded-xl border border-[rgba(236,154,163,0.1)] bg-[#12121A] px-3 py-2.5 text-xs
            text-[#B6B8C4] focus:outline-none focus:border-[rgba(236,154,163,0.3)]">
          {PRIORITY_FILTERS.map(p => (
            <option key={p} value={p}>{p === "all" ? "All Priority" : p}</option>
          ))}
        </select>
      </div>

      {reports.length === 0 ? (
        <div className="py-12 text-center text-sm text-[#B6B8C4]/50">No cases match your search.</div>
      ) : (
        <div className="space-y-2">
          {reports.map((r, i) => (
            <ReportRow key={r.id} report={r} index={i} onOpen={() => onOpen(r.id)} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

const ReportRow = memo(function ReportRow({ report: r, index, onOpen }: {
  report: PoliceReportItem; index: number; onOpen: () => void;
}) {
  const assigned = (r as PoliceReportItem & { assignedTo?: string | null }).assignedTo;
  return (
    <motion.button type="button" onClick={onOpen}
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.02, ease }}
      className={`w-full text-left px-4 py-4 rounded-xl border transition-all duration-150 group
        ${PRIORITY_ROW[r.priority] ?? PRIORITY_ROW.medium}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono text-[#EC9AA3]/80">{r.reportNumber}</span>
            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md ${PRIORITY_PILL[r.priority] ?? PRIORITY_PILL.medium}`}>
              {r.priority}
            </span>
            <span className={`inline-flex items-center gap-1 text-[9px] font-semibold uppercase ${STATUS_TEXT[r.status] ?? "text-[#B6B8C4]"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[r.status] ?? "bg-[#B6B8C4]"}`} />
              {r.status.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-xs text-[#F8F8FA] line-clamp-1">{r.description}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[#B6B8C4]/65">
            <span>Victim: {r.citizenName}</span>
            {r.financialLoss?.amount > 0 && (
              <span>Loss: {formatLoss(r.financialLoss.amount)}</span>
            )}
            <span>Officer: {assigned || "Unassigned"}</span>
            <span>Submitted: {rel(r.createdAt)}</span>
            <span>AI Risk: {riskFromPriority(r.priority)}</span>
          </div>
        </div>
        <span className="shrink-0 text-xs font-semibold text-[#B6B8C4]/50 group-hover:text-[#EC9AA3] transition-colors whitespace-nowrap">
          Open Investigation →
        </span>
      </div>
    </motion.button>
  );
});

/* ─── Drawer sub-components ──────────────────────────────────────────── */
function DS({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[9px] font-bold text-[#B6B8C4]/45 uppercase tracking-[0.1em]">{title}</p>
      <div className="rounded-xl bg-[#12121A]/60 border border-[rgba(236,154,163,0.05)] p-3 space-y-2">
        {children}
      </div>
    </div>
  );
}
function DR({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[10px] text-[#B6B8C4]/55 flex-shrink-0">{label}</span>
      <span className="text-[10px] text-[#F8F8FA] text-right break-all">{value}</span>
    </div>
  );
}
function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function HudPanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`
        relative
        bg-[#0A0A11]/80
        border border-[rgba(236,154,163,0.18)]
        rounded-lg
        shadow-[0_0_25px_rgba(236,154,163,0.04)_inset,0_0_20px_rgba(236,154,163,0.03)]
        ${className}
      `}
    >
      {/* HUD top cuts */}

      <span
        className="
          absolute
          -top-px left-6
          w-8 h-px
          bg-[#050508]
        "
      />

      <span
        className="
          absolute
          -top-px right-6
          w-8 h-px
          bg-[#050508]
        "
      />

      {/* Corner details */}

      <span
        className="
          absolute top-0 left-0
          w-3 h-3
          border-l border-t
          border-[#EC9AA3]/50
          pointer-events-none
        "
      />

      <span
        className="
          absolute bottom-0 right-0
          w-3 h-3
          border-r border-b
          border-[#EC9AA3]/50
          pointer-events-none
        "
      />

      {children}

    </div>
  );
}


function SectionTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">

      <span className="w-1.5 h-1.5 bg-[#EC9AA3] rotate-45" />

      <p
        className="
          text-[9px]
          font-bold
          tracking-[0.3em]
          text-[#EC9AA3]/70
        "
      >
        {children}
      </p>

      <div className="flex-1 h-px bg-[#EC9AA3]/10" />

    </div>
  );
}


function IntelField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">

      <p
        className="
          text-[7px]
          tracking-[0.25em]
          text-[#B6B8C4]/35
          mb-1
        "
      >
        {label}
      </p>

      <p
        className="
          text-[10px]
          text-[#F8F8FA]/85
          break-all
        "
      >
        {value}
      </p>

    </div>
  );
}

