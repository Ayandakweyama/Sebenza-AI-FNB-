'use client';

import React, { useRef, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Float } from '@react-three/drei';
import type { Group } from 'three';

function Robot(props: React.JSX.IntrinsicElements['group']) {
  const groupRef = useRef<Group>(null);
  const isDraggingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const userRotRef = useRef({ x: 0, y: 0 });

  const { nodes, materials } = useGLTF('/cute robot head 3d model.glb') as any;

  useFrame((state) => {
    if (groupRef.current) {
      const baseY = Math.sin(state.clock.elapsedTime * 0.25) * 0.22;
      groupRef.current.rotation.x = userRotRef.current.x;
      groupRef.current.rotation.y = baseY + userRotRef.current.y;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.45) * 0.08;
    }
  });

  const handlers = useMemo(
    () => ({
      onPointerDown: (e: any) => {
        e.stopPropagation();
        isDraggingRef.current = true;
        lastRef.current = { x: e.clientX, y: e.clientY };
        (e.target as any).setPointerCapture?.(e.pointerId);
      },
      onPointerUp: (e: any) => {
        e.stopPropagation();
        isDraggingRef.current = false;
        lastRef.current = null;
        (e.target as any).releasePointerCapture?.(e.pointerId);
      },
      onPointerCancel: (e: any) => {
        e.stopPropagation();
        isDraggingRef.current = false;
        lastRef.current = null;
        (e.target as any).releasePointerCapture?.(e.pointerId);
      },
      onPointerMove: (e: any) => {
        if (!isDraggingRef.current || !lastRef.current) return;
        e.stopPropagation();
        const dx = e.clientX - lastRef.current.x;
        const dy = e.clientY - lastRef.current.y;
        lastRef.current = { x: e.clientX, y: e.clientY };

        userRotRef.current.y += dx * 0.01;
        userRotRef.current.x += dy * 0.01;
        userRotRef.current.x = Math.max(-0.6, Math.min(0.6, userRotRef.current.x));
      },
    }),
    [],
  );

  return (
    <Float speed={1.2} rotationIntensity={0.25} floatIntensity={0.8}>
      <group ref={groupRef} {...props} {...handlers} dispose={null}>
        <mesh
          geometry={nodes['tripo_node_18f47db0-4013-4589-8608-a4349cbbf042'].geometry}
          material={materials['tripo_mat_18f47db0-4013-4589-8608-a4349cbbf042']}
        />
      </group>
    </Float>
  );
}

function LoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshStandardMaterial color="#a855f7" wireframe transparent opacity={0.3} />
    </mesh>
  );
}

export default function RobotScene() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 3], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent', touchAction: 'none' }}
      >
        <ambientLight intensity={0.3} color="#fce4ec" />
        <directionalLight position={[5, 5, 5]} intensity={1.2} color="#f9a8d4" />
        <pointLight position={[-3, 2, 4]} intensity={1.2} color="#ec4899" />
        <pointLight position={[3, -1, 2]} intensity={0.8} color="#f472b6" />
        <pointLight position={[0, 3, 2]} intensity={0.6} color="#fb7185" />
        <spotLight position={[-2, -2, 3]} intensity={0.5} color="#ec4899" angle={0.5} penumbra={1} />
        <Suspense fallback={<LoadingFallback />}>
          <Robot scale={1.5} position={[0, -0.3, 0]} />
        </Suspense>
      </Canvas>
    </div>
  );
}
