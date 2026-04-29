'use client';
import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStoryStore } from '@/store/useStoryStore';

function createRainTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 4; // Much thinner for streak effect
  canvas.height = 128; // Long streak
  const context = canvas.getContext('2d');
  if (context) {
    const gradient = context.createLinearGradient(0, 0, 0, 128);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)'); // Softer alpha
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 4, 128);
  }
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export default function RainParticles({ count = 800 }) { // Reduced count to avoid visual noise
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);

  const [particlesPosition] = useState(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40; 
      positions[i * 3 + 1] = Math.random() * 20; 
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20; 
    }
    return positions;
  });

  const rainTexture = useMemo(() => {
    if (typeof document !== 'undefined') {
      return createRainTexture();
    }
    return null;
  }, []);

  const [timer] = useState(() => new THREE.Timer());

  useEffect(() => {
    if (typeof document !== 'undefined') {
      timer.connect(document);
    }
  }, [timer]);

  useFrame(() => {
    timer.update();
    const delta = timer.getDelta();
    const progress = useStoryStore.getState().scrollProgress;
    
    if (pointsRef.current) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
      // Slower, more elegant rain speed
      const speed = THREE.MathUtils.lerp(12, 2, Math.min(progress * 2, 1));
      
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 1] -= delta * speed;
        if (positions[i * 3 + 1] < -5) {
          positions[i * 3 + 1] = 15;
        }
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }

    if (materialRef.current) {
      // Fade out rain gracefully
      const opacity = progress < 0.15 ? 0.4 : progress > 0.4 ? 0 : 0.4 * (1 - (progress - 0.15) / 0.25);
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
        size={0.8} // Scaled slightly to stretch the long texture
        color="#7ca4d4" // Deeper, more subtle blue
        transparent
        opacity={0.4}
        map={rainTexture || undefined}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
