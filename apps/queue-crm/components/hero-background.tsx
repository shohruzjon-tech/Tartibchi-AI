"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

function Particles({ count = 200 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null);
  const mousePos = useRef({ x: 0, y: 0 });

  const { viewport } = useThree();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mousePos.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const [positions, velocities, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * 20;
      pos[i3 + 1] = (Math.random() - 0.5) * 20;
      pos[i3 + 2] = (Math.random() - 0.5) * 10;

      vel[i3] = (Math.random() - 0.5) * 0.01;
      vel[i3 + 1] = (Math.random() - 0.5) * 0.01;
      vel[i3 + 2] = (Math.random() - 0.5) * 0.005;

      // Bright emerald to mint gradient
      const t = Math.random();
      col[i3] = 0.0 + t * 0.35; // R
      col[i3 + 1] = 0.79 + t * 0.21; // G
      col[i3 + 2] = 0.47 + t * 0.22; // B
    }
    return [pos, vel, col];
  }, [count]);

  useFrame((state) => {
    if (!mesh.current) return;
    const posArray = mesh.current.geometry.attributes.position
      .array as Float32Array;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Base movement
      posArray[i3] += velocities[i3]!;
      posArray[i3 + 1] += velocities[i3 + 1]!;
      posArray[i3 + 2] += velocities[i3 + 2]!;

      // Mouse influence (gentle attraction)
      const dx = mousePos.current.x * viewport.width * 0.5 - posArray[i3]!;
      const dy = mousePos.current.y * viewport.height * 0.5 - posArray[i3 + 1]!;
      posArray[i3] += dx * 0.0008;
      posArray[i3 + 1] += dy * 0.0008;

      // Subtle wave
      posArray[i3 + 1] += Math.sin(time * 0.3 + posArray[i3]! * 0.5) * 0.002;

      // Wrap around
      if (posArray[i3]! > 10) posArray[i3] = -10;
      if (posArray[i3]! < -10) posArray[i3] = 10;
      if (posArray[i3 + 1]! > 10) posArray[i3 + 1] = -10;
      if (posArray[i3 + 1]! < -10) posArray[i3 + 1] = 10;
    }

    mesh.current.geometry.attributes.position.needsUpdate = true;
    mesh.current.rotation.z = time * 0.02;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.7}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function ConnectionLines({ count = 200 }: { count?: number }) {
  const lineRef = useRef<THREE.LineSegments>(null);
  const particlesRef = useRef<Float32Array | null>(null);

  useFrame((state) => {
    if (!lineRef.current) return;

    // Find nearby points from the scene
    const scene = state.scene;
    const points = scene.children.find(
      (c) => c.type === "Points",
    ) as THREE.Points;
    if (!points) return;

    const posAttr = points.geometry.attributes.position;
    if (!posAttr) return;

    const positions = posAttr.array as Float32Array;
    const linePositions: number[] = [];

    const maxDist = 2.5;
    const maxLines = 150;
    let lineCount = 0;

    for (let i = 0; i < Math.min(count, 80) && lineCount < maxLines; i++) {
      for (
        let j = i + 1;
        j < Math.min(count, 80) && lineCount < maxLines;
        j++
      ) {
        const i3 = i * 3;
        const j3 = j * 3;
        const dx = positions[i3]! - positions[j3]!;
        const dy = positions[i3 + 1]! - positions[j3 + 1]!;
        const dz = positions[i3 + 2]! - positions[j3 + 2]!;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < maxDist) {
          linePositions.push(
            positions[i3]!,
            positions[i3 + 1]!,
            positions[i3 + 2]!,
            positions[j3]!,
            positions[j3 + 1]!,
            positions[j3 + 2]!,
          );
          lineCount++;
        }
      }
    }

    const arr = new Float32Array(linePositions);
    lineRef.current.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(arr, 3),
    );
    lineRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <lineSegments ref={lineRef}>
      <bufferGeometry />
      <lineBasicMaterial
        color="#00c978"
        transparent
        opacity={0.1}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}

function FloatingOrb({
  position,
  color,
  speed,
}: {
  position: [number, number, number];
  color: string;
  speed: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mousePos.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * speed;
    ref.current.position.y = position[1] + Math.sin(t) * 0.8;
    ref.current.position.x =
      position[0] + Math.cos(t * 0.7) * 0.5 + mousePos.current.x * 0.3;
    ref.current.position.z = position[2] + mousePos.current.y * 0.2;
    ref.current.scale.setScalar(1 + Math.sin(t * 1.5) * 0.1);
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.3, 32, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.15} />
    </mesh>
  );
}

export function HeroBackground() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent" }}
      >
        <Particles count={180} />
        <ConnectionLines count={180} />
        <FloatingOrb position={[-3, 2, -2]} color="#00c978" speed={0.4} />
        <FloatingOrb position={[3, -1, -3]} color="#00a368" speed={0.3} />
        <FloatingOrb position={[0, 3, -4]} color="#5aeaad" speed={0.35} />
        <FloatingOrb position={[-2, -2, -2]} color="#00c978" speed={0.45} />
        <FloatingOrb position={[4, 1, -3]} color="#72ffd0" speed={0.25} />
      </Canvas>
    </div>
  );
}
