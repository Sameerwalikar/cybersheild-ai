"use client";

import { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { policeApi, type PoliceDashboardData } from "@/services/api/police";

/* ─── Design tokens ──────────────────────────────────────────────────── */
const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];

const RISK_DOT: Record<string, string> = {
  safe: "bg-emerald-400", low: "bg-emerald-300", medium: "bg-amber-400",
  high: "bg-orange-400", critical: "bg-red-400",
};
const RISK_TEXT: Record<string, string> = {
  safe: "text-emerald-400", low: "text-emerald-300", medium: "text-amber-400",
  high: "text-orange-400", critical: "text-red-400",
};
const RISK_BG: Record<string, string> = {
  safe: "bg-emerald-500/10", low: "bg-emerald-500/8", medium: "bg-amber-500/10",
  high: "bg-orange-500/10", critical: "bg-red-500/10",
};
const STATUS_DOT: Record<string, string> = {
  new: "bg-blue-400", submitted: "bg-blue-400", under_review: "bg-amber-400",
  investigating: "bg-[#EC9AA3]", action_taken: "bg-emerald-400",
  resolved: "bg-emerald-300", rejected: "bg-red-400/60",
  active: "bg-emerald-400", monitoring: "bg-amber-400", archived: "bg-[#B6B8C4]/40",
};
const STATUS_TEXT: Record<string, string> = {
  new: "text-blue-400", submitted: "text-blue-400", under_review: "text-amber-400",
  investigating: "text-[#EC9AA3]", action_taken: "text-emerald-400",
  resolved: "text-emerald-300", rejected: "text-red-400/60",
  active: "text-emerald-400", monitoring: "text-amber-400", archived: "text-[#B6B8C4]/40",
};
const PRIORITY_PILL: Record<string, string> = {
  critical: "bg-red-500/15 text-red-400 border border-red-500/25 ring-1 ring-red-500/15",
  high:     "bg-orange-500/15 text-orange-400 border border-orange-500/25",
  medium:   "bg-amber-500/12 text-amber-400 border border-amber-500/20",
  low:      "bg-[#B6B8C4]/8 text-[#B6B8C4] border border-[#B6B8C4]/15",
};

