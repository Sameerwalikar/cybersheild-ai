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

    // Multi-frequency breathing for organic feel
    const breathX =
      Math.sin(time * 0.13) * 0.06 +
      Math.sin(time * 0.07) * 0.03;
    const breathY =
      Math.cos(time * 0.11) * 0.04 +
      Math.cos(time * 0.05) * 0.02;
    const breathZ =
      7 +
      Math.sin(time * 0.06) * 0.12 +
      Math.sin(time * 0.03) * 0.06;

    targetRef.current.set(breathX, breathY, breathZ);

    // Very smooth interpolation — never snaps
    camera.position.lerp(targetRef.current, 0.015);
    camera.lookAt(0, 0, 0);
  });

  return null;
}
