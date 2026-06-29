"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { Group, Box3, Vector3, MathUtils } from "three";

interface AegisModelProps {
  reducedMotion: boolean;
  hovered: boolean;
}

export function AegisModel({ reducedMotion, hovered }: AegisModelProps) {
  const groupRef = useRef<Group>(null);
  const { scene, animations } = useGLTF("/models/aegis.glb");
  const { actions } = useAnimations(animations, groupRef);
  const { camera } = useThree();

  // Compute bounding box once, derive scale, center offset, and platform Y
  const { modelScale, centerOffset, platformY, cameraDistance } = useMemo(() => {
    const box = new Box3().setFromObject(scene);
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    // Target: model occupies ~75% of a 4-unit vertical viewport
    const targetHeight = 3.0;
    const s = targetHeight / size.y;

    // After scaling, the bottom of the model should rest at y=0 (platform surface)
    const scaledMinY = box.min.y * s;
    const scaledCenterX = center.x * s;
    const scaledCenterZ = center.z * s;

    // Camera distance: fit full model with padding
    const scaledHeight = size.y * s;
    const fov = 35;
    const fovRad = MathUtils.degToRad(fov);
    const dist = (scaledHeight / 2) / Math.tan(fovRad / 2) * 1.4; // 40% padding

    return {
      modelScale: s,
      centerOffset: new Vector3(-scaledCenterX, -scaledMinY, -scaledCenterZ),
      platformY: 0,
      cameraDistance: dist,
    };
  }, [scene]);

  // Set camera position on mount and resize
  useEffect(() => {
    camera.position.set(0, cameraDistance * 0.2, cameraDistance);
    camera.lookAt(0, centerOffset.y * 0.4, 0);
    camera.updateProjectionMatrix();
  }, [camera, cameraDistance, centerOffset]);

  // Play idle animation if available
  useEffect(() => {
    if (animations.length > 0 && actions) {
      const actionName = Object.keys(actions)[0];
      if (actionName && actions[actionName]) {
        actions[actionName]!.reset().fadeIn(0.5).play();
      }
    }
  }, [animations, actions]);

  // Breathing animation when no native animation
  useFrame(({ clock }) => {
    if (!groupRef.current || reducedMotion) return;
    if (animations.length === 0) {
      const time = clock.getElapsedTime();
      const breath = Math.sin(time * 0.8) * 0.02;
      groupRef.current.position.y = centerOffset.y + breath;
    }
  });

  return (
    <group
      ref={groupRef}
      scale={modelScale}
      position={[centerOffset.x, centerOffset.y, centerOffset.z]}
    >
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload("/models/aegis.glb");
