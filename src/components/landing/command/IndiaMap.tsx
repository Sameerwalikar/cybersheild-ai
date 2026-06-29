"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface City {
  name: string;
  x: number;
  y: number;
  investigations: number;
  threats: string;
}

const cities: City[] = [
  { name: "Delhi", x: 48, y: 24, investigations: 47, threats: "UPI Fraud, Fake Gov Sites" },
  { name: "Mumbai", x: 30, y: 55, investigations: 63, threats: "Banking Domains, Identity Theft" },
  { name: "Bengaluru", x: 39, y: 78, investigations: 38, threats: "Investment Scams, Phishing" },
  { name: "Hyderabad", x: 41, y: 66, investigations: 29, threats: "Voice Scams, Deepfake Audio" },
  { name: "Chennai", x: 47, y: 80, investigations: 22, threats: "Phishing SMS, UPI Fraud" },
  { name: "Pune", x: 32, y: 59, investigations: 31, threats: "Identity Theft, Banking Fraud" },
  { name: "Kolkata", x: 62, y: 43, investigations: 25, threats: "Deepfake Audio, Fake Domains" },
  { name: "Ahmedabad", x: 28, y: 44, investigations: 19, threats: "SIM Swap, Investment Scam" },
  { name: "Lucknow", x: 50, y: 33, investigations: 16, threats: "Fake Banking, Phishing Campaign" },
  { name: "Jaipur", x: 38, y: 34, investigations: 21, threats: "UPI Fraud, Voice Scam" },
];

interface Connection {
  from: number;
  to: number;
}

const connections: Connection[] = [
  { from: 0, to: 1 },
  { from: 0, to: 6 },
  { from: 0, to: 8 },
  { from: 1, to: 5 },
  { from: 1, to: 3 },
  { from: 2, to: 3 },
  { from: 2, to: 4 },
  { from: 3, to: 0 },
  { from: 4, to: 6 },
  { from: 5, to: 3 },
  { from: 7, to: 1 },
  { from: 7, to: 9 },
  { from: 8, to: 0 },
  { from: 9, to: 0 },
  { from: 6, to: 8 },
];

interface IndiaMapProps {
  active: boolean;
  activeCity?: string | null;
  onCityClick?: (city: string) => void;
}

export function IndiaMap({ active, activeCity, onCityClick }: IndiaMapProps) {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);

  const handleCityClick = useCallback((name: string) => {
    onCityClick?.(name);
  }, [onCityClick]);

  const activeConnections = useMemo(() => {
    if (!activeCity) return new Set<number>();
    const set = new Set<number>();
    connections.forEach((conn, i) => {
      if (cities[conn.from].name === activeCity || cities[conn.to].name === activeCity) {
        set.add(i);
      }
    });
    return set;
  }, [activeCity]);

  return (
    <div
      className="relative w-full h-full min-h-[400px] lg:min-h-[500px] flex items-center justify-center"
      role="region"
      aria-label="Interactive map of India showing cyber threat signals across major cities"
    >
      {/* India SVG map asset */}
      <div className="relative w-[70%] h-[70%] flex items-center justify-center">
        <Image
          src="/india.svg"
          alt=""
          fill
          className="object-contain"
          style={{ opacity: 0.5, filter: "brightness(0.6) sepia(0.2) hue-rotate(320deg) saturate(0.4)" }}
          priority={false}
          aria-hidden="true"
        />

        {/* Connection lines overlay */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {connections.map((conn, i) => {
            const from = cities[conn.from];
            const to = cities[conn.to];
            const isActiveConn = activeConnections.has(i);

            return (
              <g key={i}>
                <motion.line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={isActiveConn ? "#EC9AA3" : "rgba(236,154,163,0.35)"}
                  strokeWidth={isActiveConn ? "0.4" : "0.15"}
                  strokeDasharray={isActiveConn ? "none" : "1.5 1"}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={
                    active
                      ? { pathLength: 1, opacity: isActiveConn ? 0.7 : 0.25 }
                      : { pathLength: 0, opacity: 0 }
                  }
                  transition={{ duration: 1.2, delay: 0.2 + i * 0.08 }}
                />
                {isActiveConn && active && (
                  <motion.circle
                    r="0.7"
                    fill="#EC9AA3"
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: [0, 0.9, 0.9, 0],
                      cx: [from.x, to.x],
                      cy: [from.y, to.y],
                    }}
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: "linear",
                    }}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* City nodes overlay */}
        {cities.map((city, idx) => {
          const isCityActive = activeCity === city.name;
          const isHovered = hoveredCity === city.name;

          return (
            <div
              key={city.name}
              className="absolute z-20"
              style={{
                left: `${city.x}%`,
                top: `${city.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {/* Pulse ring */}
              {isCityActive && active && (
                <motion.div
                  className="absolute w-5 h-5 rounded-full border border-[#EC9AA3]/50"
                  style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
                  animate={{ scale: [1, 2.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              )}

              {/* Node button */}
              <motion.button
                className={`relative w-2.5 h-2.5 rounded-full cursor-pointer transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EC9AA3] focus-visible:ring-offset-1 focus-visible:ring-offset-[#050508]
                  ${isCityActive
                    ? "bg-[#EC9AA3] shadow-[0_0_14px_rgba(236,154,163,0.6)]"
                    : isHovered
                    ? "bg-[#EC9AA3] shadow-[0_0_8px_rgba(236,154,163,0.35)]"
                    : "bg-[#EC9AA3]/40"
                  }`}
                initial={{ scale: 0, opacity: 0 }}
                animate={active ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                onMouseEnter={() => setHoveredCity(city.name)}
                onMouseLeave={() => setHoveredCity(null)}
                onFocus={() => setHoveredCity(city.name)}
                onBlur={() => setHoveredCity(null)}
                onClick={() => handleCityClick(city.name)}
                aria-label={`${city.name}: ${city.investigations} active investigations. ${city.threats}`}
              />

              {/* Label */}
              <motion.span
                className="absolute top-full mt-0.5 left-1/2 -translate-x-1/2 text-[7px] text-[#B6B8C4] whitespace-nowrap pointer-events-none font-medium select-none"
                initial={{ opacity: 0 }}
                animate={active ? { opacity: isCityActive || isHovered ? 1 : 0.5 } : { opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {city.name}
              </motion.span>

              {/* Tooltip */}
              <AnimatePresence>
                {isHovered && active && (
                  <motion.div
                    className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="px-3 py-2 rounded-lg bg-[#0D0D12] border border-[rgba(236,154,163,0.2)] shadow-xl min-w-[130px]">
                      <p className="text-[10px] font-semibold text-[#F8F8FA] mb-1">{city.name}</p>
                      <div className="flex justify-between text-[9px] mb-0.5">
                        <span className="text-[#B6B8C4]">Investigations</span>
                        <span className="text-[#EC9AA3] font-bold tabular-nums">{city.investigations}</span>
                      </div>
                      <p className="text-[8px] text-[#B6B8C4]/70 mt-1 leading-relaxed">{city.threats}</p>
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-transparent border-t-[rgba(236,154,163,0.2)]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
