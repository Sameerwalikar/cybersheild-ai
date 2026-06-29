"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import { AegisModel } from "./AegisModel";

interface AegisSceneProps {
  onHoverChange?: (hovered: boolean) => void;
}

export function AegisScene({ onHoverChange }: AegisSceneProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hovered, setHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const handleHover = useCallback(
    (state: boolean) => {
      setHovered(state);
      onHoverChange?.(state);
      if (containerRef.current) {
        containerRef.current.style.cursor = state ? "grab" : "default";
      }
    },
    [onHoverChange]
  );

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[500px]"
      onPointerEnter={() => handleHover(true)}
      onPointerLeave={() => handleHover(false)}
      onPointerDown={() => {
        if (containerRef.current) containerRef.current.style.cursor = "grabbing";
      }}
      onPointerUp={() => {
        if (containerRef.current) containerRef.current.style.cursor = hovered ? "grab" : "default";
      }}
      role="img"
      aria-label="AEGIS — CyberShield AI Guardian 3D model. Drag to rotate, scroll to zoom."
      tabIndex={0}
    >
      <Canvas
        camera={{ position: [0, 1, 6], fov: 35, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ width: "100%", height: "100%" }}
        resize={{ scroll: false, debounce: { scroll: 50, resize: 50 } }}
      >
        {/* Studio Lighting for dark theme */}
        <ambientLight intensity={0.3} />
        <hemisphereLight color="#1a1a2e" groundColor="#0D0D12" intensity={0.3} />
        {/* Key light */}
        <directionalLight
          position={[4, 8, 5]}
          intensity={0.7}
          color="#EC9AA3"
          castShadow
          shadow-mapSize={1024}
          shadow-bias={-0.0001}
        />
        {/* Fill light */}
        <directionalLight position={[-4, 3, -3]} intensity={0.2} color="#B6B8C4" />
        {/* Rim lights */}
        <pointLight position={[-3, 2, -4]} intensity={0.4} color="#EC9AA3" distance={12} decay={2} />
        <pointLight position={[3, 1, -3]} intensity={0.3} color="#F3B3BA" distance={10} decay={2} />

        {/* Orbit Controls */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          enableDamping={true}
          dampingFactor={0.06}
          autoRotate={true}
          autoRotateSpeed={reducedMotion ? 0.2 : 0.6}
          target={[0, 1.2, 0]}
          minPolarAngle={Math.PI * 0.3}
          maxPolarAngle={Math.PI * 0.65}
          minDistance={3.5}
          maxDistance={10}
          makeDefault
        />

        <Suspense fallback={null}>
          <AegisModel reducedMotion={reducedMotion} hovered={hovered} />
          <Environment preset="night" environmentIntensity={0.2} />
        </Suspense>

        {/* Platform */}
        <Platform hovered={hovered} />

        <ContactShadows
          position={[0, 0.01, 0]}
          opacity={0.25}
          scale={7}
          blur={2}
          far={4}
        />
      </Canvas>
    </div>
  );
}

function Platform({ hovered }: { hovered: boolean }) {
  return (
    <group position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Base disc */}
      <mesh>
        <circleGeometry args={[2.0, 64]} />
        <meshBasicMaterial color="#0D0D12" transparent opacity={0.5} />
      </mesh>

      {/* Outer glow ring */}
      <mesh position={[0, 0, 0.005]}>
        <ringGeometry args={[1.85, 2.0, 64]} />
        <meshBasicMaterial
          color="#EC9AA3"
          transparent
          opacity={hovered ? 0.2 : 0.08}
        />
      </mesh>

      {/* Inner accent ring */}
      <mesh position={[0, 0, 0.003]}>
        <ringGeometry args={[1.5, 1.55, 64]} />
        <meshBasicMaterial
          color="#EC9AA3"
          transparent
          opacity={hovered ? 0.1 : 0.04}
        />
      </mesh>

      {/* Soft radial glow */}
      <mesh position={[0, 0, -0.01]}>
        <circleGeometry args={[3, 64]} />
        <meshBasicMaterial color="#EC9AA3" transparent opacity={0.015} />
      </mesh>
    </group>
  );
}
