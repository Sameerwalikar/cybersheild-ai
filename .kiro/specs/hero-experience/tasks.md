# Implementation Plan: Hero Experience — CyberShield AI Landing Page

## Overview

This plan implements the full hero section with an animated 3D intelligence globe (Three.js via React Three Fiber), GSAP-orchestrated intro timeline, Framer Motion text reveals, and a graceful fallback path for mobile/low-power/reduced-motion contexts. TypeScript throughout, targeting a Next.js App Router project structure.

## Tasks

- [ ] 1. Set up globe configuration, types, and utility functions
  - [ ] 1.1 Create TypeScript interfaces and types for the globe system
    - Create `src/types/globe.ts` with all interfaces: `GlobeConfig`, `NodeData`, `ConnectionData`, `PulseState`, `ScanState`, `TimelinePhase`, `TimelinePhaseDef`, `GlobeNodesProps`, `GlobeConnectionsProps`, `GlobeParticlesProps`, `AttackPulseProps`, `ScanWaveProps`, `GlobeSceneProps`, `IntelligenceGlobeProps`, `HeroTimelineProps`, `HeroHeadlineProps`, `HeroSubtitleProps`, `HeroCTAProps`, `DotGridBackgroundProps`, `GlobeFallbackProps`, `HeroSectionProps`, `HeroState`
    - Include the `TimelineConfig` type with phase durations and `CTAButtonConfig`
    - _Requirements: All component interfaces defined in design_

  - [ ] 1.2 Create globe configuration constants
    - Create `src/lib/globe-config.ts` exporting `GLOBE_CONFIG` object with all values from the Data Models section (sphereRadius: 3, nodeCount: 250, threatNodeCount: 12, particleCount: 500, connectionMaxDistance: 0.8, nodeRadius: 0.03, colors, animation timings, camera settings, performance thresholds)
    - Export `HERO_TIMELINE` array with all 10 phase definitions (background through cta) including duration, delay, and easing strings
    - _Requirements: Globe configuration constants, timeline phase definitions_

  - [ ] 1.3 Implement globe math utility functions
    - Create `src/lib/globe-utils.ts` with:
      - `generateFibonacciSphere(count, radius)` — returns Vector3[] of evenly-distributed points on sphere surface using golden angle distribution
      - `generateScatteredPositions(count, spread)` — returns random Vector3[] within a volume for intro scatter state
      - `generateConnections(nodes, maxDistance, threatIndices)` — returns ConnectionData[] filtered by distance threshold, marks threat paths
      - `selectAttackPath(connections, threatIndices)` — returns a random connection involving at least one threat node, or null
      - `calculateBreathScale(time, min, max, duration)` — returns sinusoidal scale value bounded within [min, max]
      - `calculateParallaxOffset(mouseX, mouseY, maxAngleDeg)` — returns {rotX, rotY} clamped within max angle
      - `checkPerformance(frameTimes, threshold, windowSize, currentCount, reducedCount)` — returns particle count after degradation check
      - `assignThreatNodes(count, threatCount)` — returns boolean[] marking which indices are threats
    - All functions must be pure (no side effects) and include JSDoc documentation
    - _Requirements: Fibonacci sphere distribution, connection generation, attack path selection, breathing animation, parallax calculation, performance degradation_

  - [ ]* 1.4 Write property tests for globe utility functions
    - **Property 1: Node Distribution Uniformity** — for any count ≥ 1 and radius > 0, all returned positions have magnitude equal to radius (± 0.001 tolerance)
    - **Property 2: Connection Distance Bound** — for any generated connections, distance(from, to) ≤ maxDistance
    - **Property 3: Connection Uniqueness** — no duplicate (i, j) pairs exist and i < j for all connections
    - **Property 4: Breathing Animation Bounds** — for arbitrary time ≥ 0, result is within [min, max]
    - **Property 5: Parallax Angle Constraint** — for mouseX/mouseY in [-1, 1], output angles ≤ maxAngleRad
    - **Property 7: Performance Degradation Monotonicity** — returned count ≤ currentCount
    - **Property 9: Attack Pulse Validity** — if non-null, returned connection involves at least one threat node
    - **Validates: Requirements from Correctness Properties 1-5, 7, 9**
    - Use `fast-check` library with `fc.float`, `fc.integer`, `fc.array` arbitraries
    - Create file: `src/lib/__tests__/globe-utils.property.test.ts`

  - [ ]* 1.5 Write unit tests for globe utility functions
    - Test `generateFibonacciSphere`: returns correct count, all on sphere surface, no NaN values
    - Test `generateConnections`: empty input returns empty, respects maxDistance, no self-connections
    - Test `selectAttackPath`: returns null for empty threat paths, returns valid path otherwise
    - Test `calculateBreathScale`: at t=0 returns midpoint, periodic, known values at quarter/half cycle
    - Test `calculateParallaxOffset`: (0,0) returns (0,0), extremes return ±maxAngle
    - Test `checkPerformance`: below threshold keeps count, above threshold reduces count
    - Create file: `src/lib/__tests__/globe-utils.test.ts`
    - _Requirements: All algorithm postconditions_

