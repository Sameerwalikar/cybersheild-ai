"use client";

import { useRef, useMemo, memo } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
import { NetworkNodes } from "./NetworkNodes";
import { NetworkConnections } from "./NetworkConnections";
import { PulseAnimation } from "./PulseAnimation";
import { AmbientParticles } from "./AmbientParticles";
import { ScanWave } from "./ScanWave";
import { ThreatNodes } from "./ThreatNodes";
import { IntelligencePulse } from "./IntelligencePulse";

interface IntelligenceGlobeProps {
  reducedMotion: boolean;
  mouseX: number;
  mouseY: number;
}

const NODE_COUNT = 250;
const SPHERE_RADIUS = 2.6;
const CONNECTION_DISTANCE = 0.9;

function generateFibonacciSphere(count: number, radius: number): Float32Array {
  const positions = new Float32Array(count * 3);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;

    positions[i * 3] = Math.cos(theta) * radiusAtY * radius;
    positions[i * 3 + 1] = y * radius;
    positions[i * 3 + 2] = Math.sin(theta) * radiusAtY * radius;
  }
  return positions;
}

export const IntelligenceGlobe = memo(function IntelligenceGlobe({ reducedMotion, mouseX, mouseY }: IntelligenceGlobeProps) {
  const groupRef = useRef<Group>(null);
  const currentParallaxZ = useRef(0);

  const nodePositions = useMemo(
    () => generateFibonacciSphere(NODE_COUNT, SPHERE_RADIUS),
    []
  );

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;

    const time = clock.getElapsedTime();

    const baseSpeed = reducedMotion ? 0.02 : 0.07;
    const variation = Math.sin(time * 0.23) * 0.015 + Math.sin(time * 0.11) * 0.008;
    groupRef.current.rotation.y += delta * (baseSpeed + variation);

    const maxAngle = 0.087;
    const dampFactor = 0.02;

    const targetRotX = -mouseY * maxAngle;
    const targetRotZ = mouseX * maxAngle * 0.3;

    groupRef.current.rotation.x += (targetRotX - groupRef.current.rotation.x) * dampFactor;
    currentParallaxZ.current += (targetRotZ - currentParallaxZ.current) * dampFactor;
    groupRef.current.rotation.z = currentParallaxZ.current;
  });

  return (
    <group ref={groupRef}>
      <NetworkNodes
        positions={nodePositions}
        count={NODE_COUNT}
        reducedMotion={reducedMotion}
        mouseX={mouseX}
        mouseY={mouseY}
      />
      <NetworkConnections
        positions={nodePositions}
        count={NODE_COUNT}
        maxDistance={CONNECTION_DISTANCE}
        mouseX={mouseX}
        mouseY={mouseY}
        reducedMotion={reducedMotion}
      />
      {!reducedMotion && (
        <>
          <PulseAnimation
            positions={nodePositions}
            count={NODE_COUNT}
            maxDistance={CONNECTION_DISTANCE}
            reducedMotion={reducedMotion}
          />
          <ScanWave radius={SPHERE_RADIUS} reducedMotion={reducedMotion} />
          <ThreatNodes positions={nodePositions} count={NODE_COUNT} maxActive={2} reducedMotion={reducedMotion} />
          <IntelligencePulse radius={SPHERE_RADIUS} reducedMotion={reducedMotion} />
        </>
      )}
      <AmbientParticles count={120} reducedMotion={reducedMotion} />
    </group>
  );
});
