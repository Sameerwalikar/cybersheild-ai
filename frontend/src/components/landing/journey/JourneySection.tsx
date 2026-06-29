"use client";

import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { JourneyCard } from "./JourneyCard";
import { JourneyTimeline } from "./JourneyTimeline";
import { JourneyMetrics } from "./JourneyMetrics";

gsap.registerPlugin(ScrollTrigger);

const stages = [
  {
    stage: 1, title: "Incoming Threat", label: "Threat Detected",
    description: "A suspicious SMS arrives with a fake banking link, urgency language, and brand impersonation.",
    details: { input: "SMS from unknown number", decision: "Flag for analysis", output: "Queued for AEGIS" },
    icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EC9AA3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>),
  },
  {
    stage: 2, title: "AI Analysis", label: "Threat Intelligence",
    description: "AEGIS processes the message through NLP, URL intelligence, and pattern matching engines.",
    details: { input: "Raw message content", decision: "Multi-model analysis", output: "Threat signals extracted" },
    aegisBubble: "I've analyzed this message.",
    icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EC9AA3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>),
  },
  {
    stage: 3, title: "Fraud Intelligence", label: "Network Verified",
    description: "Connected fraud networks are identified. Domain, UPI ID, and phone number traced across the graph.",
    details: { input: "Extracted signals", decision: "Graph traversal", output: "3 connected networks found" },
    icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EC9AA3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3" /><circle cx="18" cy="18" r="3" /><circle cx="18" cy="6" r="3" /><path d="M6 9v6M9 6h6M15 18H9" /></svg>),
  },
  {
    stage: 4, title: "Citizen Alert", label: "Protection Activated",
    description: "\"This website is highly suspicious. Do not continue.\" Real-time protection delivered to the citizen.",
    details: { input: "Verified threat", decision: "Block + notify", output: "Citizen protected" },
    aegisBubble: "This threat has been blocked.",
    icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EC9AA3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>),
  },
  {
    stage: 5, title: "Threat Prevented", label: "Threat Neutralized",
    description: "Money protected. Identity secured. Citizen safe. The fraud network has been documented for investigation.",
    details: { input: "Blocked threat", decision: "Document + report", output: "Case created" },
    icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EC9AA3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></svg>),
  },
];

const CARD_COUNT = stages.length;

export function JourneySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (reducedMotion || !sectionRef.current || !trackRef.current) return;

    const totalShift = (CARD_COUNT - 1) * 340;

    const ctx = gsap.context(() => {
      gsap.to(trackRef.current, {
        x: -totalShift,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom bottom",
          pin: sectionRef.current!.querySelector("[data-journey-pin]") as HTMLElement,
          pinSpacing: false,
          scrub: 0.5,
          anticipatePin: 1,
          onUpdate: (self) => {
            setScrollProgress(self.progress);
          },
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  const p = reducedMotion ? 1 : scrollProgress;
  const titleOpacity = Math.min(p / 0.06, 1);
  const cardTravelProgress = Math.min(Math.max((p - 0.06) / 0.76, 0), 1);
  const activeCardIndex = Math.min(Math.floor(cardTravelProgress * CARD_COUNT), CARD_COUNT - 1);
  const metricsVisible = p >= 0.85;

  return (
    <section
      ref={sectionRef}
      className="relative w-full"
      aria-labelledby="journey-heading"
      style={{ height: reducedMotion ? "auto" : `${CARD_COUNT * 100}vh` }}
    >
      <div
        data-journey-pin
        className="relative w-full h-screen flex flex-col justify-center overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full opacity-[0.03]" style={{ background: "radial-gradient(circle, #EC9AA3 0%, transparent 60%)" }} />
        </div>

        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16 max-w-4xl mx-auto" style={{ opacity: reducedMotion ? 1 : titleOpacity }}>
            <h2 id="journey-heading" className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F8F8FA] leading-[1.1]">
              Every Threat. Every Decision.{" "}
              <span className="bg-gradient-to-r from-[#EC9AA3] to-[#F3B3BA] bg-clip-text text-transparent">Every Protection.</span>
            </h2>
            <p className="mt-5 text-lg text-[#B6B8C4] leading-relaxed max-w-2xl mx-auto">
              CyberShield continuously watches over citizens by detecting, analyzing and preventing cyber threats before damage occurs.
            </p>
          </div>

          {/* Desktop: Horizontal scrolling cards */}
          <div className="hidden lg:block relative">
            <div className="relative max-w-5xl mx-auto mb-8">
              <JourneyTimeline progress={cardTravelProgress} cardCount={CARD_COUNT} />
            </div>

            <div className="relative overflow-hidden max-w-5xl mx-auto">
              <div
                ref={trackRef}
                className="flex gap-8 will-change-transform"
                style={{ paddingLeft: "calc(50% - 150px)", paddingRight: "calc(50% - 150px)" }}
              >
                {stages.map((stage, i) => {
                  const isCentered = i === activeCardIndex;
                  const isPast = i < activeCardIndex;
                  return (
                    <div
                      key={stage.stage}
                      className="flex-shrink-0 transition-all duration-500 ease-out"
                      style={{
                        transform: isCentered ? "scale(1.05)" : "scale(0.95)",
                        opacity: isCentered ? 1 : isPast ? 0.5 : 0.7,
                      }}
                    >
                      <JourneyCard {...stage} active={i <= activeCardIndex} index={i} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mobile: Vertical stacked */}
          <div className="lg:hidden space-y-6">
            {stages.map((stage, i) => (
              <div key={stage.stage} className="relative">
                {i < stages.length - 1 && <div className="absolute left-6 top-full w-px h-6 bg-[rgba(236,154,163,0.15)]" />}
                <JourneyCard {...stage} active={true} index={i} />
              </div>
            ))}
          </div>

          <div className="max-w-5xl mx-auto">
            <JourneyMetrics visible={metricsVisible} />
          </div>
        </div>
      </div>
    </section>
  );
}
