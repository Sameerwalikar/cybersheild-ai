"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface JourneyCardProps {
  stage: number;
  title: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  details: { input: string; decision: string; output: string };
  active: boolean;
  index: number;
  aegisBubble?: string;
}

export function JourneyCard({
  stage,
  title,
  label,
  icon,
  description,
  details,
  active,
  index,
  aegisBubble,
}: JourneyCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      className="relative flex-shrink-0 w-[260px] lg:w-[280px]"
      initial={{ opacity: 0, y: 30 }}
      animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay: index * 0.12, ease: [0.25, 0.1, 0.25, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      tabIndex={0}
      role="article"
      aria-label={`Stage ${stage}: ${title} — ${label}`}
    >
      {/* AEGIS speech bubble */}
      <AnimatePresence>
        {aegisBubble && active && (
          <motion.div
            className="absolute -top-14 left-4 right-4 z-10"
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ duration: 0.4, delay: index * 0.12 + 0.4 }}
          >
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[#12121A] border border-[rgba(236,154,163,0.2)] shadow-lg">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#EC9AA3] to-[#F3B3BA] flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[7px] font-bold text-[#050508]">A</span>
              </div>
              <p className="text-[10px] text-[#B6B8C4] leading-relaxed italic">
                &ldquo;{aegisBubble}&rdquo;
              </p>
            </div>
            <div className="absolute bottom-0 left-6 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[rgba(236,154,163,0.2)]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card */}
      <div
        className={`
          relative p-5 rounded-2xl
          bg-[#12121A]/70 backdrop-blur-md
          border transition-all duration-300
          ${hovered
            ? "border-[rgba(236,154,163,0.35)] shadow-[0_8px_32px_rgba(236,154,163,0.08)]"
            : "border-[rgba(236,154,163,0.12)] shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
          }
        `}
      >
        {/* Stage number */}
        <div className="flex items-center justify-between mb-4">
          <div className="w-8 h-8 rounded-lg bg-[rgba(236,154,163,0.08)] border border-[rgba(236,154,163,0.15)] flex items-center justify-center">
            {icon}
          </div>
          <span className="text-[10px] font-bold text-[#EC9AA3] uppercase tracking-wider">
            {label}
          </span>
        </div>

        {/* Title */}
        <h4 className="text-sm font-semibold text-[#F8F8FA] mb-2">{title}</h4>

        {/* Description */}
        <p className="text-xs text-[#B6B8C4] leading-relaxed">{description}</p>

        {/* Expanded details on hover */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              className="mt-4 pt-3 border-t border-[rgba(236,154,163,0.1)] space-y-2"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex justify-between text-[11px]">
                <span className="text-[#B6B8C4]">Input</span>
                <span className="text-[#F8F8FA] font-medium text-right max-w-[140px]">{details.input}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#B6B8C4]">AI Decision</span>
                <span className="text-[#EC9AA3] font-medium text-right max-w-[140px]">{details.decision}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#B6B8C4]">Output</span>
                <span className="text-emerald-400 font-medium text-right max-w-[140px]">{details.output}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Success state for final card */}
      {stage === 5 && active && (
        <motion.div
          className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 15, delay: index * 0.12 + 0.6 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
          </svg>
        </motion.div>
      )}
    </motion.div>
  );
}
