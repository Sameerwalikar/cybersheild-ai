"use client";

import { useEffect, useRef, useState } from "react";
import { type ThreatStatusData } from "../mocks";

interface ThreatStatusWidgetProps {
  data: ThreatStatusData;
}

const levelConfig = {
  protected: { label: "Protected", color: "text-emerald-400", bg: "bg-emerald-400", ring: "stroke-emerald-400" },
  warning: { label: "Warning", color: "text-amber-400", bg: "bg-amber-400", ring: "stroke-amber-400" },
  "high-risk": { label: "High Risk", color: "text-red-400", bg: "bg-red-400", ring: "stroke-red-400" },
};

export function ThreatStatusWidget({ data }: ThreatStatusWidgetProps) {
  const config = levelConfig[data.level];
  const [displayScore, setDisplayScore] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    const duration = 1200;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * data.score));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [data.score]);

  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* Score ring */}
      <div className="relative w-28 h-28 flex-shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(236,154,163,0.08)" strokeWidth="6" />
          <circle
            cx="50" cy="50" r="42" fill="none"
            className={config.ring}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.22, 0.03, 0.26, 1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-[#F8F8FA] tabular-nums">{displayScore}</span>
          <span className="text-[9px] text-[#B6B8C4] uppercase tracking-wider">Score</span>
        </div>
      </div>

      {/* Status info */}
      <div className="flex-1 space-y-3 text-center sm:text-left">
        {/* Level badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#12121A] border border-[rgba(236,154,163,0.08)]">
          <div className={`w-2 h-2 rounded-full ${config.bg}`} />
          <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-lg font-bold text-[#F8F8FA] tabular-nums">{data.scansToday}</p>
            <p className="text-[10px] text-[#B6B8C4]">Scans Today</p>
          </div>
          <div>
            <p className="text-lg font-bold text-[#F8F8FA] tabular-nums">{data.threatsBlocked}</p>
            <p className="text-[10px] text-[#B6B8C4]">Blocked</p>
          </div>
          <div>
            <p className="text-xs font-medium text-[#B6B8C4]">{data.lastScanTime}</p>
            <p className="text-[10px] text-[#B6B8C4]">Last Scan</p>
          </div>
        </div>
      </div>
    </div>
  );
}
