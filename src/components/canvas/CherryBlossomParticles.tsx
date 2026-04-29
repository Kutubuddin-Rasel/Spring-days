'use client';
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStoryStore } from '@/store/useStoryStore';

export default function CherryBlossomParticles({ count = 1500 }) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);

  const [particlesData] = useState(() => {
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20; // x
      positions[i * 3 + 1] = Math.random() * 20; // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20; // z
      phases[i] = Math.random() * Math.PI * 2; // phase for swirling
    }
    return { positions, phases };
  });

  useFrame((state, delta) => {
    const progress = useStoryStore.getState().scrollProgress;

    if (pointsRef.current) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        // Fall down slower than rain
        positions[i * 3 + 1] -= delta * 2;
        
        // Swirl using phase and elapsed time
        const phase = particlesData.phases[i];
        positions[i * 3] += Math.sin(state.clock.elapsedTime + phase) * delta * 0.5;

        // Reset if too low
        if (positions[i * 3 + 1] < -5) {
          positions[i * 3 + 1] = 15;
          positions[i * 3] = (Math.random() - 0.5) * 20;
        }
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }

    if (materialRef.current) {
      // Fade in blossoms from progress 0.4 to 0.7
      const opacity = progress < 0.4 ? 0 : progress > 0.7 ? 0.8 : 0.8 * ((progress - 0.4) / 0.3);
      materialRef.current.opacity = opacity;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particlesData.positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={0.15}
        color="#ffb7c5"
        transparent
        opacity={0}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
