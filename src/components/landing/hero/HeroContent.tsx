"use client";

import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      delay,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  }),
};

export function HeroContent() {
  return (
    <div className="relative z-10 flex flex-col justify-center h-full px-6 sm:px-10 lg:px-16 max-w-2xl">
      <motion.h1
        className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.08]"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0.4}
      >
        Prevent Cybercrime Before It Happens.
      </motion.h1>

      <motion.p
        className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-xl"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0.7}
      >
        AI-powered digital public safety platform that protects citizens and
        helps law enforcement uncover organized cybercrime networks through
        intelligent threat analysis.
      </motion.p>

      <motion.div
        className="mt-10 flex flex-wrap gap-4"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={1.0}
      >
        <motion.button
          type="button"
          className="relative px-7 py-3.5 rounded-xl font-semibold text-white text-sm
                     bg-indigo-600
                     shadow-[0_4px_14px_rgba(79,70,229,0.25)]
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
                     transition-colors duration-200"
          whileHover={{
            y: -2,
            boxShadow: "0 8px 25px rgba(79,70,229,0.35)",
            scale: 1.02,
          }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          aria-label="Launch the CyberShield AI Intelligence platform"
        >
          Launch Intelligence
        </motion.button>

        <motion.button
          type="button"
          className="px-7 py-3.5 rounded-xl font-semibold text-slate-700 text-sm
                     border border-slate-200 bg-white/70 backdrop-blur-sm
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
                     transition-colors duration-200"
          whileHover={{
            y: -2,
            borderColor: "rgba(79,70,229,0.4)",
            color: "#4338CA",
            boxShadow: "0 4px 12px rgba(79,70,229,0.08)",
          }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          aria-label="Explore the CyberShield AI platform features"
        >
          Explore Platform
        </motion.button>
      </motion.div>
    </div>
  );
}
