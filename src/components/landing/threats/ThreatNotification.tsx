"use client";

import { motion } from "framer-motion";

interface ThreatNotificationProps {
  title: string;
  message: string;
  visible: boolean;
  protected: boolean;
  index: number;
  entryX: number;
  entryY: number;
}

export function ThreatNotification({
  title,
  message,
  visible,
  protected: isProtected,
  index,
  entryX,
  entryY,
}: ThreatNotificationProps) {
  if (!visible) return null;

  return (
    <motion.div
      className={`
        absolute px-4 py-3 rounded-xl max-w-[220px]
        bg-[#12121A]/80 backdrop-blur-sm
        shadow-[0_4px_20px_rgba(0,0,0,0.3)]
        transition-colors duration-700
        ${isProtected
          ? "border border-[rgba(236,154,163,0.3)]"
          : "border border-red-400/30"
        }
      `}
      initial={{ opacity: 0, x: entryX, y: entryY, scale: 0.85 }}
      animate={{
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
      }}
      transition={{
        duration: 0.6,
        delay: index * 0.12,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      style={{ animationFillMode: "forwards" }}
    >
      <div className="flex items-start gap-2">
        <div
          className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-700 ${
            isProtected ? "bg-[#EC9AA3]" : "bg-red-400 animate-pulse"
          }`}
        />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#F8F8FA] truncate">{title}</p>
          <p className="text-[10px] text-[#B6B8C4] leading-snug mt-0.5 line-clamp-2">{message}</p>
        </div>
      </div>
      {isProtected && (
        <motion.div
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#EC9AA3] flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.2 }}
        >
          <svg width="8" height="8" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2 6.5L4.5 9L10 3" stroke="#050508" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      )}
    </motion.div>
  );
}