- [ ] 2. Implement Three.js scene sub-components
  - [ ] 2.1 Implement GlobeNodes component
    - Create `src/components/three/GlobeNodes.tsx`
    - Use `InstancedMesh` with `SphereGeometry(0.03, 8, 8)` for all nodes in a single draw call
    - Accept `nodes: NodeData[]`, `visible: boolean`, `formationProgress: number` props
    - Lerp each node instance matrix between `scatteredPosition` and `position` using `formationProgress` (0=scattered, 1=on sphere)
    - Color normal nodes Electric Indigo (#4F46E5) at opacity 0.4-0.8, threat nodes Rose (#DC2626) at opacity 0.9
    - Update instance matrices via `useFrame` for smooth transition
    - Hide with `visible={false}` during pre-reveal phase
    - _Requirements: GlobeNodes interface, instanced rendering for performance_

  - [ ] 2.2 Implement GlobeConnections component
    - Create `src/components/three/GlobeConnections.tsx`
    - Use `LineSegments` with `BufferGeometry` and `LineBasicMaterial`
    - Accept `nodes: NodeData[]`, `maxDistance: number`, `visible: boolean`, `connectionProgress: number` props
    - Compute connection positions from node pairs within maxDistance
    - Animate progressive reveal: `connectionProgress` 0→1 draws connections sequentially
    - Color: Electric Indigo, opacity 0.2 (normal) / 0.4 (threat paths)
    - Update buffer attribute positions when nodes change formation
    - _Requirements: GlobeConnections interface, distance threshold, threat path highlighting_

  - [ ] 2.3 Implement GlobeParticles component
    - Create `src/components/three/GlobeParticles.tsx`
    - Use `Points` with `BufferGeometry` and `PointsMaterial`
    - Accept `count: number`, `visible: boolean` props
    - Generate random positions within sphere volume of radius `particleSpreadRadius` (4)
    - Apply slow Brownian-motion drift each frame (max velocity 0.001/frame)
    - Material: size 0.02, Electric Indigo, opacity 0.3, transparent
    - Support dynamic count reduction (re-slice buffer when count changes)
    - _Requirements: GlobeParticles interface, ambient particles, performance adaptability_

  - [ ] 2.4 Implement AttackPulse component
    - Create `src/components/three/AttackPulse.tsx`
    - Render a small `Mesh` with `SphereGeometry(0.05, 16, 16)` and emissive MeshStandardMaterial
    - Accept `connections: ConnectionData[]`, `threatNodes: NodeData[]`, `active: boolean`, `loopInterval: number` props
    - When active, select random threat-connected path every `loopInterval` ms via `selectAttackPath`
    - Animate position along selected path (lerp from→to based on progress 0→1)
    - Fade opacity in at start, out at end of path
    - Material: Rose (#DC2626), emissiveIntensity 2.0
    - _Requirements: AttackPulse interface, threat path animation_

  - [ ] 2.5 Implement ScanWave component
    - Create `src/components/three/ScanWave.tsx`
    - Render a `Mesh` with `RingGeometry` or `TorusGeometry` oriented horizontally
    - Accept `active: boolean`, `loopInterval: number` props
    - When active, sweep Y position from +3 to -3 over `loopInterval` ms with ease-in-out
    - Material: Electric Indigo (#4F46E5), opacity 0.3, emissive, transparent
    - Ring radius matches globe cross-section at current Y (sqrt(r² - y²))
    - _Requirements: ScanWave interface, AI scan visualization_

  - [ ] 2.6 Implement IntelligenceGlobe wrapper component
    - Create `src/components/three/IntelligenceGlobe.tsx`
    - Accept `animationPhase: 'intro' | 'idle'` and `introProgress: number` props
    - Group all sub-components (GlobeNodes, GlobeConnections, GlobeParticles, AttackPulse, ScanWave) inside a `<group>`
    - Apply auto-rotation on Y-axis at 0.1 rad/s during idle phase
    - Apply breathing animation (scale oscillation 1.0→1.02) via `calculateBreathScale`
    - Apply mouse parallax rotation offset from `useMouseParallax` hook
    - Manage performance monitoring: track frame times, reduce particle count if degraded
    - Wire `introProgress` to control `formationProgress`, `connectionProgress`, and component visibility
    - _Requirements: IntelligenceGlobe interface, auto-rotation, breathing, parallax_

- [ ] 3. Implement GlobeScene canvas wrapper
  - [ ] 3.1 Create GlobeScene with R3F Canvas, camera, and lights
    - Create `src/components/three/GlobeScene.tsx`
    - Wrap everything in `<Canvas>` with `dpr={[1, 2]}` (cap at 2x)
    - Set `frameloop="demand"` during intro (GSAP drives), switch to `"always"` during idle
    - Add `PerspectiveCamera` at position [0, 0, 7], fov 50 using `@react-three/drei`
    - Add `AmbientLight` intensity 0.5
    - Add `DirectionalLight` intensity 1.0 at position [5, 5, 5]
    - Accept `onReady`, `animationPhase`, `introProgress` props
    - Call `onReady()` when canvas mounts (via useEffect or onCreated)
    - Render `IntelligenceGlobe` with passed animation props
    - _Requirements: GlobeScene interface, camera/lighting setup, performance configuration_

- [ ] 4. Checkpoint — Verify Three.js components render
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement custom hooks
  - [ ] 5.1 Implement useWebGLDetection hook
    - Create `src/hooks/useWebGLDetection.ts`
    - Returns `{ isWebGLAvailable: boolean; isLoading: boolean }`
    - On mount, create an offscreen `<canvas>`, attempt `getContext('webgl2')` then `getContext('webgl')`
    - Set `isWebGLAvailable` based on result, `isLoading` = false after check
    - Run detection once only (useEffect with empty deps)
    - Clean up canvas element after detection
    - _Requirements: WebGL availability detection, graceful fallback trigger_

  - [ ] 5.2 Implement useReducedMotion hook
    - Create `src/hooks/useReducedMotion.ts`
    - Returns `boolean` indicating if user prefers reduced motion
    - Use `window.matchMedia('(prefers-reduced-motion: reduce)')` on mount
    - Listen for changes via `addEventListener('change', ...)` and update state
    - Clean up listener on unmount
    - SSR-safe: default to `false` during server render, detect on client
    - _Requirements: Accessibility, reduced motion compliance (Property 11)_

  - [ ] 5.3 Implement useMouseParallax hook
    - Create `src/hooks/useMouseParallax.ts`
    - Accept `maxAngleDeg: number` parameter
    - Returns `{ rotX: number; rotY: number }` in radians
    - Track mouse position via `mousemove` event on window
    - Normalize to [-1, 1] range relative to viewport center
    - Apply smooth interpolation (lerp factor ~0.05/frame via rAF) for non-snappy movement
    - Reset to (0, 0) on `mouseleave` event
    - Use `calculateParallaxOffset` from globe-utils for angle calculation
    - _Requirements: useMouseParallax interface, smooth parallax, angle constraints (Property 5)_

  - [ ] 5.4 Implement useGlobeAnimation hook
    - Create `src/hooks/useGlobeAnimation.ts`
    - Accept `config: GlobeConfig` parameter (defaults to GLOBE_CONFIG)
    - Use `useMemo` to generate nodes (Fibonacci sphere) and connections on mount
    - Use `useFrame` to track elapsed time and frame deltas
    - Implement performance monitoring: rolling 120-frame window, trigger degradation when avg > 20ms
    - Return `{ nodes, connections, particleCount, breathScale, phase, introProgress, pulseState, scanY }`
    - Compute `breathScale` from `calculateBreathScale` each frame
    - Manage attack pulse state: select new path every 3s, animate progress 0→1
    - Manage scan wave Y position: sweep -3→3 over 5s loop
    - _Requirements: useGlobeAnimation interface, all animation state management_

  - [ ]* 5.5 Write unit tests for custom hooks
    - Test `useWebGLDetection`: mock canvas getContext, verify isWebGLAvailable states
    - Test `useReducedMotion`: mock matchMedia, verify state changes
    - Test `useMouseParallax`: verify angle bounds, reset on leave, interpolation
    - Use `@testing-library/react` renderHook utility
    - Create files: `src/hooks/__tests__/useWebGLDetection.test.ts`, `src/hooks/__tests__/useReducedMotion.test.ts`, `src/hooks/__tests__/useMouseParallax.test.ts`
    - _Requirements: Hook postconditions verification_

- [ ] 6. Implement GSAP timeline orchestrator
  - [ ] 6.1 Create HeroTimeline component
    - Create `src/components/animations/HeroTimeline.tsx`
    - Accept `containerRef`, `onPhaseChange`, `onComplete`, `disabled` props
    - On mount (if not disabled): construct a `gsap.timeline()` with all phases from `HERO_TIMELINE` config
    - Each phase calls `onPhaseChange(phaseId)` at its start via timeline callbacks
    - Phases animate a shared progress ref (0→1 per phase) that GlobeScene reads
    - Call `onComplete()` when timeline finishes
    - If `disabled=true`: do not create timeline, all elements at final state immediately
    - Kill timeline on unmount (`timeline.kill()`) to prevent memory leaks
    - Export as named component (not default) for explicit imports
    - _Requirements: HeroTimeline interface, timeline sequencing, reduced motion bypass, cleanup (Properties 6, 11)_

  - [ ]* 6.2 Write unit tests for HeroTimeline
    - Test disabled mode: no timeline created, onComplete called immediately
    - Test phase ordering: onPhaseChange called in sequence
    - Test cleanup: timeline killed on unmount
    - Mock GSAP timeline object
    - Create file: `src/components/animations/__tests__/HeroTimeline.test.tsx`
    - _Requirements: Timeline phase ordering (Property 6), cleanup_

- [ ] 7. Implement hero section UI components
  - [ ] 7.1 Implement DotGridBackground component
    - Create `src/features/landing/components/DotGridBackground.tsx`
    - Render a full-size `<div>` with warm white (#FAFAF9) background
    - Apply CSS `radial-gradient` for dot pattern: 2px dots, 24px spacing, opacity 0.1
    - Optional soft radial gradient overlay (lighter center → slightly darker edges)
    - Accept `fadeIn` prop: if true, start at opacity 0, animate to 1 over 300ms (CSS transition)
    - Accept `className` and `dotSize`, `dotSpacing`, `dotOpacity` for customization
    - _Requirements: DotGridBackground interface, visual design spec_

  - [ ] 7.2 Implement GlobeFallback component
    - Create `src/features/landing/components/GlobeFallback.tsx`
    - Render a static SVG illustration representing the abstract globe concept
    - Use Electric Indigo (#4F46E5) and Rose (#DC2626) colors for visual coherence with 3D version
    - SVG contains: circular outline, scattered dots suggesting nodes, a few connecting lines
    - CSS fade-in animation on mount (opacity 0→1, 500ms)
    - Include `aria-label="Abstract intelligence network visualization"` for accessibility
    - Accept `className` prop
    - _Requirements: GlobeFallback interface, accessibility (Property 10)_

  - [ ] 7.3 Implement HeroHeadline component
    - Create `src/features/landing/components/HeroHeadline.tsx`
    - Render `<h1>` with default text "Prevent Cybercrime Before It Happens."
    - Accept `visible: boolean` and optional `text` override props
    - Use Framer Motion: `animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 20 }}` with duration 0.4s, easeOut
    - Font: Inter 700, responsive (text-4xl md:text-5xl lg:text-6xl → 36px/48px/64px)
    - Color: slate-900
    - Initial state: invisible (opacity 0, translateY 20px)
    - _Requirements: HeroHeadline interface, semantic h1, responsive typography_

  - [ ] 7.4 Implement HeroSubtitle component
    - Create `src/features/landing/components/HeroSubtitle.tsx`
    - Render `<p>` with supporting description text
    - Accept `visible: boolean` and optional `text` override props
    - Use Framer Motion: opacity 0→1, translateY 12→0, duration 300ms
    - Font: Inter 400, text-lg (18-20px), text-slate-600
    - Max width: max-w-xl (600px) for readability, centered
    - Stagger 200ms after headline (controlled externally via `visible` timing)
    - _Requirements: HeroSubtitle interface, muted typography, readability_

  - [ ] 7.5 Implement HeroCTA component
    - Create `src/features/landing/components/HeroCTA.tsx`
    - Render button group: primary "Launch Intelligence" + secondary "Explore Platform"
    - Accept `visible: boolean`, `onPrimaryClick`, `onSecondaryClick` props
    - Primary button: bg-indigo-600 (#4F46E5), text-white, rounded-xl, shadow-lg, backdrop-blur-sm
    - Secondary button: border border-slate-300, transparent bg, text-slate-700, rounded-xl
    - Hover micro-interaction: translateY -2px + increased box-shadow (Framer Motion whileHover)
    - Framer Motion entrance: opacity 0→1, duration 300ms when visible becomes true
    - Keyboard accessible: proper focus-visible rings, semantic `<button>` or `<a>` elements
    - _Requirements: HeroCTA interface, glassmorphism, accessibility, micro-interactions_

  - [ ] 7.6 Create barrel export for landing feature
    - Create `src/features/landing/index.ts`
    - Export `HeroSection` from `./components/HeroSection`
    - Create `src/features/landing/components/index.ts` exporting all components
    - _Requirements: Clean module boundaries, barrel exports_

- [ ] 8. Checkpoint — Verify UI components render independently
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement HeroSection container and integrate components
  - [ ] 9.1 Implement HeroSection container component
    - Create `src/features/landing/components/HeroSection.tsx`
    - Full viewport height container: `h-screen w-full overflow-hidden relative`
    - Use `useWebGLDetection()` to check WebGL support
    - Use `useReducedMotion()` for motion preference
    - Use a media query hook or Tailwind responsive approach for mobile detection (< 768px)
    - Compute `showGlobe = isWebGLAvailable && !isMobile && !prefersReducedMotion`
    - Dynamically import GlobeScene via `next/dynamic` with `ssr: false` and `loading: () => <GlobeFallback />`
    - Manage timeline phase state and introComplete flag
    - Render layers: DotGridBackground → Globe/Fallback (absolute positioned) → Text overlay (z-10 centered) → HeroTimeline
    - Pass `visible` props to HeroHeadline, HeroSubtitle, HeroCTA based on current phase or reducedMotion
    - When `prefersReducedMotion`: all text visible immediately, no globe, no timeline
    - _Requirements: HeroSection interface, conditional rendering, responsive behavior, accessibility (Properties 10, 11)_

  - [ ] 9.2 Integrate HeroSection into the landing page
    - Modify `src/app/(public)/page.tsx` (or create if not existing)
    - Import `HeroSection` from `@/features/landing`
    - Render `<HeroSection />` as first child of `<main>`
    - Ensure page has proper metadata for SEO (title, description)
    - _Requirements: Landing page integration, component wiring_

  - [ ]* 9.3 Write integration tests for HeroSection
    - Test with mocked WebGL available: verify GlobeScene is dynamically loaded
    - Test without WebGL: verify GlobeFallback renders
    - Test with prefers-reduced-motion: verify all text visible immediately, no animations triggered
    - Test mobile viewport (< 768px): verify fallback renders
    - Test timeline completion: verify introComplete state and idle transition
    - Mock next/dynamic, GSAP, and R3F canvas
    - Create file: `src/features/landing/__tests__/HeroSection.test.tsx`
    - _Requirements: Accessibility completeness (Property 10), reduced motion compliance (Property 11)_

- [ ] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements and correctness properties for traceability
- Checkpoints ensure incremental validation after each major integration point
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Three.js components require a browser/WebGL context — integration tests should mock the R3F canvas
- GSAP and Framer Motion can be tested via timeline state assertions and snapshot testing
- All components use named exports (not default) for better tree-shaking and import clarity

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3"] },
    { "id": 2, "tasks": ["1.4", "1.5", "5.1", "5.2", "5.3"] },
    { "id": 3, "tasks": ["2.1", "2.2", "2.3", "2.4", "2.5", "5.4"] },
    { "id": 4, "tasks": ["2.6", "5.5"] },
    { "id": 5, "tasks": ["3.1"] },
    { "id": 6, "tasks": ["6.1", "7.1", "7.2", "7.3", "7.4", "7.5"] },
    { "id": 7, "tasks": ["6.2", "7.6"] },
    { "id": 8, "tasks": ["9.1"] },
    { "id": 9, "tasks": ["9.2", "9.3"] }
  ]
}
```
