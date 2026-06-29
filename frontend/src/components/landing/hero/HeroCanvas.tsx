"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const HeroGlobe = dynamic(
  () => import("@/components/three/HeroGlobe").then((m) => m.HeroGlobe),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-48 h-48 rounded-full bg-[#EC9AA3]/5 animate-pulse" />
      </div>
    ),
  }
);

export function HeroCanvas() {
  return (
    <motion.div
      className="relative w-full h-full min-h-[400px]"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 1.2,
        delay: 0.2,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      <HeroGlobe />
    </motion.div>
  );
}
