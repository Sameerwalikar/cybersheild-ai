"use client";

import { useRef, useMemo, memo } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferGeometry, Float32BufferAttribute, Points } from "three";

interface AmbientParticlesProps {
  count?: number;
  spread?: number;
  reducedMotion: boolean;
}

export const AmbientParticles = memo(function AmbientParticles({
  count = 120,
  spread = 4.5,
  reducedMotion,
}: AmbientParticlesProps) {
  const ref = useRef<Points>(null);

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    // Deterministic distribution using golden ratio
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const theta = goldenAngle * i;
      const phi = Math.acos(1 - 2 * t);
      const r = 2.8 + (i % 7) / 7 * spread;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return geo;
  }, [count, spread]);

  useFrame((_, delta) => {
    if (ref.current && !reducedMotion) {
      ref.current.rotation.y += delta * 0.008;
    }
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={0.012}
        color="#EC9AA3"
        transparent
        opacity={0.3}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
});
