'use client';

import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, Float } from '@react-three/drei';
import * as THREE from 'three';

function Robot(props: React.JSX.IntrinsicElements['group']) {
  const groupRef = useRef<THREE.Group>(null);
  const { nodes, materials } = useGLTF('/cute robot head 3d model.glb') as any;

  // Gentle idle rotation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <group ref={groupRef} {...props} dispose={null}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes['tripo_node_18f47db0-4013-4589-8608-a4349cbbf042'].geometry}
          material={materials['tripo_mat_18f47db0-4013-4589-8608-a4349cbbf042']}
        />
      </group>
    </Float>
  );
}

useGLTF.preload('/cute robot head 3d model.glb');

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
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.3} color="#fce4ec" />
        <directionalLight position={[5, 5, 5]} intensity={1.2} color="#f9a8d4" />
        <pointLight position={[-3, 2, 4]} intensity={1.2} color="#ec4899" />
        <pointLight position={[3, -1, 2]} intensity={0.8} color="#f472b6" />
        <pointLight position={[0, 3, 2]} intensity={0.6} color="#fb7185" />
        <spotLight position={[-2, -2, 3]} intensity={0.5} color="#ec4899" angle={0.5} penumbra={1} />
        <Suspense fallback={<LoadingFallback />}>
          <Robot scale={1.5} position={[0, -0.3, 0]} />
          <Environment preset="city" />
        </Suspense>
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={1}
          maxPolarAngle={Math.PI / 1.8}
          minPolarAngle={Math.PI / 3}
        />
      </Canvas>
    </div>
  );
}
