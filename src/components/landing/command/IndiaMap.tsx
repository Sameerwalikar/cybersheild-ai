"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface City {
  name: string;
  /** Percentage position relative to map container */
  x: number;
  y: number;
  investigations: number;
  threats: string;
}

const cities: City[] = [
  { name: "Delhi", x: 48, y: 24, investigations: 47, threats: "UPI Fraud, Fake Gov Sites" },
  { name: "Mumbai", x: 32, y: 55, investigations: 63, threats: "Banking Domains, Identity Theft" },
  { name: "Bengaluru", x: 40, y: 76, investigations: 38, threats: "Investment Scams, Phishing" },
  { name: "Hyderabad", x: 42, y: 65, investigations: 29, threats: "Voice Scams, Deepfake Audio" },
  { name: "Chennai", x: 48, y: 78, investigations: 22, threats: "Phishing SMS, UPI Fraud" },
  { name: "Pune", x: 34, y: 58, investigations: 31, threats: "Identity Theft, Banking Fraud" },
  { name: "Kolkata", x: 62, y: 44, investigations: 25, threats: "Deepfake Audio, Fake Domains" },
];

interface Connection {
  from: number;
  to: number;
}

const connections: Connection[] = [
  { from: 0, to: 1 },
  { from: 0, to: 6 },
  { from: 1, to: 5 },
  { from: 1, to: 3 },
  { from: 2, to: 3 },
  { from: 2, to: 4 },
  { from: 3, to: 0 },
  { from: 4, to: 6 },
  { from: 5, to: 3 },
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

  return (
    <div
      className="relative w-full h-full min-h-[400px] lg:min-h-[500px] flex items-center justify-center"
      role="img"
      aria-label="Interactive map of India showing cyber threat signals across major cities"
    >
      {/* India SVG map asset */}
      <div className="relative w-[70%] h-[70%] flex items-center justify-center">
        <Image
          src="/india.svg"
          alt=""
          fill
          className="object-contain opacity-60"
          style={{ filter: "brightness(0.7) sepia(0.3) hue-rotate(320deg) saturate(0.5)" }}
          priority={false}
          aria-hidden="true"
        />

        {/* Connection lines overlay */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {connections.map((conn, i) => {
            const from = cities[conn.from];
            const to = cities[conn.to];
            const isActiveConn =
              activeCity === from.name || activeCity === to.name;

            return (
              <g key={i}>
                <motion.line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="#EC9AA3"
                  strokeWidth={isActiveConn ? "0.4" : "0.2"}
                  strokeDasharray={isActiveConn ? "none" : "1 1"}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={
                    active
                      ? { pathLength: 1, opacity: isActiveConn ? 0.6 : 0.2 }
                      : { pathLength: 0, opacity: 0 }
                  }
                  transition={{ duration: 1.5, delay: 0.3 + i * 0.15 }}
                />
                {/* Data packet animation along active connections */}
                {isActiveConn && active && (
                  <motion.circle
                    r="0.8"
                    fill="#EC9AA3"
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: [0, 1, 1, 0],
                      cx: [from.x, to.x],
                      cy: [from.y, to.y],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.4,
                      ease: "linear",
                    }}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* City nodes overlay */}
        {cities.map((city) => {
          const isActive = activeCity === city.name;
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
              {/* Pulse ring for active city */}
              {isActive && active && (
                <motion.div
                  className="absolute inset-0 w-6 h-6 -m-3 rounded-full border border-[#EC9AA3]/40"
                  style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
                  animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              )}

              {/* City dot */}
              <motion.button
                className={`relative w-3 h-3 rounded-full transition-all duration-300 cursor-pointer
                  ${isActive
                    ? "bg-[#EC9AA3] shadow-[0_0_12px_rgba(236,154,163,0.5)]"
                    : isHovered
                    ? "bg-[#EC9AA3] shadow-[0_0_8px_rgba(236,154,163,0.3)]"
                    : "bg-[#EC9AA3]/50"
                  }`}
                initial={{ scale: 0, opacity: 0 }}
                animate={active ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                transition={{ duration: 0.4, delay: cities.indexOf(city) * 0.1 }}
                onMouseEnter={() => setHoveredCity(city.name)}
                onMouseLeave={() => setHoveredCity(null)}
                onClick={() => handleCityClick(city.name)}
                aria-label={`${city.name}: ${city.investigations} active investigations`}
              />

              {/* City label */}
              <motion.span
                className="absolute top-full mt-1 left-1/2 -translate-x-1/2 text-[8px] text-[#B6B8C4] whitespace-nowrap pointer-events-none font-medium"
                initial={{ opacity: 0 }}
                animate={active ? { opacity: isActive || isHovered ? 1 : 0.6 } : { opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {city.name}
              </motion.span>

              {/* Tooltip on hover */}
              <AnimatePresence>
                {isHovered && active && (
                  <motion.div
                    className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-3 py-2 rounded-lg bg-[#12121A] border border-[rgba(236,154,163,0.2)] shadow-xl min-w-[140px]">
                      <p className="text-[10px] font-semibold text-[#F8F8FA] mb-1">{city.name}</p>
                      <div className="flex justify-between text-[9px] mb-0.5">
                        <span className="text-[#B6B8C4]">Investigations</span>
                        <span className="text-[#EC9AA3] font-bold">{city.investigations}</span>
                      </div>
                      <p className="text-[8px] text-[#B6B8C4]/70 mt-1">{city.threats}</p>
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[rgba(236,154,163,0.2)]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Glass overlay border */}
      <div className="absolute inset-0 rounded-2xl border border-[rgba(236,154,163,0.06)] pointer-events-none" />
    </div>
  );
}
