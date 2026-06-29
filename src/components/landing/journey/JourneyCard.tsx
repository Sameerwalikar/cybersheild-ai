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

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];

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
      initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
      animate={active ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: 20, filter: "blur(4px)" }}
      transition={{ duration: 0.5, delay: index * 0.08, ease }}
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
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.3, delay: index * 0.08 + 0.3, ease }}
          >
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[#12121A] border border-[rgba(236,154,163,0.2)] shadow-lg">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#EC9AA3] to-[#F3B3BA] flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[7px] font-bold text-[#050508]">A</span>
              </div>
              <p className="text-[10px] text-[#B6B8C4] leading-relaxed italic">
                &ldquo;{aegisBubble}&rdquo;
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card */}
      <div
        className={`
          relative p-5 rounded-2xl
          bg-[#12121A]/70 backdrop-blur-md
          border transition-all duration-[220ms] ease-out
          ${hovered
            ? "border-[rgba(236,154,163,0.3)] shadow-[0_12px_36px_rgba(236,154,163,0.06)] -translate-y-1"
            : "border-[rgba(236,154,163,0.1)] shadow-[0_4px_16px_rgba(0,0,0,0.15)]"
          }
        `}
      >
        <div className="flex items-center justify-between mb-4">
          <div className={`w-8 h-8 rounded-lg bg-[rgba(236,154,163,0.06)] border border-[rgba(236,154,163,0.12)] flex items-center justify-center transition-all duration-200 ${hovered ? "scale-110 bg-[rgba(236,154,163,0.1)]" : ""}`}>
            {icon}
          </div>
          <span className="text-[10px] font-bold text-[#EC9AA3] uppercase tracking-wider">
            {label}
          </span>
        </div>

        <h4 className="text-sm font-semibold text-[#F8F8FA] mb-2">{title}</h4>
        <p className="text-xs text-[#B6B8C4] leading-relaxed">{description}</p>

        <AnimatePresence>
          {hovered && (
            <motion.div
              className="mt-4 pt-3 border-t border-[rgba(236,154,163,0.08)] space-y-2"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
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

      {stage === 5 && active && (
        <motion.div
          className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 450, damping: 18, delay: index * 0.08 + 0.4 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
          </svg>
        </motion.div>
      )}
    </motion.div>
  );
}
