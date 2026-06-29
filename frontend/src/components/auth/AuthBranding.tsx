"use client";

import { motion } from "framer-motion";

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];

export function AuthBranding() {
  return (
    <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
      {/* Logo */}
      <motion.div
        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#EC9AA3] to-[#F3B3BA] flex items-center justify-center shadow-xl shadow-[rgba(236,154,163,0.15)] mb-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease }}
      >
        <span className="text-xl font-bold text-[#050508]">CS</span>
      </motion.div>

      {/* Headline */}
      <motion.h1
        className="text-2xl lg:text-3xl font-bold text-[#F8F8FA] leading-tight"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease }}
      >
        Protecting India&apos;s<br />Digital Future.
      </motion.h1>

      {/* Mission statement */}
      <motion.p
        className="mt-4 text-sm text-[#B6B8C4] leading-relaxed max-w-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease }}
      >
        AI-powered cyber protection for citizens, law enforcement, and organizations across India.
      </motion.p>

      {/* AEGIS avatar */}
      <motion.div
        className="mt-8 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#12121A]/60 border border-[rgba(236,154,163,0.08)]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35, ease }}
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#EC9AA3] to-[#F3B3BA] flex items-center justify-center">
          <span className="text-[9px] font-bold text-[#050508]">A</span>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-[#F8F8FA]">AEGIS</p>
          <p className="text-[9px] text-[#B6B8C4] italic">Securing your digital identity.</p>
        </div>
      </motion.div>
    </div>
  );
}
