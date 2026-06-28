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
                    ? "bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                    : "bg-slate-100 border border-slate-200"
                  }
                  ${isCurrent && !reducedMotion ? "scale-110" : ""}
                  ${isHighlighted ? "ring-4 ring-indigo-300/50 scale-115" : ""}
                `}
              >
                <div
                  className={`w-3 h-3 rounded-full transition-all duration-300
                    ${isActive ? "bg-white" : "bg-slate-300"}
                    ${isCurrent && !reducedMotion ? "animate-pulse" : ""}
                  `}
                />

                {/* Label */}
                <span
                  className={`
                    absolute left-full ml-4 whitespace-nowrap text-sm font-medium
                    transition-all duration-300
                    ${isActive ? "text-slate-900 opacity-100" : "text-slate-400 opacity-60"}
                    ${isHighlighted ? "text-indigo-700 font-semibold" : ""}
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
                      ${i < displayStage ? "bg-indigo-400" : "bg-slate-200"}
                    `}
                  />
                  {/* Pulse traveling down */}
                  {i === displayStage - 1 && !reducedMotion && (
                    <div className="absolute w-2 h-2 rounded-full bg-indigo-400 animate-ping opacity-60" />
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
