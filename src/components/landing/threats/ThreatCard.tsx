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
        bg-[#12121A]/70 backdrop-blur-sm
        shadow-[0_4px_20px_rgba(0,0,0,0.2)]
        transition-colors duration-700 ease-out
        ${isProtected
          ? "border-2 border-[rgba(236,154,163,0.3)]"
          : "border-2 border-red-400/30"
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
        <span className="text-sm font-semibold text-[#F8F8FA]">{title}</span>
        <div className="flex items-center gap-1.5">
          <div
            className={`w-2 h-2 rounded-full transition-colors duration-700 ${
              isProtected ? "bg-[#EC9AA3]" : "bg-red-400 animate-pulse"
            }`}
          />
          <span
            className={`text-xs font-medium transition-colors duration-700 ${
              isProtected ? "text-[#EC9AA3]" : "text-red-400"
            }`}
          >
            {isProtected ? "Protected" : "Threat"}
          </span>
        </div>
      </div>

      {/* Preview text */}
      <p className="text-xs text-[#B6B8C4] leading-relaxed line-clamp-2">
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
        <div className="pt-3 mt-3 border-t border-[rgba(236,154,163,0.12)] space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-[#B6B8C4]">Risk Level</span>
            <span className="font-medium text-[#F8F8FA]">{riskLevel}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#B6B8C4]">AI Confidence</span>
            <span className="font-medium text-[#F8F8FA]">{confidence}%</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#B6B8C4]">Action</span>
            <span className="font-medium text-[#EC9AA3]">{recommendation}</span>
          </div>
        </div>
      </motion.div>

      {/* Protected checkmark */}
      {isProtected && (
        <motion.div
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#EC9AA3] flex items-center justify-center shadow-md"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.3 }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2 6.5L4.5 9L10 3" stroke="#050508" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      )}
    </motion.div>
  );
}
