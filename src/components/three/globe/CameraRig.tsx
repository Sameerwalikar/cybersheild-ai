"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";

interface CameraRigProps {
  reducedMotion: boolean;
}

export function CameraRig({ reducedMotion }: CameraRigProps) {
  const { camera } = useThree();
  const targetRef = useRef(new Vector3(0, 0, 7));

  useFrame(({ clock }) => {
    if (reducedMotion) return;

    const time = clock.getElapsedTime();

    // Slower, more subtle breathing — premium feel
    const breathX =
      Math.sin(time * 0.1) * 0.04 +
      Math.sin(time * 0.05) * 0.02;
    const breathY =
      Math.cos(time * 0.08) * 0.03 +
      Math.cos(time * 0.04) * 0.015;
    const breathZ =
      7 +
      Math.sin(time * 0.05) * 0.08 +
      Math.sin(time * 0.025) * 0.04;

    targetRef.current.set(breathX, breathY, breathZ);

    // Smoother interpolation — even more gradual
    camera.position.lerp(targetRef.current, 0.008);
    camera.lookAt(0, 0, 0);
  });

  return null;
}
