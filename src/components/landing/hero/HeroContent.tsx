"use client";

import Link from "next/link";
import { motion } from "framer-motion";

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
        <motion.div
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.97, y: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <Link
            href="/select-role"
            className="inline-flex px-7 py-3.5 rounded-xl font-semibold text-[#050508] text-sm
                       bg-[#EC9AA3]
                       shadow-[0_2px_8px_rgba(236,154,163,0.2)]
                       hover:shadow-[0_8px_24px_rgba(236,154,163,0.3)]
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EC9AA3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050508]
                       transition-shadow duration-200 ease-out"
          >
            Launch Intelligence
          </Link>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97, y: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <Link
            href="/select-role?role=police"
            className="inline-flex px-7 py-3.5 rounded-xl font-semibold text-[#F8F8FA] text-sm
                       border border-[rgba(236,154,163,0.18)] bg-[#12121A]/70 backdrop-blur-sm
                       hover:border-[rgba(236,154,163,0.4)] hover:text-[#F3B3BA] hover:shadow-[0_4px_16px_rgba(236,154,163,0.08)]
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EC9AA3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050508]
                       transition-all duration-200 ease-out"
          >
            Explore Platform
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
