"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface HeroScrollTransitionProps {
  children: React.ReactNode;
}

export function HeroScrollTransition({ children }: HeroScrollTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || !containerRef.current) return;

    const heroSection = containerRef.current.querySelector("[data-hero-section]");
    const heroText = containerRef.current.querySelector("[data-hero-text]");
    const heroCanvas = containerRef.current.querySelector("[data-hero-canvas]");

    if (!heroSection || !heroText || !heroCanvas) return;

    const ctx = gsap.context(() => {
      // Pin the hero section itself (not a child)
      ScrollTrigger.create({
        trigger: heroSection,
        start: "top top",
        end: "+=30%",
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
      });

      // Fade out hero text on scroll
      gsap.to(heroText, {
        opacity: 0,
        y: -30,
        ease: "power2.in",
        scrollTrigger: {
          trigger: heroSection,
          start: "top top",
          end: "+=25%",
          scrub: 1,
        },
      });

      // Move globe to top-right and scale down
      gsap.to(heroCanvas, {
        scale: 0.6,
        x: "15%",
        y: "-20%",
        opacity: 0,
        ease: "power2.inOut",
        scrollTrigger: {
          trigger: heroSection,
          start: "top top",
          end: "+=35%",
          scrub: 1.5,
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return <div ref={containerRef}>{children}</div>;
}
