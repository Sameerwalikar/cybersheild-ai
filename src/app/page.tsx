"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Hero,
  HeroScrollTransition,
  NetworkStory,
  PipelineSection,
  ThreatsSection,
  AegisSection,
  DetectionSection,
  JourneySection,
  CommandSection,
} from "@/components/landing";
import { DotGridBackground } from "@/components/DotGridBackground";

gsap.registerPlugin(ScrollTrigger);

export default function HomePage() {
  useEffect(() => {
    // Refresh all ScrollTriggers after full layout paint
    const timeout = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    return () => {
      clearTimeout(timeout);
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  return (
    <main className="relative">
      <DotGridBackground />
      <div className="relative z-10">
        <HeroScrollTransition>
          <Hero />
        </HeroScrollTransition>
        <NetworkStory />
        <PipelineSection />
        <ThreatsSection />
        <AegisSection />
        <DetectionSection />
        <JourneySection />
        <CommandSection />
      </div>
    </main>
  );
}
