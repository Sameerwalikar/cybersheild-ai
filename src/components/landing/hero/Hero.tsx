"use client";

import { HeroBackground } from "./HeroBackground";
import { HeroContent } from "./HeroContent";
import { HeroCanvas } from "./HeroCanvas";

export function Hero() {
  return (
    <section
      data-hero-section
      className="relative w-full h-screen min-h-[600px] flex items-center overflow-hidden"
      aria-labelledby="hero-heading"
    >
      <HeroBackground />

      <div className="relative z-10 w-full h-full grid grid-cols-1 lg:grid-cols-2 items-center gap-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        {/* Left: Text content */}
        <div data-hero-text>
          <HeroContent />
        </div>

        {/* Right: Three.js canvas */}
        <div
          data-hero-canvas
          className="hidden lg:flex items-center justify-center h-full py-12"
        >
          <HeroCanvas />
        </div>
      </div>
    </section>
  );
}
