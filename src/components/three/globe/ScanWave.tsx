"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh, MeshBasicMaterial } from "three";

interface ScanWaveProps {
  radius: number;
  reducedMotion: boolean;
}

export function ScanWave({ radius, reducedMotion }: ScanWaveProps) {
  const meshRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current || reducedMotion) return;
    const time = clock.getElapsedTime();
    const cycle = (time * 0.18) % 1;
    const y = (cycle * 2 - 1) * radius;
    meshRef.current.position.y = y;

    const ringRadius = Math.sqrt(Math.max(0, radius * radius - y * y));
    meshRef.current.scale.set(ringRadius, ringRadius, 1);

    const fade = cycle < 0.1
      ? cycle / 0.1
      : cycle > 0.9
      ? (1 - cycle) / 0.1
      : 1;
    (meshRef.current.material as MeshBasicMaterial).opacity = 0.15 * fade;
  });

  if (reducedMotion) return null;

  return (
    <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.95, 1, 64]} />
      <meshBasicMaterial
        color="#EC9AA3"
        transparent
        opacity={0.15}
        depthWrite={false}
        side={2}
      />
    </mesh>
  );
}
