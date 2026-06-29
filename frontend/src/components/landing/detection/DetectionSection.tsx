"use client";

import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { MacbookScroll } from "./MacbookScroll";
import { AnalysisPanel, CardStatus } from "./AnalysisPanel";
import { AegisExplanation } from "./AegisExplanation";
import { RiskResult } from "./RiskResult";

gsap.registerPlugin(ScrollTrigger);

interface AnalysisCardState {
  id: string;
  label: string;
  icon: string;
  status: CardStatus;
  hoverDetail: string;
}

const initialCards: AnalysisCardState[] = [
  { id: "domain", label: "Domain Reputation", icon: "🌐", status: "idle", hoverDetail: "Checks domain age, SSL certificate, and known blacklists." },
  { id: "nlp", label: "NLP Threat Analysis", icon: "🧠", status: "idle", hoverDetail: "Detects urgency language, threats, and social engineering." },
  { id: "url", label: "URL Intelligence", icon: "🔗", status: "idle", hoverDetail: "Inspects link structure, redirects, and hosting patterns." },
  { id: "pattern", label: "Pattern Matching", icon: "🔍", status: "idle", hoverDetail: "Compares against 50,000+ known scam templates." },
  { id: "graph", label: "Fraud Graph Search", icon: "🕸️", status: "idle", hoverDetail: "Searches connected fraud networks for related activity." },
  { id: "risk", label: "Risk Engine", icon: "⚡", status: "idle", hoverDetail: "Calculates composite risk score from all signals." },
];

const explanationData = [
  { id: "domain-age", text: "Domain registered 3 days ago." },
  { id: "urgency", text: "Urgency language detected." },
  { id: "brand", text: "Brand impersonation identified." },
  { id: "infra", text: "Similar infrastructure reported previously." },
];

export function DetectionSection() {
  const sectionRef = useRef<HTMLElement>(null);
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
    if (reducedMotion || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom bottom",
        pin: sectionRef.current!.querySelector("[data-detection-pin]") as HTMLElement,
        pinSpacing: false,
        scrub: 0.8,
        anticipatePin: 1,
        onUpdate: (self) => {
          setScrollProgress(self.progress);
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  const p = reducedMotion ? 1 : scrollProgress;
  const lidProgress = Math.min(Math.max((p - 0.05) / 0.25, 0), 1);
  const dashboardProgress = Math.min(Math.max((p - 0.10) / 0.40, 0), 1);
  const scanProgress = p >= 0.30 && p <= 0.45 ? (p - 0.30) / 0.15 : 0;
  const macbookVisible = p > 0.02;
  const panelVisible = p > 0.45;
  const titleOpacity = Math.min(p / 0.05, 1);

  const getStatusText = () => {
    if (p < 0.30) return "Initializing...";
    if (p < 0.45) return "Analyzing message...";
    if (p < 0.50) return "Threats identified";
    if (p < 0.75) return "Running analysis modules...";
    if (p < 0.88) return "Generating explanation...";
    return "Analysis complete";
  };

  const getCardStatus = (index: number): CardStatus => {
    if (p < 0.50) return "idle";
    const cardRange = 0.25 / 6;
    const cardStart = 0.50 + index * cardRange;
    const cardEnd = cardStart + cardRange;
    if (p >= cardEnd) return "completed";
    if (p >= cardStart) return "active";
    return "idle";
  };

  const cards: AnalysisCardState[] = initialCards.map((c, i) => ({ ...c, status: getCardStatus(i) }));
  const explanations = explanationData.map((e, i) => ({ ...e, visible: p >= 0.75 + i * (0.13 / 4) }));
  const explanationsVisible = p >= 0.75;
  const showResult = p >= 0.88;

  return (
    <section
      ref={sectionRef}
      className="relative w-full"
      aria-labelledby="detection-heading"
      style={{ height: reducedMotion ? "auto" : "340vh" }}
    >
      <div
        data-detection-pin
        className="relative w-full h-screen flex items-center overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full opacity-[0.03]"
            style={{ background: "radial-gradient(circle, #EC9AA3 0%, transparent 60%)" }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center mb-12 lg:mb-16" style={{ opacity: reducedMotion ? 1 : titleOpacity }}>
            <h2 id="detection-heading" className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F8F8FA] leading-[1.1]">
              See CyberShield{" "}
              <span className="bg-gradient-to-r from-[#EC9AA3] to-[#F3B3BA] bg-clip-text text-transparent">In Action</span>
            </h2>
            <p className="mt-5 text-lg text-[#B6B8C4] leading-relaxed max-w-2xl mx-auto">
              Watch how AEGIS analyzes a suspicious message, explains every decision and protects citizens before fraud happens.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="flex justify-center lg:justify-end">
              <MacbookScroll visible={macbookVisible} scanProgress={scanProgress} lidProgress={lidProgress} dashboardProgress={dashboardProgress} />
            </div>

            <div className="max-w-md">
              <motion.div
                className="flex items-center gap-3 mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={panelVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#EC9AA3] to-[#F3B3BA] flex items-center justify-center shadow-md shadow-[rgba(236,154,163,0.2)]">
                  <span className="text-[#050508] font-bold text-sm">A</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#F8F8FA]">AEGIS</p>
                  <p className="text-xs text-[#EC9AA3]">{getStatusText()}</p>
                </div>
              </motion.div>

              <AnalysisPanel cards={cards} visible={panelVisible} />
              <AegisExplanation explanations={explanations} visible={explanationsVisible} />
              <RiskResult visible={showResult} reducedMotion={reducedMotion} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
