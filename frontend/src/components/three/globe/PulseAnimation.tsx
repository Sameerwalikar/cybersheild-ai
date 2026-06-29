"use client";

import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh, Vector3 } from "three";

interface PulseAnimationProps {
  positions: Float32Array;
  count: number;
  maxDistance: number;
  reducedMotion: boolean;
}

interface PulsePath {
  from: Vector3;
  to: Vector3;
  startTime: number;
  duration: number;
}

export function PulseAnimation({
  positions,
  count,
  maxDistance,
  reducedMotion,
}: PulseAnimationProps) {
  const meshRef = useRef<Mesh>(null);
  const [activePulse, setActivePulse] = useState<PulsePath | null>(null);
  const lastPulseTime = useRef(0);

  const edges = useMemo(() => {
    const result: { from: number; to: number }[] = [];
    const maxDistSq = maxDistance * maxDistance;

    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const dx = positions[i * 3] - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        if (dx * dx + dy * dy + dz * dz < maxDistSq) {
          result.push({ from: i, to: j });
        }
      }
    }
    return result;
  }, [positions, count, maxDistance]);

  useFrame(({ clock }) => {
    if (reducedMotion || !meshRef.current) return;

    const time = clock.getElapsedTime();

    if (!activePulse || time - activePulse.startTime > activePulse.duration) {
      if (time - lastPulseTime.current > 2.5 && edges.length > 0) {
        const edge = edges[Math.floor(Math.random() * edges.length)];
        const from = new Vector3(
          positions[edge.from * 3],
          positions[edge.from * 3 + 1],
          positions[edge.from * 3 + 2]
        );
        const to = new Vector3(
          positions[edge.to * 3],
          positions[edge.to * 3 + 1],
          positions[edge.to * 3 + 2]
        );
        setActivePulse({ from, to, startTime: time, duration: 1.2 });
        lastPulseTime.current = time;
      } else {
        meshRef.current.visible = false;
        return;
      }
    }

    if (activePulse) {
      const progress = (time - activePulse.startTime) / activePulse.duration;
      const pos = activePulse.from.clone().lerp(activePulse.to, progress);
      meshRef.current.position.copy(pos);
      meshRef.current.visible = true;

      const fade = progress < 0.2
        ? progress / 0.2
        : progress > 0.8
        ? (1 - progress) / 0.2
        : 1;
      meshRef.current.scale.setScalar(0.04 * fade);
    }
  });

  if (reducedMotion) return null;

  return (
    <mesh ref={meshRef} visible={false}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshBasicMaterial
        color="#F3B3BA"
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}
