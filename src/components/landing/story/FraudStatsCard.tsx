"use client";

import { useRef, useEffect, useState } from "react";

interface StatItem {
  label: string;
  value: number;
  suffix: string;
}

const stats: StatItem[] = [
  { label: "Connected Nodes", value: 47, suffix: "" },
  { label: "Confidence Score", value: 94, suffix: "%" },
  { label: "Estimated Risk", value: 87, suffix: "/100" },
];

function useCountUp(target: number, duration: number, trigger: boolean) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!trigger) return;
    let start: number | null = null;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    };
    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, trigger]);

  return value;
}

export function FraudStatsCard({ visible }: { visible: boolean }) {
  return (
    <div
      className="w-full max-w-xs rounded-2xl
                 bg-white/70 backdrop-blur-md
                 border border-slate-200/60
                 shadow-[0_8px_30px_rgba(0,0,0,0.04)]
                 p-5 mt-8"
      role="figure"
      aria-label="Detected fraud network statistics"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Detected Fraud Network
        </span>
      </div>

      <div className="space-y-3">
        {stats.map((stat) => (
          <StatRow key={stat.label} stat={stat} visible={visible} />
        ))}
      </div>
    </div>
  );
}

function StatRow({ stat, visible }: { stat: StatItem; visible: boolean }) {
  const value = useCountUp(stat.value, 1200, visible);

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-600">{stat.label}</span>
      <span className="text-sm font-semibold text-slate-900 tabular-nums">
        {value}{stat.suffix}
      </span>
    </div>
  );
}
