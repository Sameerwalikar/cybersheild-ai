"use client";

import { motion } from "framer-motion";

interface Explanation {
  id: string;
  text: string;
  visible: boolean;
}

interface AegisExplanationProps {
  explanations: Explanation[];
  visible: boolean;
}

export function AegisExplanation({ explanations, visible }: AegisExplanationProps) {
  return (
    <motion.div
      className="mt-6 space-y-2.5"
      initial={{ opacity: 0 }}
      animate={visible ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#EC9AA3] to-[#F3B3BA] flex items-center justify-center shadow-sm">
          <span className="text-[10px] text-[#050508] font-bold">A</span>
        </div>
        <span className="text-xs font-semibold text-[#F8F8FA]">AEGIS Analysis</span>
      </div>

      {explanations.map((exp, i) => (
        <motion.div
          key={exp.id}
          className="flex items-start gap-2.5 pl-1"
          initial={{ opacity: 0, x: -12 }}
          animate={exp.visible ? { opacity: 1, x: 0 } : { opacity: 0, x: -12 }}
          transition={{ duration: 0.4, delay: i * 0.05, ease: "easeOut" }}
        >
          <span className="text-amber-400 text-sm mt-0.5 flex-shrink-0">⚠</span>
          <span className="text-sm text-[#B6B8C4] leading-relaxed">{exp.text}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}
