"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  WidgetCard,
  WidgetEmpty,
  ThreatStatusWidget,
  QuickActionsWidget,
  NotificationsWidget,
  TimelineWidget,
  RecentAnalysisWidget,
  RecentReportsWidget,
  SecurityTipsWidget,
  mockQuickActions,
  getLatestRiskScore,
  getThreatLevel,
  getScansToday,
  getThreatsBlocked,
  getLastScanTime,
  getRecentScans,
  getRecentReports,
  getTimelineEvents,
  generateNotifications,
  getSecurityTips,
} from "@/components/dashboard";

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease } } };

export default function CitizenDashboard() {
  const threatStatus = useMemo(() => ({
    score: getLatestRiskScore(),
    level: getThreatLevel(),
    lastScanTime: getLastScanTime(),
    scansToday: getScansToday(),
    threatsBlocked: getThreatsBlocked(),
  }), []);

  const recentScans = useMemo(() => getRecentScans(5), []);
  const recentReports = useMemo(() => getRecentReports(3), []);
  const timeline = useMemo(() => getTimelineEvents(), []);
  const notifications = useMemo(() => generateNotifications(), []);
  const tips = useMemo(() => getSecurityTips(), []);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
        <h1 className="text-xl font-bold text-[#F8F8FA]">Dashboard</h1>
        <p className="mt-1 text-sm text-[#B6B8C4]">Your protection overview at a glance.</p>
      </motion.div>

      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" variants={stagger} initial="hidden" animate="visible">
        {/* Threat Status — span 2 */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <WidgetCard title="Threat Status" span={2} icon={<ShieldIcon />} status={threatStatus.level === "protected" ? "success" : threatStatus.level === "warning" ? "warning" : "danger"}>
            <ThreatStatusWidget data={threatStatus} />
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
          <WidgetCard title="Recent Analysis" icon={<AnalysisIcon />}>
            {recentScans.length > 0 ? <RecentAnalysisWidget items={recentScans} /> : <WidgetEmpty message="No analysis history." />}
          </WidgetCard>
        </motion.div>

        {/* Recent Reports */}
        <motion.div variants={fadeUp}>
          <WidgetCard title="Recent Reports" icon={<FileIcon />}>
            {recentReports.length > 0 ? <RecentReportsWidget reports={recentReports} /> : <WidgetEmpty message="No recent reports." />}
          </WidgetCard>
        </motion.div>

        {/* Threat Timeline — span 2 */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <WidgetCard title="Threat Timeline" span={2} icon={<TimelineIcon />}>
            {timeline.length > 0 ? <TimelineWidget events={timeline} /> : <WidgetEmpty message="No activity yet. Start scanning to build your timeline." />}
          </WidgetCard>
        </motion.div>

        {/* Security Tips */}
        <motion.div variants={fadeUp}>
          <WidgetCard title="Security Tips" icon={<LightbulbIcon />}>
            <SecurityTipsWidget tips={tips} />
          </WidgetCard>
        </motion.div>

        {/* AEGIS Assistant */}
        <motion.div variants={fadeUp}>
          <WidgetCard title="AEGIS Assistant" icon={<BotIcon />}>
            <WidgetEmpty message="AEGIS is ready to help. Ask a question." icon={<BotLargeIcon />} />
          </WidgetCard>
        </motion.div>

        {/* Notifications — full width */}
        <motion.div variants={fadeUp} className="lg:col-span-3">
          <WidgetCard title="Notifications" icon={<BellIcon />}>
            <NotificationsWidget notifications={notifications} />
          </WidgetCard>
        </motion.div>
      </motion.div>
    </div>
  );
}

function ShieldIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>; }
function ZapIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>; }
function FileIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>; }
function AnalysisIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>; }
function TimelineIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>; }
function LightbulbIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg>; }
function BotIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/></svg>; }
function BotLargeIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4M8 16h0M16 16h0"/></svg>; }
function BellIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>; }
