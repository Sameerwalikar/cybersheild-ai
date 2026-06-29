"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

interface RiskResultProps {
  visible: boolean;
  reducedMotion: boolean;
}

export function RiskResult({ visible, reducedMotion }: RiskResultProps) {
  const [score, setScore] = useState(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!visible || reducedMotion) {
      if (visible) setScore(97);
      return;
    }

    const target = 97;
    const duration = 1500;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setScore(Math.round(eased * target));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [visible, reducedMotion]);

  return (
    <motion.div
      className="mt-8"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={visible ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="relative rounded-2xl border border-red-500/30 bg-gradient-to-br from-[#12121A] to-[#12121A]/80 p-6 shadow-lg shadow-red-500/10 backdrop-blur-sm">
        {/* Risk badge */}
        <div className="flex items-center gap-2 mb-4">
          <div className="px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30">
            <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider">
              High Risk
            </span>
          </div>
        </div>

        {/* Score */}
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-bold text-red-400 tabular-nums">
            {score}
          </span>
          <span className="text-2xl font-bold text-red-400/60">%</span>
        </div>

        <p className="mt-2 text-sm font-medium text-[#F8F8FA]">
          Likely Phishing Attempt
        </p>

        {/* Progress bar */}
        <div className="mt-4 h-2 rounded-full bg-[#1a1a2e] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-400"
            initial={{ width: "0%" }}
            animate={visible ? { width: "97%" } : { width: "0%" }}
            transition={{ duration: 1.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
          />
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex items-center gap-3">
          <button
            className="px-5 py-2.5 rounded-xl bg-[#EC9AA3] text-[#050508] text-sm font-semibold shadow-md shadow-[rgba(236,154,163,0.2)] hover:bg-[#F3B3BA] hover:shadow-lg hover:shadow-[rgba(236,154,163,0.3)] transition-all"
            aria-label="Report this message as a scam"
          >
            Report Scam
          </button>
          <button
            className="px-5 py-2.5 rounded-xl bg-[#12121A] border border-[rgba(236,154,163,0.18)] text-[#F8F8FA] text-sm font-medium hover:border-[rgba(236,154,163,0.35)] transition-colors"
            aria-label="Learn why this is flagged as a scam"
          >
            Learn Why
          </button>
        </div>
      </div>
    </motion.div>
  );
}
