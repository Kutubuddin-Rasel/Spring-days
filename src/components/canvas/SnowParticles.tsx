'use client';
import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStoryStore } from '@/store/useStoryStore';

function createSnowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  if (context) {
    // Soft radial gradient for a bokeh/glowing orb effect
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
  }
  return new THREE.CanvasTexture(canvas);
}

export default function SnowParticles({ count = 1200 }) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);

  // Initial positions and custom physics data
  const { positions, physics } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const phys = [];
    
    for (let i = 0; i < count; i++) {
      // Wide distribution
      pos[i * 3] = (Math.random() - 0.5) * 40; 
      pos[i * 3 + 1] = Math.random() * 20 - 5; 
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20; 
      
      phys.push({
        speed: 0.5 + Math.random() * 2, // Varied falling speed
        swaySpeed: 0.5 + Math.random() * 1.5, // How fast it sways side to side
        swayAmount: 0.5 + Math.random() * 2, // How far it sways
        phaseX: Math.random() * Math.PI * 2, // Unique start phase for X sway
        phaseZ: Math.random() * Math.PI * 2, // Unique start phase for Z sway
      });
    }
    return { positions: pos, physics: phys };
  }, [count]);

  const snowTexture = useMemo(() => {
    if (typeof document !== 'undefined') {
      return createSnowTexture();
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
    const elapsed = timer.getElapsed();
    const progress = useStoryStore.getState().scrollProgress;
    
    if (pointsRef.current) {
      const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;
      
      // Global wind factor based on progress (slows down as spring approaches)
      const globalSpeedFactor = THREE.MathUtils.lerp(1, 0.2, Math.min(progress * 2, 1));
      
      for (let i = 0; i < count; i++) {
        const p = physics[i];
        
        // Downward drift
        posArray[i * 3 + 1] -= delta * p.speed * globalSpeedFactor;
        
        // Swaying motion using sine waves
        const swayOffsetX = Math.sin(elapsed * p.swaySpeed + p.phaseX) * delta * p.swayAmount;
        const swayOffsetZ = Math.cos(elapsed * p.swaySpeed + p.phaseZ) * delta * p.swayAmount * 0.5;
        
        posArray[i * 3] += swayOffsetX;
        posArray[i * 3 + 2] += swayOffsetZ;
        
        // Reset particle to top if it falls too low
        if (posArray[i * 3 + 1] < -5) {
          posArray[i * 3 + 1] = 15;
          posArray[i * 3] = (Math.random() - 0.5) * 40; // Randomize X on reset
        }
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }

    if (materialRef.current) {
      // Fade out snow gracefully between 0.55 and 0.70 progress
      // Progress < 0.55: fully visible. Progress > 0.70: invisible.
      const opacity = progress < 0.55 ? 0.7 : progress > 0.70 ? 0 : 0.7 * (1 - (progress - 0.55) / 0.15);
      materialRef.current.opacity = opacity;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={0.6} // varied slightly by depth automatically if sizeAttenuation is true (default)
        color="#ffffff"
        transparent
        opacity={0.7}
        map={snowTexture || undefined}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        alphaTest={0.01}
      />
    </points>
  );
}
