"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { IntelligenceGlobe } from "./globe";
import { SceneLights } from "./globe/SceneLights";
import { CameraRig } from "./globe/CameraRig";

export function HeroGlobe() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouseNormalized, setMouseNormalized] = useState({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    setMouseNormalized({ x, y });
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
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ width: "100%", height: "100%" }}
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
}
