"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh, MeshBasicMaterial } from "three";

interface IntelligencePulseProps {
  radius: number;
  reducedMotion: boolean;
}

export function IntelligencePulse({ radius, reducedMotion }: IntelligencePulseProps) {
  const meshRef = useRef<Mesh>(null);
  const matRef = useRef<MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current || !matRef.current || reducedMotion) return;

    const time = clock.getElapsedTime();
    // Pulse every ~8 seconds, expanding outward
    const cycle = (time * 0.125) % 1; // 8s period
    const scale = radius * 0.3 + cycle * radius * 0.85;

    meshRef.current.scale.setScalar(scale);

    // Fade in quickly, hold, then fade out
    let opacity = 0;
    if (cycle < 0.1) {
      opacity = cycle / 0.1;
    } else if (cycle < 0.5) {
      opacity = 1;
    } else {
      opacity = Math.max(0, (1 - cycle) / 0.5);
    }

    matRef.current.opacity = opacity * 0.06;
  });

  if (reducedMotion) return null;

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial
        ref={matRef}
        color="#4F46E5"
        transparent
        opacity={0}
        depthWrite={false}
        side={2}
      />
    </mesh>
  );
}
