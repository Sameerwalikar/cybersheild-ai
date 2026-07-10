"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { mockQuickActions } from "@/components/dashboard/mocks";
import { dashboardApi, type DashboardOverview, type DashboardHistoryItem, type TimelinePoint, type DashboardInsights, type NotificationsResponse } from "@/services/api/dashboard";

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];

const riskColor: Record<string, string> = {
  safe: "#34d399", low: "#6ee7b7", medium: "#fbbf24", high: "#fb923c", critical: "#f87171",
};
const riskLabel: Record<string, string> = {
  safe: "Safe", low: "Low", medium: "Medium", high: "High", critical: "Critical",
};
const scanTypeIcon: Record<string, string> = {
  message: "💬", url: "🔗", qr: "📷", upi: "💳", voice: "🎙️", image: "🖼️",
};

export default function CitizenDashboard() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [history, setHistory] = useState<DashboardHistoryItem[]>([]);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [notifications, setNotifications] = useState<NotificationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    const h = new Date().getHours();
    if (h >= 12 && h < 17) setGreeting("Good afternoon");
    else if (h >= 17) setGreeting("Good evening");
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const data = await dashboardApi.getAll();
      setOverview(data.overview);
      setHistory(data.history);
      setTimeline(data.timeline);
      setInsights(data.insights);
      setNotifications(data.notifications);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const score = overview?.securityScore ?? 0;
  const scoreColor = score >= 70 ? "#34d399" : score >= 40 ? "#fbbf24" : "#f87171";
  const scoreLabel = score >= 70 ? "Protected" : score >= 40 ? "At Risk" : "Danger";

  return (
    <div className="min-h-screen space-y-8 pb-12">
      {/* ── HERO GREETING + SCORE ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="relative overflow-hidden rounded-2xl border border-[rgba(236,154,163,0.08)] bg-gradient-to-br from-[#0D0D14] via-[#10101a] to-[#0a0a10] p-6 sm:p-8"
      >
        {/* Background glow */}
        <div className="pointer-events-none absolute -top-20 -right-20 w-80 h-80 rounded-full"
          style={{ background: `radial-gradient(circle, ${scoreColor}08 0%, transparent 70%)` }} />
        <div className="pointer-events-none absolute -bottom-10 -left-10 w-60 h-60 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(236,154,163,0.04) 0%, transparent 70%)" }} />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          <div>
            <p className="text-xs font-medium text-[#B6B8C4]/60 uppercase tracking-widest mb-1">{greeting}</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F8F8FA] leading-tight">
              Your Shield is <span style={{ color: scoreColor }}>{scoreLabel}</span>
            </h1>
            <p className="mt-2 text-sm text-[#B6B8C4]">
              {overview ? `${overview.total} total scans · ${overview.critical + overview.high} threats found` : "Loading your security data…"}
            </p>
            <div className="mt-5 flex items-center gap-3">
              <Link href="/scan" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#050508] bg-[#EC9AA3] hover:bg-[#f3b3ba] hover:shadow-[0_4px_20px_rgba(236,154,163,0.3)] active:scale-[0.97] transition-all duration-200">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                New Scan
              </Link>
              <Link href="/reports" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-[#B6B8C4] border border-[rgba(236,154,163,0.12)] hover:border-[rgba(236,154,163,0.3)] hover:text-[#F8F8FA] transition-all duration-200">
                View Reports
              </Link>
            </div>
          </div>

          {/* Premium score ring */}
          {loading ? (
            <div className="w-32 h-32 rounded-full bg-[rgba(236,154,163,0.03)] animate-pulse flex-shrink-0" />
          ) : (
            <ScoreRingPremium score={score} color={scoreColor} label={scoreLabel} />
          )}
        </div>

        {/* Stats strip */}
        <div className="relative z-10 mt-8 grid grid-cols-5 divide-x divide-[rgba(236,154,163,0.06)]">
          {[
            { label: "Total", value: overview?.total ?? 0, color: "#F8F8FA" },
            { label: "Safe", value: (overview?.safe ?? 0) + (overview?.low ?? 0), color: "#34d399" },
            { label: "Medium", value: overview?.medium ?? 0, color: "#fbbf24" },
            { label: "High", value: overview?.high ?? 0, color: "#fb923c" },
            { label: "Critical", value: overview?.critical ?? 0, color: "#f87171" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center py-1 px-2">
              <span className="text-xl font-bold tabular-nums" style={{ color: s.color }}>{loading ? "—" : s.value}</span>
              <span className="text-[9px] text-[#B6B8C4]/60 uppercase mt-0.5">{s.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── QUICK ACTIONS ──────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1, ease }}>
        <SectionLabel>Quick Actions</SectionLabel>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">
          {mockQuickActions.map((action, i) => (
            <motion.div key={action.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 + i * 0.04, ease }}>
              <Link href={action.href}
                className="flex flex-col items-center gap-2.5 py-4 px-2 rounded-2xl border border-[rgba(236,154,163,0.07)] bg-[#0D0D14]/80 hover:border-[rgba(236,154,163,0.22)] hover:bg-[rgba(236,154,163,0.03)] hover:-translate-y-1 active:scale-[0.96] transition-all duration-200 group"
              >
                <div className="w-9 h-9 rounded-xl bg-[rgba(236,154,163,0.07)] group-hover:bg-[rgba(236,154,163,0.12)] flex items-center justify-center transition-colors duration-200">
                  <ActionIcon type={action.icon} />
                </div>
                <p className="text-[10px] font-semibold text-[#B6B8C4] group-hover:text-[#F8F8FA] text-center leading-tight transition-colors duration-200">{action.label}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── MAIN GRID ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent Scans — 2/3 width */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2, ease }} className="lg:col-span-2">
          <GlassCard title="Recent Scans" icon={<AnalysisIcon />} action={<Link href="/threats" className="text-[9px] text-[#EC9AA3]/70 hover:text-[#EC9AA3] transition-colors uppercase tracking-wider">View all →</Link>}>
            {loading ? <SkeletonRows n={5} /> : history.length > 0 ? (
              <div className="space-y-1.5">
                {history.slice(0, 6).map((item, i) => {
                  const color = riskColor[item.riskLevel] || "#B6B8C4";
                  return (
                    <motion.div key={item.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, delay: i * 0.04, ease }}>
                      <Link href="/scan/analysis"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[rgba(236,154,163,0.03)] border border-transparent hover:border-[rgba(236,154,163,0.08)] transition-all duration-150 group"
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                          style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                          {scanTypeIcon[item.scanType] || "🔍"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#F8F8FA] truncate group-hover:text-[#EC9AA3] transition-colors">{item.content || item.scanType}</p>
                          <p className="text-[9px] text-[#B6B8C4]/50 mt-0.5 uppercase tracking-wider">{item.scanType} · {new Date(item.timestamp).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: `${color}18`, color }}>{riskLabel[item.riskLevel] || item.riskLevel}</div>
                          <span className="text-sm font-bold tabular-nums" style={{ color }}>{item.riskScore}</span>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <EmptyState icon="🔍" message="No scans yet" hint="Run your first scan to see results here." cta={{ label: "Scan now", href: "/scan" }} />
            )}
          </GlassCard>
        </motion.div>

        {/* Notifications — 1/3 width */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25, ease }}>
          <GlassCard
            title="Notifications"
            icon={<BellIcon />}
            badge={notifications?.unreadCount ? String(notifications.unreadCount) : undefined}
          >
            {loading ? <SkeletonRows n={4} /> : notifications && notifications.items.length > 0 ? (
              <div className="space-y-1.5 max-h-[272px] overflow-y-auto pr-0.5 scrollbar-thin">
                {notifications.items.map((n, i) => (
                  <motion.div key={n.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className={`flex gap-3 px-3 py-2.5 rounded-xl transition-colors duration-150 ${!n.isRead ? "bg-[rgba(236,154,163,0.04)] border border-[rgba(236,154,163,0.08)]" : "hover:bg-[#12121A]/40"}`}>
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${n.severity === "critical" ? "bg-red-400" : n.severity === "warning" ? "bg-amber-400" : "bg-blue-400"}`} />
                    <div className="min-w-0">
                      <p className={`text-[11px] font-medium truncate ${!n.isRead ? "text-[#F8F8FA]" : "text-[#B6B8C4]"}`}>{n.title}</p>
                      <p className="text-[9px] text-[#B6B8C4]/50 mt-0.5 truncate">{n.message}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState icon="🔔" message="All clear" hint="No new notifications." />
            )}
          </GlassCard>
        </motion.div>
      </div>

      {/* ── BOTTOM ROW ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Activity Chart */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3, ease }}>
          <GlassCard title="7-Day Activity" icon={<TimelineIcon />}>
            {loading ? <div className="h-28 rounded-lg bg-[rgba(236,154,163,0.03)] animate-pulse" /> : timeline.length > 0 ? (
              <ActivityChart timeline={timeline} />
            ) : (
              <EmptyState icon="📊" message="No activity yet" hint="Activity will appear after your first scan." />
            )}
          </GlassCard>
        </motion.div>

        {/* AI Insights */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35, ease }}>
          <GlassCard title="AEGIS Insights" icon={<BrainIcon />}
            badge={insights ? "AI" : undefined}
            action={<Link href="/aegis" className="text-[9px] text-[#EC9AA3]/70 hover:text-[#EC9AA3] transition-colors uppercase tracking-wider">Ask AEGIS →</Link>}
          >
            {loading ? <SkeletonRows n={4} /> : insights ? (
              <div className="space-y-4">
                <p className="text-xs text-[#B6B8C4] leading-relaxed">{insights.summary}</p>
                <div className="space-y-2">
                  {insights.recommendations.map((r, i) => (
                    <div key={i} className="flex items-start gap-2.5 px-3 py-2 rounded-lg bg-[rgba(236,154,163,0.03)] border border-[rgba(236,154,163,0.05)]">
                      <div className="w-1 h-1 rounded-full bg-[#EC9AA3]/60 mt-1.5 flex-shrink-0" />
                      <span className="text-[10px] text-[#B6B8C4] leading-relaxed">{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState icon="🤖" message="No insights yet" hint="Run scans to get AI-powered recommendations." />
            )}
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}

// ── COMPONENTS ──────────────────────────────────────────────────────

function ScoreRingPremium({ score, color, label }: { score: number; color: string; label: string }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative w-36 h-36 flex-shrink-0">
      {/* Outer glow */}
      <div className="absolute inset-0 rounded-full blur-2xl opacity-20" style={{ background: color }} />
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        {/* Track */}
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(236,154,163,0.06)" strokeWidth="7" />
        {/* Glow ring */}
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="11" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ stroke: color, opacity: 0.18, transition: "stroke-dashoffset 1.2s ease-out", filter: `drop-shadow(0 0 8px ${color})` }}
        />
        {/* Main ring */}
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ stroke: color, transition: "stroke-dashoffset 1.2s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span className="text-3xl font-black tabular-nums" style={{ color }}>{score}</span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[#B6B8C4]">{label}</span>
      </div>
    </div>
  );
}

function ActivityChart({ timeline }: { timeline: Array<{ date: string; scans: number; threats: number }> }) {
  const maxScans = Math.max(...timeline.map((t) => t.scans), 1);
  return (
    <div className="space-y-3">
      <div className="flex items-end gap-1.5 h-24">
        {timeline.map((point, i) => {
          const pct = Math.max(8, (point.scans / maxScans) * 100);
          const hasThreat = point.threats > 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div className="w-full rounded-t-md transition-all duration-300 group-hover:opacity-100 opacity-90"
                style={{ height: `${pct}%`, background: hasThreat ? `linear-gradient(to top, #fb923c, #fb923c80)` : `linear-gradient(to top, rgba(236,154,163,0.7), rgba(236,154,163,0.2))` }} />
              {/* Tooltip */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:flex whitespace-nowrap px-2 py-1 rounded bg-[#1a1a24] text-[8px] text-[#F8F8FA] border border-[rgba(236,154,163,0.1)] z-10 flex-col items-center gap-0.5">
                <span>{point.scans} scan{point.scans !== 1 ? "s" : ""}</span>
                {hasThreat && <span className="text-orange-400">{point.threats} threat{point.threats !== 1 ? "s" : ""}</span>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between">
        {timeline.map((point, i) => (
          <span key={i} className="flex-1 text-center text-[8px] text-[#B6B8C4]/40">{point.date.slice(5)}</span>
        ))}
      </div>
      <div className="flex items-center gap-4 pt-1">
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-[rgba(236,154,163,0.6)]" /><span className="text-[9px] text-[#B6B8C4]/60">Scans</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-orange-400/70" /><span className="text-[9px] text-[#B6B8C4]/60">Threats</span></div>
      </div>
    </div>
  );
}

function GlassCard({ title, icon, badge, action, children }: { title: string; icon?: React.ReactNode; badge?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[rgba(236,154,163,0.07)] bg-[#0D0D14]/80 backdrop-blur-sm p-5 hover:border-[rgba(236,154,163,0.13)] transition-colors duration-200 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-[#EC9AA3]/60">{icon}</span>
          <h3 className="text-[10px] font-bold text-[#B6B8C4] uppercase tracking-widest">{title}</h3>
          {badge && (
            <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-[rgba(236,154,163,0.12)] text-[#EC9AA3]">{badge}</span>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold text-[#B6B8C4]/50 uppercase tracking-widest">{children}</p>;
}

function SkeletonRows({ n }: { n: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="h-9 rounded-lg bg-[rgba(236,154,163,0.03)] animate-pulse" style={{ opacity: 1 - i * 0.15 }} />
      ))}
    </div>
  );
}

function EmptyState({ icon, message, hint, cta }: { icon: string; message: string; hint: string; cta?: { label: string; href: string } }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
      <span className="text-3xl opacity-30">{icon}</span>
      <p className="text-sm font-semibold text-[#F8F8FA]/50">{message}</p>
      <p className="text-[10px] text-[#B6B8C4]/40">{hint}</p>
      {cta && (
        <Link href={cta.href} className="mt-2 px-4 py-1.5 rounded-lg text-[10px] font-semibold text-[#050508] bg-[#EC9AA3] hover:bg-[#f3b3ba] transition-colors">
          {cta.label}
        </Link>
      )}
    </div>
  );
}

function ActionIcon({ type }: { type: string }) {
  const props = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "#EC9AA3", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (type === "message") return <svg {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
  if (type === "globe") return <svg {...props}><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
  if (type === "qr") return <svg {...props}><rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/><rect x="2" y="14" width="8" height="8" rx="1"/><path d="M14 14h3v3h-3zM20 14v3h-3M14 20h3M20 20h0"/></svg>;
  if (type === "upi") return <svg {...props}><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
  if (type === "mic") return <svg {...props}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/></svg>;
  return <svg {...props}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>;
}

function AnalysisIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>; }
function BrainIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>; }
function TimelineIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>; }
function BellIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>; }
