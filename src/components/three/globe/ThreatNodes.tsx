"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { InstancedMesh, Object3D, Color, MeshBasicMaterial } from "three";

interface ThreatNodesProps {
  positions: Float32Array;
  count: number;
  maxActive?: number;
  reducedMotion: boolean;
}

const tempObject = new Object3D();
const threatColor = new Color("#EC9AA3");
const dimColor = new Color("#EC9AA3").multiplyScalar(0);

export function ThreatNodes({
  positions,
  count,
  maxActive = 3,
  reducedMotion,
}: ThreatNodesProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const stateRef = useRef<{
    active: { index: number; startTime: number; duration: number }[];
    lastSpawn: number;
  }>({ active: [], lastSpawn: 0 });

  const candidateIndices = useMemo(() => {
    const indices: number[] = [];
    for (let i = 0; i < count; i += Math.floor(count / 30)) {
      indices.push(i);
    }
    return indices;
  }, [count]);

  useFrame(({ clock }) => {
    if (!meshRef.current || reducedMotion) {
      if (meshRef.current) meshRef.current.visible = false;
      return;
    }
    meshRef.current.visible = true;

    const time = clock.getElapsedTime();
    const state = stateRef.current;

    if (state.active.length < maxActive && time - state.lastSpawn > 2.5 + Math.random() * 2) {
      const available = candidateIndices.filter(
        (idx) => !state.active.some((a) => a.index === idx)
      );
      if (available.length > 0) {
        const idx = available[Math.floor(Math.random() * available.length)];
        state.active.push({ index: idx, startTime: time, duration: 3 + Math.random() * 2 });
        state.lastSpawn = time;
      }
    }

    state.active = state.active.filter((a) => time - a.startTime < a.duration);

    for (let i = 0; i < maxActive; i++) {
      if (i < state.active.length) {
        const a = state.active[i];
        const progress = (time - a.startTime) / a.duration;
        const fade = progress < 0.2
          ? progress / 0.2
          : progress > 0.7
          ? (1 - progress) / 0.3
          : 1;

        const x = positions[a.index * 3];
        const y = positions[a.index * 3 + 1];
        const z = positions[a.index * 3 + 2];

        tempObject.position.set(x, y, z);
        const scale = 0.04 + fade * 0.03;
        tempObject.scale.set(scale, scale, scale);
        tempObject.updateMatrix();
        meshRef.current.setMatrixAt(i, tempObject.matrix);

        const color = dimColor.clone().lerp(threatColor, fade);
        meshRef.current.setColorAt(i, color);
      } else {
        tempObject.scale.set(0, 0, 0);
        tempObject.updateMatrix();
        meshRef.current.setMatrixAt(i, tempObject.matrix);
        meshRef.current.setColorAt(i, dimColor);
      }
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  const material = useMemo(
    () => new MeshBasicMaterial({ color: threatColor, transparent: true, opacity: 0.9 }),
    []
  );

  if (reducedMotion) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, material, maxActive]} frustumCulled={false}>
      <sphereGeometry args={[1, 12, 12]} />
    </instancedMesh>
  );
}
