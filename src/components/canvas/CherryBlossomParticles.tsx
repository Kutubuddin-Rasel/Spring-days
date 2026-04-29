'use client';
import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStoryStore } from '@/store/useStoryStore';

function createPetalTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  if (context) {
    // Draw a soft petal shape
    context.beginPath();
    context.moveTo(32, 60);
    context.bezierCurveTo(10, 40, 10, 10, 32, 5);
    context.bezierCurveTo(54, 10, 54, 40, 32, 60);
    
    const gradient = context.createRadialGradient(32, 32, 5, 32, 32, 30);
    gradient.addColorStop(0, 'rgba(255, 182, 193, 1)'); // Deep pink
    gradient.addColorStop(0.6, 'rgba(255, 220, 225, 0.8)'); // Light pink
    gradient.addColorStop(1, 'rgba(255, 240, 245, 0)'); // Fade out

    context.fillStyle = gradient;
    context.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export default function CherryBlossomParticles({ count = 500 }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Per-instance physics data
  const particlesData = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      data.push({
        x: (Math.random() - 0.5) * 40,
        y: Math.random() * 20 - 5,
        z: (Math.random() - 0.5) * 20,
        rotX: Math.random() * Math.PI,
        rotY: Math.random() * Math.PI,
        rotZ: Math.random() * Math.PI,
        speed: 1 + Math.random() * 1.5,
        spinX: (Math.random() - 0.5) * 2,
        spinY: (Math.random() - 0.5) * 2,
        spinZ: (Math.random() - 0.5) * 2,
        scale: 0.5 + Math.random() * 0.8,
        swirlPhase: Math.random() * Math.PI * 2,
        swirlRadius: 0.5 + Math.random() * 2,
      });
    }
    return data;
  }, [count]);

  const petalTexture = useMemo(() => {
    if (typeof document !== 'undefined') {
      return createPetalTexture();
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

    // Only start falling heavily as we transition out of winter (progress > 0.4)
    const intensity = Math.max(0, (progress - 0.4) * 2);

    if (meshRef.current) {
      for (let i = 0; i < count; i++) {
        const p = particlesData[i];

        // Fall down based on intensity
        p.y -= p.speed * delta * (0.5 + intensity * 2);
        
        // Swirl in X and Z
        const swirlOffset = Math.sin(elapsed * p.speed + p.swirlPhase) * delta * p.swirlRadius;
        p.x += swirlOffset;
        p.z += Math.cos(elapsed * p.speed + p.swirlPhase) * delta * (p.swirlRadius * 0.5);

        // Spin
        p.rotX += p.spinX * delta;
        p.rotY += p.spinY * delta;
        p.rotZ += p.spinZ * delta;

        // Reset if too low
        if (p.y < -5) {
          p.y = 15;
          p.x = (Math.random() - 0.5) * 40;
        }

        // Apply to dummy and set matrix
        dummy.position.set(p.x, p.y, p.z);
        dummy.rotation.set(p.rotX, p.rotY, p.rotZ);
        
        // Scale down to 0 if not spring yet
        const currentScale = p.scale * THREE.MathUtils.lerp(0, 1, Math.min(1, intensity * 2));
        dummy.scale.set(currentScale, currentScale, currentScale);
        
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      {/* Curved petal geometry */}
      <sphereGeometry args={[0.2, 8, 8, 0, Math.PI, 0, Math.PI / 4]} />
      <meshBasicMaterial 
        map={petalTexture || undefined} 
        color="#ffb6c1"
        transparent 
        opacity={0.85} 
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </instancedMesh>
  );
}
