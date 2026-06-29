"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Threat {
  id: string;
  type: string;
  location: string;
  severity: "critical" | "high" | "medium";
  time: string;
}

const threats: Threat[] = [
  { id: "t1", type: "Fake Banking Domain", location: "Mumbai", severity: "critical", time: "2s ago" },
  { id: "t2", type: "UPI Fraud", location: "Delhi", severity: "high", time: "8s ago" },
  { id: "t3", type: "Investment Scam", location: "Bengaluru", severity: "medium", time: "14s ago" },
  { id: "t4", type: "Voice Scam", location: "Hyderabad", severity: "high", time: "21s ago" },
  { id: "t5", type: "Identity Theft", location: "Pune", severity: "critical", time: "28s ago" },
  { id: "t6", type: "Phishing SMS", location: "Chennai", severity: "high", time: "35s ago" },
  { id: "t7", type: "Deepfake Audio", location: "Kolkata", severity: "critical", time: "42s ago" },
  { id: "t8", type: "Fake Government Portal", location: "Lucknow", severity: "high", time: "50s ago" },
  { id: "t9", type: "SIM Swap", location: "Ahmedabad", severity: "critical", time: "57s ago" },
  { id: "t10", type: "Phishing Campaign", location: "Jaipur", severity: "medium", time: "63s ago" },
];

const severityColor: Record<string, string> = {
  critical: "bg-red-400",
  high: "bg-amber-400",
  medium: "bg-yellow-300",
};

interface ThreatFeedProps {
  active: boolean;
  onActiveCity?: (city: string) => void;
}

export function ThreatFeed({ active, onActiveCity }: ThreatFeedProps) {
  const [visibleThreats, setVisibleThreats] = useState<Threat[]>(threats.slice(0, 5));
  const [cycleIndex, setCycleIndex] = useState(0);
  const onActiveCityRef = useRef(onActiveCity);
  onActiveCityRef.current = onActiveCity;

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setCycleIndex((prev) => {
        const next = (prev + 1) % threats.length;
        const items: Threat[] = [];
        for (let i = 0; i < 5; i++) {
          items.push(threats[(next + i) % threats.length]);
        }
        setVisibleThreats(items);
        return next;
      });
    }, 3500);
    return () => clearInterval(interval);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    onActiveCityRef.current?.(threats[cycleIndex].location);
  }, [cycleIndex, active]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
        <span className="text-[10px] font-bold text-[#B6B8C4] uppercase tracking-wider">
          Live Threat Feed
        </span>
      </div>

      <div className="flex-1 overflow-hidden relative space-y-2">
        <AnimatePresence mode="popLayout">
          {visibleThreats.map((threat) => (
            <motion.div
              key={threat.id + cycleIndex}
              className="px-3 py-2.5 rounded-lg bg-[#12121A]/80 border border-[rgba(236,154,163,0.08)]"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3 }}
              layout
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${severityColor[threat.severity]}`} />
                  <span className="text-[11px] font-medium text-[#F8F8FA] truncate">{threat.type}</span>
                </div>
                <span className="text-[9px] text-[#B6B8C4] flex-shrink-0 ml-2">{threat.time}</span>
              </div>
              <p className="text-[9px] text-[#B6B8C4] mt-0.5 pl-3.5">{threat.location}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
