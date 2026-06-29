"use client";

import { useRef, useEffect, useState } from "react";

interface PipelineVisualizationProps {
  activeStage: number | null;
  reducedMotion: boolean;
}

const stages = [
  { id: "sms", label: "SMS" },
  { id: "nlp", label: "NLP Analysis" },
  { id: "threat", label: "Threat Intelligence" },
  { id: "graph", label: "Fraud Graph" },
  { id: "risk", label: "Risk Engine" },
  { id: "recommend", label: "Recommendation" },
  { id: "alert", label: "Citizen Alert" },
];

export function PipelineVisualization({ activeStage, reducedMotion }: PipelineVisualizationProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (reducedMotion) {
      setCurrentStage(stages.length - 1);
      return;
    }

    intervalRef.current = setInterval(() => {
      setCurrentStage((prev) => (prev + 1) % stages.length);
    }, 1800);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [reducedMotion]);

  const displayStage = activeStage !== null ? activeStage : currentStage;

  return (
    <div
      className="relative w-full max-w-sm mx-auto"
      role="img"
      aria-label="CyberShield AI intelligence pipeline showing sequential processing stages from SMS analysis to citizen alert"
    >
      <div className="flex flex-col items-center gap-0">
        {stages.map((stage, i) => {
          const isActive = i <= displayStage;
          const isCurrent = i === displayStage;
          const isHighlighted = activeStage !== null && i === activeStage;

          return (
            <div key={stage.id} className="flex flex-col items-center">
              {/* Node */}
              <div
                className={`
                  relative w-12 h-12 rounded-full flex items-center justify-center
                  transition-all duration-500 ease-out
                  ${isActive
                    ? "bg-[#EC9AA3] shadow-[0_0_20px_rgba(236,154,163,0.3)]"
                    : "bg-[#12121A] border border-[rgba(236,154,163,0.18)]"
                  }
                  ${isCurrent && !reducedMotion ? "scale-110" : ""}
                  ${isHighlighted ? "ring-4 ring-[rgba(236,154,163,0.3)] scale-115" : ""}
                `}
              >
                <div
                  className={`w-3 h-3 rounded-full transition-all duration-300
                    ${isActive ? "bg-[#050508]" : "bg-[#B6B8C4]/30"}
                    ${isCurrent && !reducedMotion ? "animate-pulse" : ""}
                  `}
                />

                {/* Label */}
                <span
                  className={`
                    absolute left-full ml-4 whitespace-nowrap text-sm font-medium
                    transition-all duration-300
                    ${isActive ? "text-[#F8F8FA] opacity-100" : "text-[#B6B8C4]/50 opacity-60"}
                    ${isHighlighted ? "text-[#EC9AA3] font-semibold" : ""}
                  `}
                >
                  {stage.label}
                </span>
              </div>

              {/* Connector line */}
              {i < stages.length - 1 && (
                <div className="relative w-px h-8 flex items-center justify-center">
                  <div
                    className={`
                      w-px h-full transition-all duration-500
                      ${i < displayStage ? "bg-[#EC9AA3]/60" : "bg-[rgba(236,154,163,0.12)]"}
                    `}
                  />
                  {i === displayStage - 1 && !reducedMotion && (
                    <div className="absolute w-2 h-2 rounded-full bg-[#EC9AA3] animate-ping opacity-60" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
