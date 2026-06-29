"use client";

export function SceneLights() {
  return (
    <>
      {/* Soft ambient fill */}
      <ambientLight intensity={0.25} color="#1a1a2e" />

      {/* Key light — warm accent */}
      <directionalLight position={[5, 4, 5]} intensity={0.5} color="#EC9AA3" />

      {/* Fill light — cool tint from opposite side */}
      <directionalLight position={[-4, 2, -3]} intensity={0.2} color="#B6B8C4" />

      {/* Rim light — subtle backlight for depth */}
      <directionalLight position={[0, -3, -5]} intensity={0.15} color="#EC9AA3" />

      {/* Point light near globe center for inner glow */}
      <pointLight position={[0, 0, 2]} intensity={0.2} color="#EC9AA3" distance={6} decay={2} />
    </>
  );
}
