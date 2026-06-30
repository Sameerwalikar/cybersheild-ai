"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { WidgetCard, WidgetEmpty } from "@/components/dashboard";
import { QuickActionsWidget } from "@/components/dashboard/widgets";
import { mockQuickActions } from "@/components/dashboard/mocks";
import { dashboardApi, type DashboardOverview, type DashboardHistoryItem, type TimelinePoint, type DashboardInsights, type NotificationsResponse } from "@/services/api/dashboard";

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease } } };

const riskBg: Record<string, string> = { safe: "bg-emerald-400", low: "bg-emerald-300", medium: "bg-amber-400", high: "bg-orange-400", critical: "bg-red-400" };
const riskText: Record<string, string> = { safe: "text-emerald-400", low: "text-emerald-300", medium: "text-amber-400", high: "text-orange-400", critical: "text-red-400" };

export default function CitizenDashboard() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [history, setHistory] = useState<DashboardHistoryItem[]>([]);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [notifications, setNotifications] = useState<NotificationsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [ov, hist, tl, ins, notifs] = await Promise.all([
        dashboardApi.getOverview(),
        dashboardApi.getHistory(),
        dashboardApi.getTimeline(7),
        dashboardApi.getInsights(),
        dashboardApi.getNotifications(),
      ]);
      setOverview(ov);
      setHistory(hist);
      setTimeline(tl);
      setInsights(ins);
      setNotifications(notifs);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
        <h1 className="text-xl font-bold text-[#F8F8FA]">Dashboard</h1>
        <p className="mt-1 text-sm text-[#B6B8C4]">Your live cyber protection overview.</p>
      </motion.div>

      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" variants={stagger} initial="hidden" animate="visible">
        {/* Threat Status */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <WidgetCard title="Threat Status" span={2} icon={<ShieldIcon />} status={overview && overview.avgRiskScore >= 60 ? "danger" : overview && overview.avgRiskScore >= 30 ? "warning" : "success"} loading={loading}>
            {overview && (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <ScoreRing score={overview.securityScore} />
                <div className="flex-1 grid grid-cols-3 sm:grid-cols-5 gap-3 text-center">
                  <Stat label="Total" value={overview.total} />
                  <Stat label="Safe" value={overview.safe + overview.low} color="text-emerald-400" />
                  <Stat label="Medium" value={overview.medium} color="text-amber-400" />
                  <Stat label="High" value={overview.high} color="text-orange-400" />
                  <Stat label="Critical" value={overview.critical} color="text-red-400" />
                </div>
              </div>
            )}
          </WidgetCard>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={fadeUp}>
          <WidgetCard title="Quick Actions" icon={<ZapIcon />}>
            <QuickActionsWidget actions={mockQuickActions} />
          </WidgetCard>
        </motion.div>

        {/* Recent Analysis */}
        <motion.div variants={fadeUp}>
          <WidgetCard title="Recent Analysis" icon={<AnalysisIcon />} loading={loading}>
            {history.length > 0 ? (
              <div className="space-y-2 max-h-[240px] overflow-y-auto">
                {history.slice(0, 6).map((item) => (
                  <Link key={item.id} href="/scan/analysis" className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-[rgba(236,154,163,0.03)] transition-colors group">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-2 h-2 rounded-full ${riskBg[item.riskLevel] || "bg-[#B6B8C4]"}`} />
                      <span className="text-[11px] text-[#F8F8FA] truncate group-hover:text-[#EC9AA3]">{item.content || item.scanType}</span>
                    </div>
                    <span className={`text-xs font-bold tabular-nums ${riskText[item.riskLevel] || "text-[#B6B8C4]"}`}>{item.riskScore}</span>
                  </Link>
                ))}
              </div>
            ) : <WidgetEmpty message="No scans yet. Start scanning to see results here." />}
          </WidgetCard>
        </motion.div>

        {/* AI Insights */}
        <motion.div variants={fadeUp}>
          <WidgetCard title="AI Insights" icon={<BrainIcon />} loading={loading}>
            {insights ? (
              <div className="space-y-3">
                <p className="text-xs text-[#B6B8C4] leading-relaxed">{insights.summary}</p>
                <div className="space-y-1.5">
                  {insights.recommendations.map((r, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-[#EC9AA3]/50 mt-1.5 flex-shrink-0" />
                      <span className="text-[10px] text-[#B6B8C4]">{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <WidgetEmpty message="Perform scans to receive AI-powered insights." />}
          </WidgetCard>
        </motion.div>

        {/* Threat Timeline */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <WidgetCard title="Threat Timeline (7 days)" span={2} icon={<TimelineIcon />} loading={loading}>
            {timeline.length > 0 ? (
              <div className="flex items-end gap-2 h-24">
                {timeline.map((point, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t-sm bg-gradient-to-t from-[#EC9AA3]/60 to-[#EC9AA3]/20" style={{ height: `${Math.max(8, (point.scans / Math.max(...timeline.map((t) => t.scans), 1)) * 100)}%` }} />
                    <span className="text-[8px] text-[#B6B8C4]/50">{point.date.slice(5)}</span>
                  </div>
                ))}
              </div>
            ) : <WidgetEmpty message="Scan activity will appear here over time." />}
          </WidgetCard>
        </motion.div>

        {/* Notifications */}
        <motion.div variants={fadeUp} className="lg:col-span-3">
          <WidgetCard title={`Notifications${notifications && notifications.unreadCount > 0 ? ` (${notifications.unreadCount})` : ""}`} icon={<BellIcon />} loading={loading}>
            {notifications && notifications.items.length > 0 ? (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {notifications.items.map((n) => (
                  <div key={n.id} className={`flex items-start gap-3 px-3 py-2.5 rounded-lg ${n.isRead ? "bg-[#12121A]/30" : "bg-[#12121A]/60 border border-[rgba(236,154,163,0.06)]"}`}>
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${n.severity === "critical" ? "bg-red-400" : n.severity === "warning" ? "bg-amber-400" : "bg-[#B6B8C4]"}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11px] font-medium truncate ${n.isRead ? "text-[#B6B8C4]" : "text-[#F8F8FA]"}`}>{n.title}</p>
                      <p className="text-[10px] text-[#B6B8C4]/60 mt-0.5 truncate">{n.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : <WidgetEmpty message="No notifications yet." />}
          </WidgetCard>
        </motion.div>
      </motion.div>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const circ = 2 * Math.PI * 42;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? "stroke-emerald-400" : score >= 40 ? "stroke-amber-400" : "stroke-red-400";
  return (
    <div className="relative w-24 h-24 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(236,154,163,0.06)" strokeWidth="6" />
        <circle cx="50" cy="50" r="42" fill="none" className={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 1s ease-out" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-[#F8F8FA] tabular-nums">{score}</span>
        <span className="text-[8px] text-[#B6B8C4] uppercase">Security</span>
      </div>
    </div>
  );
}

function Stat({ label, value, color = "text-[#F8F8FA]" }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <p className={`text-lg font-bold tabular-nums ${color}`}>{value}</p>
      <p className="text-[9px] text-[#B6B8C4]">{label}</p>
    </div>
  );
}

function ShieldIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>; }
function ZapIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>; }
function AnalysisIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>; }
function BrainIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>; }
function TimelineIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>; }
function BellIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>; }
