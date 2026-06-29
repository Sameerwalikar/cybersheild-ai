"use client";

import { useRef, useEffect, useState, useCallback, memo } from "react";
import { Canvas } from "@react-three/fiber";
import { IntelligenceGlobe } from "./globe";
import { SceneLights } from "./globe/SceneLights";
import { CameraRig } from "./globe/CameraRig";

export const HeroGlobe = memo(function HeroGlobe() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [mouseNormalized, setMouseNormalized] = useState({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // IntersectionObserver to pause when not visible
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Throttled mouse move (once per frame)
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setMouseNormalized({ x: mouseRef.current.x, y: mouseRef.current.y });
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMouseNormalized({ x: 0, y: 0 });
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      role="img"
      aria-label="Interactive visualization of CyberShield AI intelligence network showing interconnected threat analysis nodes"
    >
      <Canvas
        camera={{ position: [0, 0, 7], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        style={{ width: "100%", height: "100%" }}
        frameloop={isVisible ? "always" : "never"}
      >
        <SceneLights />
        <CameraRig reducedMotion={reducedMotion} />
        <IntelligenceGlobe
          reducedMotion={reducedMotion}
          mouseX={mouseNormalized.x}
          mouseY={mouseNormalized.y}
        />
      </Canvas>
    </div>
  );
});
