'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group, Points as ThreePoints } from 'three';
import * as THREE from 'three';

function Orb() {
  const group = useRef<Group>(null);
  const points = useRef<ThreePoints>(null);

  const positions = useMemo(() => {
    const count = 520;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 1.2 + Math.random() * 1.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      group.current.rotation.y = t * 0.25;
      group.current.rotation.x = Math.sin(t * 0.18) * 0.08;
    }
    if (points.current) {
      points.current.rotation.y = -t * 0.18;
      points.current.rotation.z = t * 0.12;
    }
  });

  return (
    <group ref={group} position={[0, 0, 0]}>
      <mesh>
        <sphereGeometry args={[0.72, 64, 64]} />
        <meshStandardMaterial
          color="#0b122b"
          roughness={0.35}
          metalness={0.55}
          emissive="#1d4ed8"
          emissiveIntensity={0.35}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.05, 0.015, 12, 200]} />
        <meshStandardMaterial color="#93c5fd" emissive="#3b82f6" emissiveIntensity={0.55} transparent opacity={0.65} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[1.18, 0.012, 12, 200]} />
        <meshStandardMaterial color="#e2e8f0" emissive="#60a5fa" emissiveIntensity={0.55} transparent opacity={0.55} />
      </mesh>
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.018} color="#93c5fd" transparent opacity={0.75} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  );
}

export function AssistantOrb() {
  return (
    <Canvas
      camera={{ position: [0, 0, 3.2], fov: 46 }}
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%', background: 'transparent', touchAction: 'none' }}
    >
      <ambientLight intensity={0.55} color="#dbeafe" />
      <directionalLight position={[4, 4, 3]} intensity={1.2} color="#93c5fd" />
      <pointLight position={[-3, -2, 3]} intensity={0.9} color="#60a5fa" />
      <pointLight position={[0, 2, 2]} intensity={0.6} color="#e2e8f0" />
      <Orb />
    </Canvas>
  );
}

