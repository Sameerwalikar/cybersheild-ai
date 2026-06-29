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
        className="relative px-7 py-3.5 rounded-xl font-semibold text-[#050508] text-sm
                   bg-[#EC9AA3] shadow-lg shadow-[rgba(236,154,163,0.2)]
                   hover:bg-[#F3B3BA] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[rgba(236,154,163,0.3)]
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EC9AA3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050508]
                   active:scale-[0.98]
                   transition-all duration-200 ease-out"
        aria-label={`${primaryLabel} — Start using the CyberShield AI platform`}
      >
        {primaryLabel}
      </button>

      <button
        type="button"
        onClick={onSecondaryClick}
        className="px-7 py-3.5 rounded-xl font-semibold text-[#F8F8FA] text-sm
                   border border-[rgba(236,154,163,0.18)] bg-[#12121A]/60 backdrop-blur-sm
                   hover:border-[rgba(236,154,163,0.4)] hover:text-[#F3B3BA] hover:-translate-y-0.5 hover:shadow-md hover:shadow-[rgba(236,154,163,0.08)]
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EC9AA3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050508]
                   active:scale-[0.98]
                   transition-all duration-200 ease-out"
        aria-label={`${secondaryLabel} — Learn more about CyberShield AI features`}
      >
        {secondaryLabel}
      </button>
    </motion.div>
  );
}