/* ─── Helpers ────────────────────────────────────────────────────────── */
function rel(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  if (d < 60_000) return "just now";
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`;
  return `${Math.floor(d / 86_400_000)}d ago`;
}
function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

/* ─── Main page ──────────────────────────────────────────────────────── */
export default function PoliceDashboard() {
  const [data, setData] = useState<PoliceDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    policeApi.getDashboard()
      .then(setData)
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
    const tick = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(tick);
  }, []);

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center space-y-2">
        <p className="text-sm font-semibold text-red-400">Failed to load dashboard</p>
        <p className="text-xs text-[#B6B8C4]/60">{error}</p>
      </div>
    </div>
  );
  if (loading) return <DashboardSkeleton />;
  if (!data) return null;

  const hasCritical = (data.criticalNotifications?.length ?? 0) > 0;
  const criticalReports = data.recentReports?.filter(r => r.priority === "critical") ?? [];
  const highReports     = data.recentReports?.filter(r => r.priority === "high") ?? [];
  const pendingCount    = data.recentReports?.filter(r =>
    r.status === "submitted" || r.status === "under_review"
  ).length ?? 0;

  return (
    <div className="space-y-5 pb-8" role="main" aria-label="Police Command Center">

      {/* ── COMMAND HEADER ─────────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-[0.15em]">
              Live Intelligence
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#F8F8FA] tracking-tight leading-none">
            Command Center
          </h1>
          <p className="mt-1.5 text-xs text-[#B6B8C4]/55 font-medium">
            {now.toLocaleString("en-IN", {
              weekday: "long", day: "numeric", month: "long",
              hour: "2-digit", minute: "2-digit", hour12: false,
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/police-reports"
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#050508] bg-[#EC9AA3]
              hover:bg-[#f3b3ba] hover:shadow-[0_4px_20px_rgba(236,154,163,0.3)]
              active:scale-[0.97] transition-all duration-150"
          >
            New Report
          </Link>
          <Link href="/investigations"
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#F8F8FA]
              border border-[rgba(236,154,163,0.14)]
              hover:border-[rgba(236,154,163,0.32)] hover:bg-[rgba(236,154,163,0.04)]
              transition-all duration-150"
          >
            + Investigation
          </Link>
        </div>
      </motion.header>

      {/* ── CRITICAL ALERT BANNER ──────────────────────────────────── */}
      <AnimatePresence>
        {hasCritical && (
          <motion.section
            aria-label="Critical alerts"
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl border border-red-500/20 bg-gradient-to-r from-red-500/8 via-red-500/5 to-transparent p-4
              shadow-[0_0_0_1px_rgba(239,68,68,0.04),0_4px_24px_rgba(239,68,68,0.08)]"
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-6 h-6 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriIcon className="w-3.5 h-3.5 text-red-400" />
              </div>
              <span className="text-xs font-black text-red-400 uppercase tracking-wider">
                {data.criticalNotifications.length} Critical Alert{data.criticalNotifications.length > 1 ? "s" : ""} — Immediate Action Required
              </span>
              <span className="ml-auto text-[9px] text-red-400/50 font-mono">PRIORITY 1</span>
            </div>
            <div className="space-y-1.5">
              {data.criticalNotifications.map(n => (
                <div key={n.id}
                  className="flex items-start justify-between gap-4 px-3 py-2.5 rounded-xl
                    bg-red-500/5 border border-red-500/10 hover:border-red-500/20 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-red-300 leading-snug">{n.title}</p>
                    <p className="text-[10px] text-[#B6B8C4] mt-0.5 truncate">{n.message}</p>
                  </div>
                  <span className="text-[9px] text-red-400/50 whitespace-nowrap flex-shrink-0 font-mono">{fmt(n.timestamp)}</span>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── KPI STAT ROW ───────────────────────────────────────────── */}
      <motion.section
        aria-label="Key performance indicators"
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease }}
        className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5"
      >
        <KPITile label="Total Cases"     value={data.stats.totalInvestigations} />
        <KPITile label="Active"          value={data.stats.activeInvestigations}  color="text-emerald-400" pulse />
        <KPITile label="Pending Reports" value={data.stats.pendingReports}
          color={data.stats.pendingReports > 5 ? "text-amber-400" : "text-[#F8F8FA]"}
          urgent={data.stats.pendingReports > 10}
        />
        <KPITile label="Total Reports"   value={data.stats.totalReports} />
        <KPITile label="Fraud Networks"  value={data.stats.totalNetworks} />
        <KPITile label="Evidence Files"  value={data.stats.totalEvidence} />
        <KPITile label="Threats Today"   value={data.stats.threatsToday}
          color={data.stats.threatsToday > 0 ? "text-[#EC9AA3]" : "text-[#F8F8FA]"}
          urgent={data.stats.threatsToday > 20}
        />
      </motion.section>

      {/* ── PRIMARY GRID ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* INVESTIGATION QUEUE — 2/3 */}
        <motion.div className="xl:col-span-2"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease }}
        >
          <InvestigationQueue reports={data.recentReports ?? []} pendingCount={pendingCount} />
        </motion.div>

        {/* REPEAT OFFENDERS — 1/3 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease }}
        >
          <RepeatOffenders scammers={data.repeatScammers ?? []} />
        </motion.div>
      </div>

      {/* ── SECONDARY GRID ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        <motion.div className="xl:col-span-2"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.18, ease }}
        >
          <ActiveInvestigations investigations={data.recentInvestigations ?? []} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease }}
        >
          <HighRiskScans analyses={data.recentAnalyses ?? []} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.22, ease }}
        >
          <RecentIncidents incidents={data.recentIncidents ?? []} />
        </motion.div>
      </div>

      {/* ── BOTTOM ROW ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25, ease }}
        >
          <ThreatCategories categories={data.topThreatCategories ?? []} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.27, ease }}
        >
          <FraudNetworks networks={data.recentNetworks ?? []} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.29, ease }}
        >
          <RegionalBreakdown cities={data.cityBreakdown ?? []} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.31, ease }}
        >
          <ReportPipeline breakdown={data.reportStatsBreakdown ?? {}} />
        </motion.div>
      </div>
    </div>
  );
}

/* ─── KPI Tile ───────────────────────────────────────────────────────── */
function KPITile({
  label, value,
  color = "text-[#F8F8FA]",
  pulse = false,
  urgent = false,
}: {
  label: string; value: number; color?: string; pulse?: boolean; urgent?: boolean;
}) {
  return (
    <div className={`
      relative px-3 py-4 rounded-2xl text-center overflow-hidden
      bg-[#0D0D14]/80 border transition-[border-color] duration-200
      hover:bg-[#0D0D14] group
      ${urgent
        ? "border-amber-500/20 hover:border-amber-500/35"
        : "border-[rgba(236,154,163,0.07)] hover:border-[rgba(236,154,163,0.18)]"
      }
    `}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.012] to-transparent pointer-events-none rounded-2xl" />
      {pulse && value > 0 && (
        <span className="absolute top-2.5 right-2.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
        </span>
      )}
      {urgent && (
        <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
      )}
      <p className={`text-2xl font-black tabular-nums leading-none ${color}`}>{value.toLocaleString()}</p>
      <p className="text-[8px] text-[#B6B8C4]/55 uppercase tracking-[0.1em] mt-2 leading-tight">{label}</p>
    </div>
  );
}

/* ─── Panel wrapper ──────────────────────────────────────────────────── */
function P({
  title, subtitle, action, children, variant = "default",
}: {
  title: string; subtitle?: string; action?: React.ReactNode;
  children: React.ReactNode; variant?: "default" | "critical";
}) {
  const border = variant === "critical"
    ? "border-red-500/18 hover:border-red-500/28 shadow-[0_0_0_1px_rgba(239,68,68,0.04)]"
    : "border-[rgba(236,154,163,0.07)] hover:border-[rgba(236,154,163,0.13)]";
  return (
    <div className={`flex flex-col h-full rounded-2xl bg-[#0D0D14]/85 border p-4 transition-[border-color] duration-200 ${border}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h2 className="text-[10px] font-bold text-[#B6B8C4]/80 uppercase tracking-[0.08em] leading-none">{title}</h2>
          {subtitle && <p className="text-[9px] text-[#B6B8C4]/35 mt-1">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="text-[10px] text-[#EC9AA3]/60 hover:text-[#EC9AA3] transition-colors font-medium">
      {label} →
    </Link>
  );
}

/* ─── Empty state ────────────────────────────────────────────────────── */
function Empty({ icon, message, hint }: { icon?: string; message: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center gap-1">
      {icon && <span className="text-2xl opacity-15 mb-2">{icon}</span>}
      <p className="text-[11px] font-medium text-[#B6B8C4]/35">{message}</p>
      {hint && <p className="text-[9px] text-[#B6B8C4]/20 max-w-[200px] leading-relaxed">{hint}</p>}
    </div>
  );
}

/* ─── Investigation Queue ────────────────────────────────────────────── */
const InvestigationQueue = memo(function InvestigationQueue({
  reports, pendingCount,
}: {
  reports: PoliceDashboardData["recentReports"];
  pendingCount: number;
}) {
  return (
    <P
      title="Investigation Queue"
      subtitle={`${pendingCount} pending · sorted by priority`}
      action={<NavLink href="/police-reports" label="View all" />}
    >
      {reports.length > 0 ? (
        <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-0.5">
          {reports.map((r, i) => {
            const isCrit = r.priority === "critical";
            const isHigh = r.priority === "high";
            return (
              <motion.div key={r.id}
                initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: i * 0.025 }}
                className={`
                  group flex items-start gap-3 px-3.5 py-3 rounded-xl border
                  transition-[border-color,background-color] duration-150 cursor-default
                  ${isCrit ? "bg-red-500/5 border-red-500/14 hover:border-red-500/24"
                    : isHigh ? "bg-orange-500/4 border-orange-500/10 hover:border-orange-500/18"
                    : "bg-white/[0.012] border-[rgba(236,154,163,0.04)] hover:border-[rgba(236,154,163,0.12)]"}
                `}
              >
                <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${RISK_DOT[r.priority] ?? "bg-[#B6B8C4]"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span className="text-[9px] font-mono text-[#EC9AA3]/75 tracking-wide">{r.reportNumber}</span>
                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md ${PRIORITY_PILL[r.priority] ?? PRIORITY_PILL.medium}`}>
                      {r.priority}
                    </span>
                    <span className={`text-[9px] font-semibold uppercase ${STATUS_TEXT[r.status] ?? "text-[#B6B8C4]"}`}>
                      {r.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-[#F8F8FA] truncate leading-snug">{r.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] text-[#B6B8C4]/70">{r.citizenName}</span>
                    <span className="text-[9px] text-[#B6B8C4]/35">·</span>
                    <span className="text-[9px] text-[#B6B8C4]/50 uppercase">{r.type}</span>
                  </div>
                </div>
                <span className="text-[8px] text-[#B6B8C4]/35 whitespace-nowrap flex-shrink-0 mt-0.5 font-mono">
                  {rel(r.createdAt)}
                </span>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Empty icon="📋" message="No reports in queue"
          hint="New citizen reports will appear here automatically." />
      )}
    </P>
  );
});

/* ─── Repeat Offenders ───────────────────────────────────────────────── */
const RepeatOffenders = memo(function RepeatOffenders({
  scammers,
}: { scammers: PoliceDashboardData["repeatScammers"] }) {
  return (
    <P title="Repeat Offenders" subtitle="By occurrence count" action={<NavLink href="/analytics" label="Profiles" />}>
      {scammers.length > 0 ? (
        <div className="space-y-2 max-h-[340px] overflow-y-auto pr-0.5">
          {scammers.map((s) => (
            <div key={s.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                bg-white/[0.012] border border-[rgba(236,154,163,0.04)]
                hover:border-[rgba(236,154,163,0.1)] transition-colors"
            >
              <div className={`
                w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                text-xs font-black ${RISK_BG[s.threatLevel]} ${RISK_TEXT[s.threatLevel]}
              `}>
                {s.occurrences}×
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-[#F8F8FA] font-mono truncate">{s.primaryContact}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[8px] text-[#B6B8C4]/50 uppercase">{s.type}</span>
                  <span className="text-[8px] text-[#B6B8C4]/30">·</span>
                  <span className="text-[8px] text-[#B6B8C4]/50">{s.totalReports} report{s.totalReports !== 1 ? "s" : ""}</span>
                </div>
              </div>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${RISK_DOT[s.threatLevel] ?? "bg-[#B6B8C4]"}`} />
            </div>
          ))}
        </div>
      ) : (
        <Empty icon="🔁" message="No repeat offenders"
          hint="Scammer profiles build automatically from reports." />
      )}
    </P>
  );
});

/* ─── Active Investigations ──────────────────────────────────────────── */
const ActiveInvestigations = memo(function ActiveInvestigations({
  investigations,
}: { investigations: PoliceDashboardData["recentInvestigations"] }) {
  return (
    <P title="Active Investigations" action={<NavLink href="/investigations" label="Workspace" />}>
      {investigations.length > 0 ? (
        <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-0.5">
          {investigations.map((inv) => (
            <div key={inv.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                bg-white/[0.012] border border-[rgba(236,154,163,0.04)]
                hover:border-[rgba(236,154,163,0.1)] transition-colors group"
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[inv.status] ?? "bg-[#B6B8C4]"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono text-[#EC9AA3]/75">{inv.caseId}</span>
                  <span className={`text-[8px] font-semibold capitalize ${STATUS_TEXT[inv.status] ?? "text-[#B6B8C4]"}`}>
                    {inv.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-[11px] text-[#F8F8FA] truncate mt-0.5">{inv.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {inv.city && <span className="text-[8px] text-[#B6B8C4]/50">{inv.city}</span>}
                  {inv.confidence > 0 && (
                    <span className="text-[8px] text-[#B6B8C4]/40">{inv.confidence}% confidence</span>
                  )}
                </div>
              </div>
              <span className="text-[8px] text-[#B6B8C4]/35 flex-shrink-0 font-mono">{rel(inv.updatedAt)}</span>
            </div>
          ))}
        </div>
      ) : (
        <Empty icon="🗂" message="No active investigations"
          hint="Reports and incidents will auto-create investigations." />
      )}
    </P>
  );
});

/* ─── High Risk Scans ────────────────────────────────────────────────── */
const HighRiskScans = memo(function HighRiskScans({
  analyses,
}: { analyses: PoliceDashboardData["recentAnalyses"] }) {
  return (
    <P title="High Risk Scans" action={<NavLink href="/analytics" label="All" />}>
      {analyses.length > 0 ? (
        <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-0.5">
          {analyses.map((a) => (
            <div key={a.id}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl
                bg-white/[0.012] border border-[rgba(236,154,163,0.04)]
                hover:border-[rgba(236,154,163,0.1)] transition-colors"
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${RISK_DOT[a.riskLevel] ?? "bg-[#B6B8C4]"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-[#F8F8FA] truncate leading-snug">{a.summary}</p>
                <span className="text-[8px] text-[#B6B8C4]/50 uppercase">{a.scanType}</span>
              </div>
              <span className={`text-sm font-black tabular-nums flex-shrink-0 ${RISK_TEXT[a.riskLevel] ?? "text-[#F8F8FA]"}`}>
                {a.riskScore}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <Empty icon="🔍" message="No high-risk scans" />
      )}
    </P>
  );
});

/* ─── Recent Incidents ───────────────────────────────────────────────── */
const RecentIncidents = memo(function RecentIncidents({
  incidents,
}: { incidents: PoliceDashboardData["recentIncidents"] }) {
  return (
    <P title="Recent Incidents" action={<NavLink href="/investigations" label="All" />}>
      {incidents.length > 0 ? (
        <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-0.5">
          {incidents.map((inc) => (
            <div key={inc.id}
              className="px-3 py-2.5 rounded-xl bg-white/[0.012]
                border border-[rgba(236,154,163,0.04)] hover:border-[rgba(236,154,163,0.1)] transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[inc.status] ?? "bg-[#B6B8C4]"}`} />
                <span className="text-[9px] font-mono text-[#EC9AA3]/75">{inc.incidentId}</span>
                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md flex-shrink-0 ${PRIORITY_PILL[inc.priority] ?? PRIORITY_PILL.medium}`}>
                  {inc.priority}
                </span>
              </div>
              <p className="text-[10px] text-[#F8F8FA] truncate mt-1">{inc.title}</p>
              <span className="text-[8px] text-[#B6B8C4]/35 font-mono">{rel(inc.updatedAt)}</span>
            </div>
          ))}
        </div>
      ) : (
        <Empty icon="⚡" message="No recent incidents" />
      )}
    </P>
  );
});

/* ─── Threat Categories ──────────────────────────────────────────────── */
const ThreatCategories = memo(function ThreatCategories({
  categories,
}: { categories: PoliceDashboardData["topThreatCategories"] }) {
  const max = Math.max(...categories.map(c => c.count), 1);
  return (
    <P title="Top Threat Types">
      {categories.length > 0 ? (
        <div className="space-y-2.5">
          {categories.map((t) => {
            const pct = Math.round((t.count / max) * 100);
            return (
              <div key={t.type} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#F8F8FA] font-medium uppercase">{t.type}</span>
                  <span className="text-[10px] text-[#EC9AA3] tabular-nums font-bold">{t.count}</span>
                </div>
                <div className="h-1 rounded-full bg-[#0D0D14]">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#EC9AA3] to-[#EC9AA3]/30"
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : <Empty icon="📊" message="No scan data yet" />}
    </P>
  );
});

/* ─── Fraud Networks ─────────────────────────────────────────────────── */
const FraudNetworks = memo(function FraudNetworks({
  networks,
}: { networks: PoliceDashboardData["recentNetworks"] }) {
  return (
    <P title="Fraud Networks" action={<NavLink href="/network" label="Graph" />}>
      {networks.length > 0 ? (
        <div className="space-y-2">
          {networks.map((n) => (
            <div key={n.id}
              className="px-3 py-2.5 rounded-xl bg-white/[0.012]
                border border-[rgba(236,154,163,0.04)] hover:border-[rgba(236,154,163,0.1)] transition-colors"
            >
              <p className="text-[11px] text-[#F8F8FA] font-semibold truncate">{n.name}</p>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-[8px] text-[#B6B8C4]/50 truncate flex-1">
                  {n.cities.slice(0, 2).join(", ")}{n.cities.length > 2 ? ` +${n.cities.length - 2}` : ""}
                </span>
                <span className="text-[9px] text-[#EC9AA3] font-bold flex-shrink-0 ml-2">{n.nodeCount} nodes</span>
              </div>
            </div>
          ))}
        </div>
      ) : <Empty icon="🕸" message="No fraud networks detected" />}
    </P>
  );
});

/* ─── Regional Breakdown ─────────────────────────────────────────────── */
const RegionalBreakdown = memo(function RegionalBreakdown({
  cities,
}: { cities: PoliceDashboardData["cityBreakdown"] }) {
  const max = Math.max(...cities.map(c => c.count), 1);
  return (
    <P title="Threats by Region" action={<NavLink href="/threat-map" label="Map" />}>
      {cities.length > 0 ? (
        <div className="space-y-1.5">
          {cities.slice(0, 8).map((c, i) => {
            const pct = Math.round((c.count / max) * 100);
            return (
              <div key={c.city ?? i} className="flex items-center gap-3">
                <span className="text-[9px] text-[#B6B8C4]/70 w-20 truncate flex-shrink-0">
                  {c.city || "Unknown"}
                </span>
                <div className="flex-1 h-1 rounded-full bg-[#0D0D14]">
                  <div className="h-full rounded-full bg-[rgba(236,154,163,0.38)]"
                    style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[9px] text-[#F8F8FA] tabular-nums font-bold w-6 text-right flex-shrink-0">
                  {c.count}
                </span>
              </div>
            );
          })}
        </div>
      ) : <Empty icon="🗺" message="No regional data" />}
    </P>
  );
});

/* ─── Report Pipeline ────────────────────────────────────────────────── */
const ReportPipeline = memo(function ReportPipeline({
  breakdown,
}: { breakdown: Record<string, number> }) {
  const entries = Object.entries(breakdown);
  return (
    <P title="Report Pipeline">
      {entries.length > 0 ? (
        <div className="space-y-1.5">
          {entries.map(([status, count]) => (
            <div key={status}
              className="flex items-center justify-between px-3 py-2 rounded-xl
                bg-white/[0.012] hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status] ?? "bg-[#B6B8C4]"}`} />
                <span className="text-[10px] text-[#B6B8C4]/80 capitalize">{status.replace(/_/g, " ")}</span>
              </div>
              <span className="text-xs font-bold tabular-nums text-[#F8F8FA]">{count}</span>
            </div>
          ))}
        </div>
      ) : <Empty icon="📈" message="No report data" />}
    </P>
  );
});

/* ─── Icons ──────────────────────────────────────────────────────────── */
function AlertTriIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

/* ─── Skeleton ───────────────────────────────────────────────────────── */
function DashboardSkeleton() {
  return (
    <div className="space-y-5 pb-8 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-2.5 w-32 rounded-full bg-[rgba(236,154,163,0.06)]" />
          <div className="h-7 w-52 rounded-xl bg-[rgba(236,154,163,0.07)]" />
          <div className="h-2.5 w-40 rounded-full bg-[rgba(236,154,163,0.04)]" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 rounded-xl bg-[rgba(236,154,163,0.07)]" />
          <div className="h-10 w-32 rounded-xl bg-[rgba(236,154,163,0.05)]" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2.5">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-[76px] rounded-2xl bg-[rgba(236,154,163,0.04)]" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 h-[400px] rounded-2xl bg-[rgba(236,154,163,0.03)]" />
        <div className="h-[400px] rounded-2xl bg-[rgba(236,154,163,0.03)]" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[280px] rounded-2xl bg-[rgba(236,154,163,0.03)]" />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[200px] rounded-2xl bg-[rgba(236,154,163,0.03)]" />
        ))}
      </div>
    </div>
  );
}
