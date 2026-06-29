"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BufferGeometry,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineSegments as LineSegmentsType,
} from "three";

interface NetworkConnectionsProps {
  positions: Float32Array;
  count: number;
  maxDistance: number;
  mouseX: number;
  mouseY: number;
  reducedMotion: boolean;
}

export function NetworkConnections({
  positions,
  count,
  maxDistance,
  mouseX,
  mouseY,
  reducedMotion,
}: NetworkConnectionsProps) {
  const lineRef = useRef<LineSegmentsType>(null);

  const { geometry } = useMemo(() => {
    const lines: number[] = [];
    const maxDistSq = maxDistance * maxDistance;

    for (let i = 0; i < count; i++) {
      const ax = positions[i * 3];
      const ay = positions[i * 3 + 1];
      const az = positions[i * 3 + 2];

      for (let j = i + 1; j < count; j++) {
        const bx = positions[j * 3];
        const by = positions[j * 3 + 1];
        const bz = positions[j * 3 + 2];

        const dx = ax - bx;
        const dy = ay - by;
        const dz = az - bz;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < maxDistSq) {
          lines.push(ax, ay, az, bx, by, bz);
        }
      }
    }

    const geo = new BufferGeometry();
    geo.setAttribute(
      "position",
      new Float32BufferAttribute(new Float32Array(lines), 3)
    );

    return { geometry: geo, connectionCount: lines.length / 6 };
  }, [positions, count, maxDistance]);

  const materialRef = useRef<LineBasicMaterial>(null);

  useFrame(({ clock }) => {
    if (!materialRef.current || reducedMotion) return;
    const time = clock.getElapsedTime();
    const shimmer = 0.1 + Math.sin(time * 0.4) * 0.03;

    const hoverBoost = (Math.abs(mouseX) + Math.abs(mouseY)) * 0.02;
    materialRef.current.opacity = shimmer + hoverBoost;
  });

  return (
    <lineSegments ref={lineRef} geometry={geometry}>
      <lineBasicMaterial
        ref={materialRef}
        color="#EC9AA3"
        transparent
        opacity={0.1}
        depthWrite={false}
      />
    </lineSegments>
  );
}
