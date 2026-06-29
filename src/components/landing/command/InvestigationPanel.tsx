"use client";

import { motion } from "framer-motion";

interface InvestigationPanelProps {
  active: boolean;
}

const entities = [
  { type: "Phone Numbers", count: 14, status: "connected" },
  { type: "UPI IDs", count: 8, status: "traced" },
  { type: "Domains", count: 6, status: "flagged" },
  { type: "Devices", count: 11, status: "identified" },
  { type: "Complaints", count: 23, status: "linked" },
];

export function InvestigationPanel({ active }: InvestigationPanelProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-[#EC9AA3]" />
        <span className="text-[10px] font-bold text-[#B6B8C4] uppercase tracking-wider">
          Investigation Panel
        </span>
      </div>

      {/* Confidence meter */}
      <div className="px-3 py-2.5 rounded-lg bg-[#12121A]/80 border border-[rgba(236,154,163,0.08)] backdrop-blur-sm">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-[#B6B8C4]">Fraud Confidence</span>
          <span className="text-[10px] font-bold text-[#EC9AA3]">96%</span>
        </div>
        <div className="h-1 rounded-full bg-[#1a1a2e] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#EC9AA3] to-[#F3B3BA]"
            initial={{ width: "0%" }}
            animate={active ? { width: "96%" } : { width: "0%" }}
            transition={{ duration: 1.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.5 }}
          />
        </div>
      </div>

      {/* Connected entities */}
      {entities.map((entity, i) => (
        <motion.div
          key={entity.type}
          className="px-3 py-2 rounded-lg bg-[#12121A]/80 border border-[rgba(236,154,163,0.08)] backdrop-blur-sm flex items-center justify-between"
          initial={{ opacity: 0, y: 8 }}
          animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
        >
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-[#EC9AA3]/60" />
            <span className="text-[11px] text-[#F8F8FA]">{entity.type}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#F8F8FA] tabular-nums">{entity.count}</span>
            <span className="text-[8px] text-emerald-400 uppercase">{entity.status}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
