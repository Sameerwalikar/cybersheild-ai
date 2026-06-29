"use client";

import { motion } from "framer-motion";

interface JourneyTimelineProps {
  progress: number; // 0–1
  cardCount: number;
}

export function JourneyTimeline({ progress, cardCount }: JourneyTimelineProps) {
  return (
    <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[2px] pointer-events-none z-0">
      {/* Background line */}
      <div className="absolute inset-0 bg-[rgba(236,154,163,0.08)] rounded-full" />

      {/* Active progress line */}
      <motion.div
        className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-[#EC9AA3] to-[#F3B3BA]"
        style={{ width: `${progress * 100}%` }}
        transition={{ duration: 0.1 }}
      />

      {/* Glow on active line */}
      <motion.div
        className="absolute top-1/2 -translate-y-1/2 h-4 rounded-full blur-sm bg-[rgba(236,154,163,0.2)]"
        style={{ width: `${progress * 100}%`, left: 0 }}
        transition={{ duration: 0.1 }}
      />

      {/* Pulse at the leading edge */}
      {progress > 0 && progress < 1 && (
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#EC9AA3]"
          style={{ left: `${progress * 100}%`, marginLeft: "-6px" }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.8, 0.4, 0.8],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Node dots at each card position */}
      {Array.from({ length: cardCount }).map((_, i) => {
        const position = i / (cardCount - 1);
        const isActive = progress >= position;
        return (
          <div
            key={i}
            className="absolute top-1/2 -translate-y-1/2"
            style={{ left: `${position * 100}%`, marginLeft: "-4px" }}
          >
            <div
              className={`w-2 h-2 rounded-full transition-all duration-500 ${
                isActive
                  ? "bg-[#EC9AA3] shadow-[0_0_8px_rgba(236,154,163,0.4)]"
                  : "bg-[rgba(236,154,163,0.2)]"
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}
