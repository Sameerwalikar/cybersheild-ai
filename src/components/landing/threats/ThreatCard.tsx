"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface ThreatCardProps {
  title: string;
  example: string;
  riskLevel: string;
  confidence: number;
  recommendation: string;
  index: number;
  protected: boolean;
}

const entryDirections = [
  { x: -40, y: 20 },
  { x: 30, y: -20 },
  { x: -20, y: 30 },
  { x: 40, y: -10 },
  { x: -30, y: -25 },
  { x: 20, y: 35 },
  { x: -35, y: -15 },
  { x: 25, y: 25 },
];

export function ThreatCard({
  title,
  example,
  riskLevel,
  confidence,
  recommendation,
  index,
  protected: isProtected,
}: ThreatCardProps) {
  const [expanded, setExpanded] = useState(false);
  const direction = entryDirections[index % entryDirections.length];

  return (
    <motion.div
      className={`
        relative p-5 rounded-2xl cursor-default
        bg-white/70 backdrop-blur-sm
        shadow-[0_4px_20px_rgba(0,0,0,0.03)]
        transition-colors duration-700 ease-out
        ${isProtected
          ? "border-2 border-indigo-300/60"
          : "border-2 border-rose-200/60"
        }
      `}
      initial={{ opacity: 0, x: direction.x, y: direction.y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-8%" }}
      transition={{
        duration: 0.6,
        delay: 0.15 * index,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      whileHover={{ scale: 1.03, y: -4 }}
      onHoverStart={() => setExpanded(true)}
      onHoverEnd={() => setExpanded(false)}
      onFocus={() => setExpanded(true)}
      onBlur={() => setExpanded(false)}
      tabIndex={0}
      role="article"
      aria-label={`${title}${isProtected ? " — Protected by CyberShield AI" : " — Active threat"}`}
    >
      {/* Status indicator */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-slate-900">{title}</span>
        <div className="flex items-center gap-1.5">
          <div
            className={`w-2 h-2 rounded-full transition-colors duration-700 ${
              isProtected ? "bg-indigo-500" : "bg-rose-500 animate-pulse"
            }`}
          />
          <span
            className={`text-xs font-medium transition-colors duration-700 ${
              isProtected ? "text-indigo-600" : "text-rose-600"
            }`}
          >
            {isProtected ? "Protected" : "Threat"}
          </span>
        </div>
      </div>

      {/* Preview text */}
      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
        {example}
      </p>

      {/* Expanded details */}
      <motion.div
        initial={false}
        animate={{
          height: expanded ? "auto" : 0,
          opacity: expanded ? 1 : 0,
        }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="overflow-hidden"
      >
        <div className="pt-3 mt-3 border-t border-slate-100 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Risk Level</span>
            <span className="font-medium text-slate-700">{riskLevel}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">AI Confidence</span>
            <span className="font-medium text-slate-700">{confidence}%</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Action</span>
            <span className="font-medium text-indigo-600">{recommendation}</span>
          </div>
        </div>
      </motion.div>

      {/* Protected checkmark */}
      {isProtected && (
        <motion.div
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center shadow-md"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.3 }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2 6.5L4.5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      )}
    </motion.div>
  );
}
