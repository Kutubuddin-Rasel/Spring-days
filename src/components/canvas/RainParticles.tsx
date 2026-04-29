'use client';
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStoryStore } from '@/store/useStoryStore';

export default function RainParticles({ count = 2000 }) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);

  const [particlesPosition] = useState(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20; // x
      positions[i * 3 + 1] = Math.random() * 20; // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20; // z
    }
    return positions;
  });

  useFrame((state, delta) => {
    const progress = useStoryStore.getState().scrollProgress;
    
    if (pointsRef.current) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
      // Slow down the rain as spring approaches
      const speed = THREE.MathUtils.lerp(15, 2, Math.min(progress * 2, 1));
      
      for (let i = 0; i < count; i++) {
        // Fall down
        positions[i * 3 + 1] -= delta * speed;
        // Reset if too low
        if (positions[i * 3 + 1] < -5) {
          positions[i * 3 + 1] = 15;
        }
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }

    if (materialRef.current) {
      // Fade out rain from progress 0.2 to 0.5
      const opacity = progress < 0.2 ? 0.6 : progress > 0.5 ? 0 : 0.6 * (1 - (progress - 0.2) / 0.3);
      materialRef.current.opacity = opacity;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particlesPosition, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={0.05}
        color="#8aa8cb"
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
