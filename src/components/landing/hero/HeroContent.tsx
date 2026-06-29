"use client";

import { motion } from "framer-motion";

// Shared premium easing
const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];

const textReveal = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, delay, ease },
  }),
};

export function HeroContent() {
  return (
    <div className="relative z-10 flex flex-col justify-center h-full px-6 sm:px-10 lg:px-16 max-w-2xl">
      <motion.h1
        className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#F8F8FA] leading-[1.08]"
        variants={textReveal}
        initial="hidden"
        animate="visible"
        custom={0.3}
      >
        Prevent Cybercrime Before It Happens.
      </motion.h1>

      <motion.p
        className="mt-6 text-lg sm:text-xl text-[#B6B8C4] leading-relaxed max-w-xl"
        variants={textReveal}
        initial="hidden"
        animate="visible"
        custom={0.55}
      >
        AI-powered digital public safety platform that protects citizens and
        helps law enforcement uncover organized cybercrime networks through
        intelligent threat analysis.
      </motion.p>

      <motion.div
        className="mt-10 flex flex-wrap gap-4"
        variants={textReveal}
        initial="hidden"
        animate="visible"
        custom={0.8}
      >
        <motion.button
          type="button"
          className="relative px-7 py-3.5 rounded-xl font-semibold text-[#050508] text-sm
                     bg-[#EC9AA3]
                     shadow-[0_2px_8px_rgba(236,154,163,0.2)]
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EC9AA3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050508]
                     transition-all duration-200 ease-out"
          whileHover={{
            y: -2,
            boxShadow: "0 8px 24px rgba(236,154,163,0.3)",
            scale: 1.02,
          }}
          whileTap={{ scale: 0.97, y: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          aria-label="Launch the CyberShield AI Intelligence platform"
        >
          Launch Intelligence
        </motion.button>

        <motion.button
          type="button"
          className="px-7 py-3.5 rounded-xl font-semibold text-[#F8F8FA] text-sm
                     border border-[rgba(236,154,163,0.18)] bg-[#12121A]/70 backdrop-blur-sm
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EC9AA3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050508]
                     transition-all duration-200 ease-out"
          whileHover={{
            y: -2,
            borderColor: "rgba(236,154,163,0.4)",
            color: "#F3B3BA",
            boxShadow: "0 4px 16px rgba(236,154,163,0.08)",
            backgroundColor: "rgba(18,18,26,0.9)",
          }}
          whileTap={{ scale: 0.97, y: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          aria-label="Explore the CyberShield AI platform features"
        >
          Explore Platform
        </motion.button>
      </motion.div>
    </div>
  );
}
