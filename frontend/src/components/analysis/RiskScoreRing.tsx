"use client";

import { useEffect, useRef, useState } from "react";

interface RiskScoreRingProps {
  score: number;
  level: string;
}

const levelColors: Record<string, { ring: string; text: string; bg: string }> = {
  safe: { ring: "stroke-emerald-400", text: "text-emerald-400", bg: "bg-emerald-400" },
  low: { ring: "stroke-emerald-300", text: "text-emerald-300", bg: "bg-emerald-300" },
  medium: { ring: "stroke-amber-400", text: "text-amber-400", bg: "bg-amber-400" },
  high: { ring: "stroke-orange-400", text: "text-orange-400", bg: "bg-orange-400" },
  critical: { ring: "stroke-red-400", text: "text-red-400", bg: "bg-red-400" },
};

export function RiskScoreRing({ score, level }: RiskScoreRingProps) {
  const colors = levelColors[level] || levelColors.medium;
  const [displayScore, setDisplayScore] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    const duration = 1400;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score]);

  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (displayScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(236,154,163,0.06)" strokeWidth="8" />
          <circle
            cx="60" cy="60" r="54" fill="none"
            className={colors.ring}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.22, 0.03, 0.26, 1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-[#F8F8FA] tabular-nums">{displayScore}</span>
          <span className="text-[10px] text-[#B6B8C4] uppercase tracking-wider mt-0.5">Risk Score</span>
        </div>
      </div>
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${level === "critical" ? "border-red-500/20 bg-red-500/5" : level === "high" ? "border-orange-500/20 bg-orange-500/5" : "border-emerald-500/20 bg-emerald-500/5"}`}>
        <div className={`w-2 h-2 rounded-full ${colors.bg}`} />
        <span className={`text-xs font-semibold capitalize ${colors.text}`}>{level}</span>
      </div>
    </div>
  );
}
