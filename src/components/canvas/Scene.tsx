'use client';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import RainParticles from './RainParticles';
import CherryBlossomParticles from './CherryBlossomParticles';
import { useStoryStore } from '@/store/useStoryStore';
import * as THREE from 'three';
import { useRef } from 'react';

function EnvironmentManager() {
  const colorRef = useRef(new THREE.Color('#0a1128'));
  
  useFrame(({ scene }) => {
    const progress = useStoryStore.getState().scrollProgress;
    
    // Interpolate between Winter Blue and Spring Pink
    const winterColor = new THREE.Color('#0a1128');
    const springColor = new THREE.Color('#fdf2f8');
    
    // Transition from 0.3 to 0.7 progress
    colorRef.current.lerpColors(winterColor, springColor, Math.min(1, Math.max(0, (progress - 0.3) / 0.4)));
    
    scene.background = colorRef.current;
    if (scene.fog) {
      scene.fog.color = colorRef.current;
    }
  });

  return <fog attach="fog" args={['#0a1128', 5, 20]} />;
}

export default function Scene() {
  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
      <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
        <EnvironmentManager />
        <RainParticles />
        <CherryBlossomParticles />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
