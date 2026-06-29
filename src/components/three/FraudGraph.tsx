"use client";

import { useRef, useMemo, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  BufferGeometry,
  Float32BufferAttribute,
  Vector3,
  Color,
  Mesh,
  LineBasicMaterial,
  Points,
  Object3D,
  InstancedMesh,
  MeshBasicMaterial,
} from "three";

interface GraphNode {
  id: string;
  label: string;
  position: Vector3;
  type: "phone" | "upi" | "website" | "device" | "victim" | "complaint" | "police";
}

interface GraphEdge {
  from: number;
  to: number;
}

const NODE_DATA: Omit<GraphNode, "position">[] = [
  { id: "phone", label: "Phone Number", type: "phone" },
  { id: "upi", label: "UPI ID", type: "upi" },
  { id: "website", label: "Website", type: "website" },
  { id: "device", label: "Device", type: "device" },
  { id: "victim", label: "Victim", type: "victim" },
  { id: "complaint", label: "Complaint", type: "complaint" },
  { id: "police", label: "Police", type: "police" },
];

const EDGES: GraphEdge[] = [
  { from: 0, to: 1 },
  { from: 0, to: 2 },
  { from: 0, to: 3 },
  { from: 1, to: 4 },
  { from: 2, to: 4 },
  { from: 3, to: 4 },
  { from: 4, to: 5 },
  { from: 5, to: 6 },
  { from: 1, to: 3 },
  { from: 2, to: 3 },
];

const nodeColor = new Color("#EC9AA3");
const threatColor = new Color("#F3B3BA");
const tempObject = new Object3D();
const tempColor = new Color();

function GraphNodes({ nodes, reducedMotion }: { nodes: GraphNode[]; reducedMotion: boolean }) {
  const meshRef = useRef<InstancedMesh>(null);
  const threatRef = useRef<number | null>(null);
  const threatStart = useRef(0);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const time = clock.getElapsedTime();

    if (!reducedMotion && threatRef.current === null && Math.floor(time) % 6 === 0 && time - threatStart.current > 5) {
      threatRef.current = Math.floor(Math.random() * 5);
      threatStart.current = time;
    }

    if (threatRef.current !== null && time - threatStart.current > 3) {
      threatRef.current = null;
    }

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const float = reducedMotion ? 0 : Math.sin(time * 0.5 + i * 1.1) * 0.04;
      tempObject.position.set(node.position.x, node.position.y + float, node.position.z);

      const baseScale = 0.08;
      const pulse = reducedMotion ? 1 : 1 + Math.sin(time * 1.5 + i * 0.7) * 0.08;
      tempObject.scale.setScalar(baseScale * pulse);
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);

      if (i === threatRef.current) {
        const threatProgress = (time - threatStart.current) / 3;
        const fade = threatProgress < 0.2 ? threatProgress / 0.2 : threatProgress > 0.7 ? (1 - threatProgress) / 0.3 : 1;
        tempColor.copy(nodeColor).lerp(threatColor, fade);
      } else {
        tempColor.copy(nodeColor);
      }
      meshRef.current.setColorAt(i, tempColor);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  const material = useMemo(() => new MeshBasicMaterial({ color: nodeColor, transparent: true, opacity: 0.9 }), []);

  return (
    <instancedMesh ref={meshRef} args={[undefined, material, nodes.length]} frustumCulled={false}>
      <sphereGeometry args={[1, 16, 16]} />
    </instancedMesh>
  );
}

function GraphEdges({ nodes, edges }: { nodes: GraphNode[]; edges: GraphEdge[] }) {
  const geometry = useMemo(() => {
    const positions: number[] = [];
    for (const edge of edges) {
      const a = nodes[edge.from].position;
      const b = nodes[edge.to].position;
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new Float32BufferAttribute(new Float32Array(positions), 3));
    return geo;
  }, [nodes, edges]);

  const material = useMemo(() => new LineBasicMaterial({ color: "#EC9AA3", transparent: true, opacity: 0.2, depthWrite: false }), []);

  return <lineSegments geometry={geometry} material={material} />;
}

function GraphPulse({ nodes, edges, reducedMotion }: { nodes: GraphNode[]; edges: GraphEdge[]; reducedMotion: boolean }) {
  const meshRef = useRef<Mesh>(null);
  const pathRef = useRef<{ edge: GraphEdge; start: number }>({ edge: edges[0], start: 0 });

  useFrame(({ clock }) => {
    if (!meshRef.current || reducedMotion) return;
    const time = clock.getElapsedTime();
    const elapsed = time - pathRef.current.start;
    const duration = 1.8;

    if (elapsed > duration + 0.5) {
      pathRef.current = { edge: edges[Math.floor(Math.random() * edges.length)], start: time };
      return;
    }

    const progress = Math.min(elapsed / duration, 1);
    const a = nodes[pathRef.current.edge.from].position;
    const b = nodes[pathRef.current.edge.to].position;
    const pos = a.clone().lerp(b, progress);
    meshRef.current.position.copy(pos);

    const fade = progress < 0.15 ? progress / 0.15 : progress > 0.85 ? (1 - progress) / 0.15 : 1;
    meshRef.current.scale.setScalar(0.04 * fade);
    meshRef.current.visible = fade > 0.01;
  });

  if (reducedMotion) return null;

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshBasicMaterial color="#F3B3BA" transparent opacity={0.85} />
    </mesh>
  );
}

function FraudGraphScene({ reducedMotion }: { reducedMotion: boolean }) {
  const groupRef = useRef<any>(null);

  const nodes: GraphNode[] = useMemo(() => {
    const positions = [
      new Vector3(-1.2, 0.8, 0),
      new Vector3(-0.3, -0.2, 0.3),
      new Vector3(0.9, 0.6, -0.2),
      new Vector3(0.5, -0.8, 0.1),
      new Vector3(1.5, -0.1, 0),
      new Vector3(2.2, -0.7, -0.1),
      new Vector3(2.8, 0.3, 0),
    ];
    return NODE_DATA.map((n, i) => ({ ...n, position: positions[i] }));
  }, []);

  useFrame((_, delta) => {
    if (groupRef.current && !reducedMotion) {
      groupRef.current.rotation.y += delta * 0.03;
    }
  });

  return (
    <group ref={groupRef}>
      <GraphEdges nodes={nodes} edges={EDGES} />
      <GraphNodes nodes={nodes} reducedMotion={reducedMotion} />
      <GraphPulse nodes={nodes} edges={EDGES} reducedMotion={reducedMotion} />
    </group>
  );
}

export function FraudGraph() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div
      className="w-full h-full min-h-[350px]"
      role="img"
      aria-label="Animated fraud network graph showing connections between phone numbers, UPI IDs, websites, devices, victims, complaints, and police investigations"
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[3, 3, 3]} intensity={0.4} color="#EC9AA3" />
        <FraudGraphScene reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}
