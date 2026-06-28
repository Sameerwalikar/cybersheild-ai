"use client";

import { motion } from "framer-motion";

interface HeroCTAProps {
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
}

export function HeroCTA({
  primaryLabel = "Launch Intelligence",
  secondaryLabel = "Explore Platform",
  onPrimaryClick,
  onSecondaryClick,
}: HeroCTAProps) {
  return (
    <motion.div
      className="flex flex-wrap gap-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.9, ease: [0.4, 0, 0.2, 1] }}
    >
      <button
        type="button"
        onClick={onPrimaryClick}
        className="relative px-7 py-3.5 rounded-xl font-semibold text-white text-sm
                   bg-indigo-600 shadow-lg shadow-indigo-500/20
                   hover:bg-indigo-700 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/30
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
                   active:scale-[0.98]
                   transition-all duration-200 ease-out"
        aria-label={`${primaryLabel} — Start using the CyberShield AI platform`}
      >
        {primaryLabel}
      </button>

      <button
        type="button"
        onClick={onSecondaryClick}
        className="px-7 py-3.5 rounded-xl font-semibold text-slate-700 text-sm
                   border border-slate-200 bg-white/60 backdrop-blur-sm
                   hover:border-indigo-300 hover:text-indigo-700 hover:-translate-y-0.5 hover:shadow-md
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
                   active:scale-[0.98]
                   transition-all duration-200 ease-out"
        aria-label={`${secondaryLabel} — Learn more about CyberShield AI features`}
      >
        {secondaryLabel}
      </button>
    </motion.div>
  );
}
