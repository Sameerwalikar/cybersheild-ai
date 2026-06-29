"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const messages = [
  "New fraud cluster detected.",
  "Cross-state connection established.",
  "High priority cluster discovered in Mumbai.",
  "Investigation confidence increased.",
  "UPI transaction pattern matches known fraud.",
  "New phishing domain linked to existing case.",
  "Three related fraud networks identified.",
];

interface AegisAssistantProps {
  active: boolean;
}

export function AegisAssistant({ active }: AegisAssistantProps) {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
  }, []);

  useEffect(() => {
    if (!active || reducedMotion) return;
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [active, reducedMotion]);

  return (
    <motion.div
      className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#12121A]/80 border border-[rgba(236,154,163,0.12)] backdrop-blur-sm"
      initial={{ opacity: 0, y: 12 }}
      animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      role="status"
      aria-live="polite"
      aria-label="AEGIS intelligence assistant updates"
    >
      {/* AEGIS avatar */}
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#EC9AA3] to-[#F3B3BA] flex items-center justify-center flex-shrink-0 shadow-md shadow-[rgba(236,154,163,0.12)]">
        <span className="text-[10px] font-bold text-[#050508]">A</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-semibold text-[#F8F8FA]">AEGIS</span>
          <div className="w-1 h-1 rounded-full bg-emerald-400" />
          <span className="text-[8px] text-emerald-400">Active</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={currentMessage}
            className="text-xs text-[#B6B8C4] leading-relaxed"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
          >
            {messages[currentMessage]}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
