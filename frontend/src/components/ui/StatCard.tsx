"use client";
// StatCard — animated KPI tile used in police dashboard stat rows
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

interface StatCardProps {
  label: string;
  value: number;
  color?: string;
  pulse?: boolean;
  /** Icon shown in top-right corner */
  icon?: React.ReactNode;
  delta?: number;         // positive = increase, negative = decrease
  className?: string;
}

function AnimatedNumber({ value }: { value: number }) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 120, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    mv.set(value);
  }, [value, mv]);

  return <motion.span>{display}</motion.span>;
}

export function StatCard({
  label,
  value,
  color = "text-[#F8F8FA]",
  pulse = false,
  icon,
  delta,
  className = "",
}: StatCardProps) {
  return (
    <div
      className={`
        relative px-3.5 py-4 rounded-2xl
        bg-[#0D0D14]/80 border border-[rgba(236,154,163,0.07)]
        hover:border-[rgba(236,154,163,0.16)] hover:bg-[#0D0D14]
        transition-[border-color,background-color] duration-200
        overflow-hidden group
        ${className}
      `}
    >
      {/* Subtle surface gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.015] to-transparent pointer-events-none rounded-2xl" />

      {/* Pulse indicator */}
      {pulse && value > 0 && (
        <span className="absolute top-3 right-3 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
        </span>
      )}

      {/* Icon */}
      {icon && !pulse && (
        <div className="absolute top-3 right-3 text-[#B6B8C4]/25 group-hover:text-[#B6B8C4]/40 transition-colors">
          {icon}
        </div>
      )}

      {/* Value */}
      <p className={`text-2xl font-black tabular-nums leading-none ${color}`}>
        <AnimatedNumber value={value} />
      </p>

      {/* Label */}
      <p className="text-[8px] text-[#B6B8C4]/55 uppercase tracking-[0.1em] mt-2 leading-tight">
        {label}
      </p>

      {/* Delta */}
      {delta !== undefined && delta !== 0 && (
        <p className={`text-[8px] font-semibold mt-1.5 ${delta > 0 ? "text-red-400" : "text-emerald-400"}`}>
          {delta > 0 ? "▲" : "▼"} {Math.abs(delta)}
        </p>
      )}
    </div>
  );
}
