"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const stages = [
  "Uploading content...",
  "Parsing input...",
  "Running AI analysis...",
  "Checking threat intelligence...",
  "Generating report...",
];

interface LoadingAnalysisProps {
  onComplete: () => void;
}

export function LoadingAnalysis({ onComplete }: LoadingAnalysisProps) {
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    const delays = [600, 800, 1200, 900, 700];
    let timeout: ReturnType<typeof setTimeout>;
    let accumulated = 0;

    delays.forEach((delay, i) => {
      accumulated += delay;
      timeout = setTimeout(() => {
        if (i < stages.length - 1) {
          setCurrentStage(i + 1);
        } else {
          setTimeout(onComplete, 400);
        }
      }, accumulated);
    });

    return () => clearTimeout(timeout);
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-8">
      {/* Animated scanner ring */}
      <div className="relative w-24 h-24">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-[#EC9AA3]/20"
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-2 rounded-full border-2 border-[#EC9AA3]/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          style={{ borderTopColor: "#EC9AA3" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#EC9AA3] to-[#F3B3BA] flex items-center justify-center">
            <span className="text-[10px] font-bold text-[#050508]">AI</span>
          </div>
        </div>
      </div>

      {/* Stage text */}
      <div className="text-center space-y-3">
        <motion.p
          key={currentStage}
          className="text-sm font-medium text-[#F8F8FA]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {stages[currentStage]}
        </motion.p>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5">
          {stages.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                i <= currentStage ? "bg-[#EC9AA3]" : "bg-[#1a1a2e]"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
