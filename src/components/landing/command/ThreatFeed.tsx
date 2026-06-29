"use client";

import { useEffect, useState } from "react";
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
  { id: "t8", type: "Fake Government Site", location: "Delhi", severity: "high", time: "50s ago" },
];

const severityColor = {
  critical: "bg-red-400",
  high: "bg-amber-400",
  medium: "bg-yellow-300",
};

interface ThreatFeedProps {
  active: boolean;
  onActiveCity?: (city: string) => void;
}

export function ThreatFeed({ active, onActiveCity }: ThreatFeedProps) {
  const [visibleThreats, setVisibleThreats] = useState<Threat[]>(threats.slice(0, 4));
  const [cycleIndex, setCycleIndex] = useState(0);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setCycleIndex((prev) => {
        const next = (prev + 1) % threats.length;
        const items: Threat[] = [];
        for (let i = 0; i < 4; i++) {
          items.push(threats[(next + i) % threats.length]);
        }
        setVisibleThreats(items);
        onActiveCity?.(threats[next].location);
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [active, onActiveCity]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
        <span className="text-[10px] font-bold text-[#B6B8C4] uppercase tracking-wider">
          Live Threat Feed
        </span>
      </div>

      <AnimatePresence mode="popLayout">
        {visibleThreats.map((threat) => (
          <motion.div
            key={threat.id + cycleIndex}
            className="px-3 py-2.5 rounded-lg bg-[#12121A]/80 border border-[rgba(236,154,163,0.08)] backdrop-blur-sm"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.3 }}
            layout
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${severityColor[threat.severity]}`} />
                <span className="text-[11px] font-medium text-[#F8F8FA]">{threat.type}</span>
              </div>
              <span className="text-[9px] text-[#B6B8C4]">{threat.time}</span>
            </div>
            <p className="text-[9px] text-[#B6B8C4] mt-0.5 pl-3.5">{threat.location}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
