"use client";

import { motion } from "framer-motion";

interface MacbookScrollProps {
  visible: boolean;
  scanProgress: number;
  /** 0 = lid closed, 1 = lid fully open */
  lidProgress: number;
  /** 0–1 progress for dashboard widget reveal */
  dashboardProgress: number;
}

export function MacbookScroll({ visible, scanProgress, lidProgress, dashboardProgress }: MacbookScrollProps) {
  // Lid rotates from -90deg (closed) to 0deg (open) around the hinge (bottom edge of lid)
  const lidAngle = -90 + lidProgress * 90;
  const lidOpacity = Math.min(lidProgress * 3, 1); // fade in quickly

  return (
    <motion.div
      className="relative w-full max-w-[560px] mx-auto"
      style={{ perspective: "1200px" }}
      initial={{ opacity: 0, y: 40 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Laptop lid — transforms with perspective */}
      <div
        className="relative rounded-t-xl border border-[rgba(236,154,163,0.12)] border-b-0 bg-[#0D0D12] p-[6px] pb-0"
        style={{
          transformOrigin: "bottom center",
          transform: `rotateX(${lidAngle}deg)`,
          opacity: lidOpacity,
          transition: "none",
        }}
      >
        {/* Camera notch */}
        <div className="absolute top-[3px] left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#1a1a2e] border border-[rgba(236,154,163,0.08)]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#12121A]" />
        </div>

        {/* Screen */}
        <div className="relative rounded-t-lg overflow-hidden bg-[#050508] aspect-[16/10]">
          {/* Dashboard content — progressively revealed */}
          <DashboardScreen progress={dashboardProgress} />

          {/* Scan overlay */}
          {scanProgress > 0 && scanProgress < 1 && (
            <div
              className="absolute left-0 right-0 h-0.5 pointer-events-none z-30"
              style={{ top: `${scanProgress * 100}%` }}
            >
              <div className="h-full bg-gradient-to-r from-transparent via-[#EC9AA3] to-transparent" />
              <div className="h-12 bg-gradient-to-b from-[rgba(236,154,163,0.08)] to-transparent" />
            </div>
          )}
        </div>
      </div>

      {/* Laptop base/hinge */}
      <div className="relative h-3 bg-gradient-to-b from-[#1a1a2e] to-[#12121A] rounded-b-lg border border-t-0 border-[rgba(236,154,163,0.08)]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 rounded-b-sm bg-[#B6B8C4]/10" />
      </div>

      {/* Bottom pad */}
      <div className="relative h-1.5 mx-12 bg-[#0D0D12] rounded-b-xl border-x border-b border-[rgba(236,154,163,0.06)]" />

      {/* Ambient glow under laptop */}
      <div
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[80%] h-8 rounded-full blur-xl"
        style={{
          background: "rgba(236, 154, 163, 0.06)",
          opacity: lidProgress,
        }}
      />
    </motion.div>
  );
}

function DashboardScreen({ progress }: { progress: number }) {
  // Each widget appears at a different progress threshold
  const show = (threshold: number) => progress >= threshold ? 1 : 0;
  const scale = (threshold: number) => progress >= threshold ? 1 : 0.95;

  return (
    <div className="w-full h-full p-3 flex flex-col gap-2 text-[#F8F8FA] overflow-hidden">
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-2 py-1.5 transition-opacity duration-300"
        style={{ opacity: show(0.05) }}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#EC9AA3] to-[#F3B3BA] flex items-center justify-center">
            <span className="text-[8px] font-bold text-[#050508]">CS</span>
          </div>
          <span className="text-[9px] font-semibold text-[#F8F8FA]">CyberShield AI</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[8px] text-[#B6B8C4]">Live</span>
        </div>
      </div>

      {/* Main grid */}
      <div className="flex-1 grid grid-cols-3 gap-1.5">
        {/* Threat Overview */}
        <div
          className="col-span-2 rounded-lg bg-[#12121A] border border-[rgba(236,154,163,0.1)] p-2 transition-all duration-500"
          style={{ opacity: show(0.15), transform: `scale(${scale(0.15)})` }}
        >
          <p className="text-[7px] text-[#B6B8C4] uppercase tracking-wider mb-1.5">Threat Overview</p>
          <div className="flex items-end gap-1 h-[40%]">
            {[65, 40, 80, 55, 90, 45, 70, 85, 50, 75, 60, 95].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm bg-gradient-to-t from-[#EC9AA3]/60 to-[#EC9AA3]/20 transition-all duration-500"
                style={{
                  height: progress >= 0.2 + i * 0.03 ? `${h}%` : "0%",
                  transitionDelay: `${i * 40}ms`,
                }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[7px] text-[#B6B8C4]">Jan</span>
            <span className="text-[7px] text-[#B6B8C4]">Dec</span>
          </div>
        </div>

        {/* Risk Score */}
        <div
          className="rounded-lg bg-[#12121A] border border-[rgba(236,154,163,0.1)] p-2 flex flex-col items-center justify-center transition-all duration-500"
          style={{ opacity: show(0.35), transform: `scale(${scale(0.35)})` }}
        >
          <p className="text-[7px] text-[#B6B8C4] uppercase tracking-wider">Risk Score</p>
          <div className="relative w-10 h-10 my-1">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#1a1a2e" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="14" fill="none" stroke="#EC9AA3" strokeWidth="3"
                strokeDasharray="88"
                strokeDashoffset={88 - (progress >= 0.4 ? 79 : 0)}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s ease-out" }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#EC9AA3]">97</span>
          </div>
          <span className="text-[7px] text-red-400">High</span>
        </div>

        {/* AI Analysis */}
        <div
          className="rounded-lg bg-[#12121A] border border-[rgba(236,154,163,0.1)] p-2 transition-all duration-500"
          style={{ opacity: show(0.5), transform: `scale(${scale(0.5)})` }}
        >
          <p className="text-[7px] text-[#B6B8C4] uppercase tracking-wider mb-1">AI Analysis</p>
          <div className="space-y-1">
            {["NLP", "URL", "Graph"].map((m, i) => (
              <div
                key={m}
                className="flex items-center gap-1 transition-opacity duration-300"
                style={{ opacity: progress >= 0.55 + i * 0.05 ? 1 : 0 }}
              >
                <div className="w-1 h-1 rounded-full bg-emerald-400" />
                <span className="text-[7px] text-[#F8F8FA]">{m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fraud Graph mini */}
        <div
          className="rounded-lg bg-[#12121A] border border-[rgba(236,154,163,0.1)] p-2 relative overflow-hidden transition-all duration-500"
          style={{ opacity: show(0.6), transform: `scale(${scale(0.6)})` }}
        >
          <p className="text-[7px] text-[#B6B8C4] uppercase tracking-wider mb-1">Fraud Graph</p>
          <svg className="w-full h-[70%]" viewBox="0 0 60 40">
            <circle cx="10" cy="20" r="3" fill="#EC9AA3" opacity="0.6" />
            <circle cx="30" cy="10" r="2.5" fill="#EC9AA3" opacity="0.4" />
            <circle cx="50" cy="25" r="3" fill="#EC9AA3" opacity="0.7" />
            <circle cx="25" cy="35" r="2" fill="#F3B3BA" opacity="0.5" />
            <circle cx="45" cy="8" r="2" fill="#F3B3BA" opacity="0.4" />
            <line x1="10" y1="20" x2="30" y2="10" stroke="#EC9AA3" strokeWidth="0.5" opacity="0.3" />
            <line x1="30" y1="10" x2="50" y2="25" stroke="#EC9AA3" strokeWidth="0.5" opacity="0.3" />
            <line x1="10" y1="20" x2="25" y2="35" stroke="#EC9AA3" strokeWidth="0.5" opacity="0.3" />
            <line x1="50" y1="25" x2="45" y2="8" stroke="#EC9AA3" strokeWidth="0.5" opacity="0.3" />
          </svg>
        </div>

        {/* Recent Alerts */}
        <div
          className="rounded-lg bg-[#12121A] border border-[rgba(236,154,163,0.1)] p-2 transition-all duration-500"
          style={{ opacity: show(0.7), transform: `scale(${scale(0.7)})` }}
        >
          <p className="text-[7px] text-[#B6B8C4] uppercase tracking-wider mb-1">Recent Alerts</p>
          <div className="space-y-1">
            {[
              { t: "Phishing", c: "red" },
              { t: "UPI Fraud", c: "amber" },
              { t: "Deepfake", c: "red" },
            ].map((a, i) => (
              <div
                key={a.t}
                className="flex items-center gap-1 transition-opacity duration-300"
                style={{ opacity: progress >= 0.75 + i * 0.05 ? 1 : 0 }}
              >
                <div className={`w-1 h-1 rounded-full ${a.c === "red" ? "bg-red-400" : "bg-amber-400"}`} />
                <span className="text-[7px] text-[#F8F8FA]">{a.t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom status */}
      <div
        className="flex items-center justify-between px-2 py-1 rounded-md bg-[#12121A]/50 transition-opacity duration-500"
        style={{ opacity: show(0.85) }}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#EC9AA3] animate-pulse" />
          <span className="text-[7px] text-[#B6B8C4]">247 citizens protected today</span>
        </div>
        <span className="text-[7px] text-[#EC9AA3] font-medium">AEGIS Active</span>
      </div>
    </div>
  );
}
