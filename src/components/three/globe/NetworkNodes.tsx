"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { InstancedMesh, Object3D, Color, MeshBasicMaterial, Vector3 } from "three";

interface NetworkNodesProps {
  positions: Float32Array;
  count: number;
  reducedMotion: boolean;
  mouseX: number;
  mouseY: number;
}

const tempObject = new Object3D();
const tempColor = new Color();
const baseColor = new Color("#EC9AA3");
const brightColor = new Color("#F3B3BA");
const hoverColor = new Color("#F8F8FA");

export function NetworkNodes({ positions, count, reducedMotion, mouseX, mouseY }: NetworkNodesProps) {
  const meshRef = useRef<InstancedMesh>(null);

  const pulsePhases = useMemo(
    () => Array.from({ length: count }, () => Math.random() * Math.PI * 2),
    [count]
  );
  const intensities = useMemo(
    () => Array.from({ length: count }, () => 0.3 + Math.random() * 0.7),
    [count]
  );
  const sizes = useMemo(
    () => Array.from({ length: count }, () => 0.014 + Math.random() * 0.014),
    [count]
  );

  const worldPositions = useMemo(() => {
    const wp: Vector3[] = [];
    for (let i = 0; i < count; i++) {
      wp.push(new Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]));
    }
    return wp;
  }, [positions, count]);

  const mouseDir = useMemo(() => new Vector3(), []);

  useFrame(({ clock, camera }) => {
    if (!meshRef.current) return;
    const time = clock.getElapsedTime();

    mouseDir.set(mouseX * 2.6, -mouseY * 2.6, 2.6).normalize().multiplyScalar(2.6);

    for (let i = 0; i < count; i++) {
      const wp = worldPositions[i];
      tempObject.position.copy(wp);

      const distToCamera = wp.distanceTo(camera.position);
      const depthFactor = 1 - Math.min(Math.max((distToCamera - 4.5) / 5, 0), 0.6);

      const pulse = reducedMotion
        ? 1
        : 1 + Math.sin(time * (0.8 + intensities[i] * 0.6) + pulsePhases[i]) * 0.12 * intensities[i];

      const s = sizes[i] * pulse;
      tempObject.scale.set(s, s, s);
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);

      const hoverDist = wp.distanceTo(mouseDir);
      const hoverInfluence = Math.max(0, 1 - hoverDist / 1.2);

      const blend = reducedMotion
        ? 0
        : (Math.sin(time * 0.6 + pulsePhases[i]) + 1) * 0.5 * intensities[i] * 0.3;

      tempColor.copy(baseColor);
      tempColor.lerp(brightColor, blend * depthFactor);
      if (hoverInfluence > 0) {
        tempColor.lerp(hoverColor, hoverInfluence * 0.5);
      }

      meshRef.current.setColorAt(i, tempColor);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  const material = useMemo(
    () =>
      new MeshBasicMaterial({
        color: baseColor,
        transparent: true,
        opacity: 0.9,
      }),
    []
  );

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, material, count]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 8, 8]} />
    </instancedMesh>
  );
}
