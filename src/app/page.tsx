"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Hero,
  HeroScrollTransition,
  NetworkStory,
  PipelineSection,
  ThreatsSection,
} from "@/components/landing";
import { DotGridBackground } from "@/components/DotGridBackground";

gsap.registerPlugin(ScrollTrigger);

// Lazy load heavy below-fold sections
const AegisSection = dynamic(
  () => import("@/components/landing/aegis").then((m) => m.AegisSection),
  { ssr: true }
);
const DetectionSection = dynamic(
  () => import("@/components/landing/detection").then((m) => m.DetectionSection),
  { ssr: true }
);
const JourneySection = dynamic(
  () => import("@/components/landing/journey").then((m) => m.JourneySection),
  { ssr: true }
);
const CommandSection = dynamic(
  () => import("@/components/landing/command").then((m) => m.CommandSection),
  { ssr: true }
);

export default function HomePage() {
  useEffect(() => {
    const timeout = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 150);

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
