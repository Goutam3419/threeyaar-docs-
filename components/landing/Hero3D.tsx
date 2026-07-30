'use client';

import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sparkles, Stars, MeshDistortMaterial, Float } from '@react-three/drei';
import type { Mesh, Group } from 'three';

function PulsingCore() {
  const coreRef = useRef<Mesh>(null);
  const groupRef = useRef<Group>(null);
  const { pointer } = useThree();

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Gentle constant rotation, plus a subtle tilt that follows the pointer —
      // this is the "mouse creates 3D tilt / parallax" requirement.
      groupRef.current.rotation.y += delta * 0.12;
      groupRef.current.rotation.x += (pointer.y * 0.25 - groupRef.current.rotation.x) * 0.04;
      groupRef.current.rotation.z += (-pointer.x * 0.08 - groupRef.current.rotation.z) * 0.04;
    }
    if (coreRef.current) {
      const material = coreRef.current.material as any;
      // Slow light-pulse: emissive intensity breathes in and out.
      material.emissiveIntensity = 0.55 + Math.sin(state.clock.elapsedTime * 1.4) * 0.25;
    }
  });

  return (
    <group ref={groupRef}>
      {/* The core */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[1.35, 5]} />
        <MeshDistortMaterial
          color="#2478F5"
          emissive="#2478F5"
          emissiveIntensity={0.6}
          distort={0.32}
          speed={1.8}
          roughness={0.15}
          metalness={0.65}
        />
      </mesh>

      {/* Rotating energy rings */}
      <mesh rotation={[Math.PI / 2.3, 0, 0]}>
        <torusGeometry args={[2.15, 0.018, 16, 120]} />
        <meshBasicMaterial color="#63AFFF" transparent opacity={0.55} />
      </mesh>
      <mesh rotation={[Math.PI / 3.1, Math.PI / 4, 0]}>
        <torusGeometry args={[2.55, 0.012, 16, 120]} />
        <meshBasicMaterial color="#F0980A" transparent opacity={0.4} />
      </mesh>
      <mesh rotation={[Math.PI / 5, -Math.PI / 3, 0]}>
        <torusGeometry args={[2.9, 0.008, 16, 120]} />
        <meshBasicMaterial color="#7C8CF8" transparent opacity={0.3} />
      </mesh>

      {/* Particle energy field */}
      <Sparkles count={90} scale={4.2} size={2.2} speed={0.35} color="#63AFFF" opacity={0.7} />

      <pointLight color="#2478F5" intensity={3} distance={7} />
      <pointLight color="#F0980A" intensity={1.2} distance={8} position={[2, 1, 2]} />
    </group>
  );
}

export interface Hero3DProps {
  /** Lower-fidelity mode for smaller screens — fewer particles, no Stars field. */
  reduced?: boolean;
}

export default function Hero3D({ reduced = false }: Hero3DProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 6.2], fov: 45 }}
      dpr={reduced ? 1 : [1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ pointerEvents: 'none' }}
    >
      <ambientLight intensity={0.45} />
      <Suspense fallback={null}>
        <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.6}>
          <PulsingCore />
        </Float>
        {!reduced && <Stars radius={45} depth={25} count={1500} factor={2.5} fade speed={1} />}
      </Suspense>
    </Canvas>
  );
}
