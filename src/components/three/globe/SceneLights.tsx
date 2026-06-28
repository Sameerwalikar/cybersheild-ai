"use client";

export function SceneLights() {
  return (
    <>
      {/* Soft ambient fill */}
      <ambientLight intensity={0.35} color="#E8E8FF" />

      {/* Key light — top right, warm white */}
      <directionalLight position={[5, 4, 5]} intensity={0.7} color="#ffffff" />

      {/* Fill light — cool tint from opposite side */}
      <directionalLight position={[-4, 2, -3]} intensity={0.2} color="#C7D2FE" />

      {/* Rim light — subtle backlight for depth */}
      <directionalLight position={[0, -3, -5]} intensity={0.15} color="#A5B4FC" />

      {/* Point light near globe center for inner glow */}
      <pointLight position={[0, 0, 2]} intensity={0.2} color="#818CF8" distance={6} decay={2} />
    </>
  );
}
