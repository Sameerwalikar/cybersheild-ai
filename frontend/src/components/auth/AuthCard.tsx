"use client";

import { motion } from "framer-motion";

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthCard({ children, className = "" }: AuthCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ scale: 1.01, y: -2 }}
      transition={{ 
        type: "spring", 
        stiffness: 100, 
        damping: 15,
        y: {
          type: "tween",
          ease: "easeInOut",
          duration: 0.3
        }
      }}
      className={`w-full rounded-2xl bg-[#0D0D12]/70 backdrop-blur-lg border border-[rgba(236,154,163,0.12)] p-8 shadow-[0_24px_64px_rgba(0,0,0,0.7)] transition-all duration-300 hover:border-[rgba(236,154,163,0.25)] hover:shadow-[0_24px_64px_rgba(236,154,163,0.03)] ${className}`}
    >
      {children}
    </motion.div>
  );
}
