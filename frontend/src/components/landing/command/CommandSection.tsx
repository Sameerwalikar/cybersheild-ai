"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { IndiaMap } from "./IndiaMap";
import { ThreatFeed } from "./ThreatFeed";
import { InvestigationPanel } from "./InvestigationPanel";
import { CommandCounters } from "./CommandCounters";
import { AegisAssistant } from "./AegisAssistant";

gsap.registerPlugin(ScrollTrigger);

// Deterministic seeded random for SSR-safe particle positions
// Uses integer arithmetic to avoid floating-point precision differences between server/client
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function roundTo4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

interface ParticleData {
  left: string;
  top: string;
  duration: number;
  delay: number;
}

const PARTICLES: ParticleData[] = Array.from({ length: 20 }, (_, i) => ({
  left: `${roundTo4(10 + seededRandom(i * 3 + 1) * 80)}%`,
  top: `${roundTo4(10 + seededRandom(i * 3 + 2) * 80)}%`,
  duration: roundTo4(3 + seededRandom(i * 3 + 3) * 2),
  delay: roundTo4(seededRandom(i * 3 + 4) * 3),
}));

export function CommandSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [countersVisible, setCountersVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [activeCity, setActiveCity] = useState<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    if (mq.matches) { setIsActive(true); setCountersVisible(true); }
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (reducedMotion || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(titleRef.current, { opacity: 0, y: 36 }, {
        opacity: 1, y: 0, duration: 0.9, ease: "power2.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 72%", once: true, onEnter: () => setIsActive(true) },
      });

      gsap.fromTo(dashboardRef.current, { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, duration: 1, delay: 0.3, ease: "power2.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 55%", once: true, onEnter: () => setTimeout(() => setCountersVisible(true), 1200) },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  const handleActiveCity = useCallback((city: string) => {
    setActiveCity(city);
  }, []);

  const handleCityClick = useCallback((city: string) => {
    setActiveCity(city);
  }, []);

  return (
    <section ref={sectionRef} className="relative w-full py-24 lg:py-32 overflow-hidden" aria-labelledby="command-heading">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full opacity-[0.03]" style={{ background: "radial-gradient(circle, #EC9AA3 0%, transparent 55%)" }} />
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-[#EC9AA3]/20 animate-[float_4s_ease-in-out_infinite]"
            style={{ left: p.left, top: p.top, animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s` }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={titleRef} className={`text-center mb-12 lg:mb-16 ${reducedMotion ? "" : "opacity-0"}`}>
          <h2 id="command-heading" className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F8F8FA] leading-[1.1]">
            National Cyber Intelligence{" "}<span className="bg-gradient-to-r from-[#EC9AA3] to-[#F3B3BA] bg-clip-text text-transparent">Command Center</span>
          </h2>
          <p className="mt-5 text-lg text-[#B6B8C4] leading-relaxed max-w-2xl mx-auto">
            From individual reports to nationwide fraud intelligence. CyberShield connects millions of signals into actionable investigations.
          </p>
        </div>

        <div ref={dashboardRef} className={`relative rounded-2xl border border-[rgba(236,154,163,0.12)] bg-[#0D0D12]/80 backdrop-blur-md p-4 lg:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)] ${reducedMotion ? "" : "opacity-0"}`}>
          <div className="flex items-center justify-between mb-4 lg:mb-6 px-2">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#EC9AA3] to-[#F3B3BA] flex items-center justify-center">
                <span className="text-[8px] font-bold text-[#050508]">CS</span>
              </div>
              <span className="text-xs font-semibold text-[#F8F8FA]">CyberShield Command</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-[#B6B8C4]">Live Intelligence</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_220px] gap-4 lg:gap-5">
            <div className="order-2 lg:order-1">
              <ThreatFeed active={isActive} onActiveCity={handleActiveCity} />
            </div>
            <div className="order-1 lg:order-2 relative rounded-xl bg-[#050508]/50 border border-[rgba(236,154,163,0.06)] overflow-hidden">
              <IndiaMap active={isActive} activeCity={activeCity} onCityClick={handleCityClick} />
            </div>
            <div className="order-3">
              <InvestigationPanel active={isActive} activeCity={activeCity} />
            </div>
          </div>

          <div className="mt-4 lg:mt-5"><AegisAssistant active={isActive} /></div>
          <div className="mt-4 lg:mt-5"><CommandCounters visible={countersVisible} /></div>
        </div>
      </div>
    </section>
  );
}
