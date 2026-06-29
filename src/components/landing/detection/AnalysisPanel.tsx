"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type CardStatus = "idle" | "active" | "completed";

interface AnalysisCard {
  id: string;
  label: string;
  icon: string;
  status: CardStatus;
  hoverDetail: string;
}

interface AnalysisPanelProps {
  cards: AnalysisCard[];
  visible: boolean;
}

export function AnalysisPanel({ cards, visible }: AnalysisPanelProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0, x: 30 }}
      animate={visible ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
      transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-2 h-2 rounded-full bg-[#EC9AA3] animate-pulse" />
        <span className="text-xs font-medium text-[#EC9AA3] uppercase tracking-wider">
          Live Analysis
        </span>
      </div>

      {cards.map((card, i) => (
        <motion.div
          key={card.id}
          className="relative"
          initial={{ opacity: 0, y: 12 }}
          animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: 0.4, delay: i * 0.08, ease: "easeOut" }}
          onMouseEnter={() => setHoveredCard(card.id)}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div
            className={`
              relative px-4 py-3 rounded-xl border backdrop-blur-sm transition-all duration-500 cursor-default
              ${card.status === "idle"
                ? "bg-[#12121A]/40 border-[rgba(236,154,163,0.08)] text-[#B6B8C4]/50"
                : card.status === "active"
                ? "bg-[rgba(236,154,163,0.08)] border-[rgba(236,154,163,0.25)] text-[#EC9AA3] shadow-sm shadow-[rgba(236,154,163,0.1)]"
                : "bg-[#12121A]/60 border-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-500/10"
              }
            `}
          >
            <div className="flex items-center gap-3">
              {/* Status indicator */}
              <div className="flex-shrink-0">
                {card.status === "idle" && (
                  <div className="w-5 h-5 rounded-full border-2 border-[rgba(236,154,163,0.15)]" />
                )}
                {card.status === "active" && (
                  <motion.div
                    className="w-5 h-5 rounded-full border-2 border-[#EC9AA3] border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                )}
                {card.status === "completed" && (
                  <motion.div
                    className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.div>
                )}
              </div>

              {/* Icon */}
              <span className="text-sm">{card.icon}</span>

              {/* Label */}
              <span className={`text-sm font-medium ${card.status === "idle" ? "text-[#B6B8C4]/50" : ""}`}>
                {card.label}
              </span>
            </div>
          </div>

          {/* Hover tooltip */}
          <AnimatePresence>
            {hoveredCard === card.id && card.status !== "idle" && (
              <motion.div
                className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-20"
                initial={{ opacity: 0, x: -8, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -8, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-[#1a1a2e] text-[#F8F8FA] text-xs px-3 py-2 rounded-lg shadow-lg max-w-[200px] whitespace-normal border border-[rgba(236,154,163,0.12)]">
                  {card.hoverDetail}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-[#1a1a2e]" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </motion.div>
  );
}
