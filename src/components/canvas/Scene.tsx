'use client';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import SnowParticles from './SnowParticles';
import CherryBlossomParticles from './CherryBlossomParticles';
import { useStoryStore } from '@/store/useStoryStore';
import * as THREE from 'three';
import { useRef, useMemo } from 'react';

// ─────────────────────────────────────────────────────────────
//  Sky colour palette — 5-stop gradient that syncs perfectly
//  with the story beats:
//
//   0.00 → Deep winter midnight  (#08101f)
//   0.25 → Dusky blue-grey      (#1a2640)
//   0.50 → Pre-dawn mauve       (#3d2540)
//   0.70 → First light peach    (#c4768a)
//   0.85 → Full spring blossom  (#fce9f0)
//   1.00 → Bright spring day    (#fdf4f7)
// ─────────────────────────────────────────────────────────────

interface ColorStop {
  t: THREE.Color;
  at: number;
}

const SKY_STOPS: ColorStop[] = [
  { t: new THREE.Color('#08101f'), at: 0.00 },
  { t: new THREE.Color('#111e35'), at: 0.20 },
  { t: new THREE.Color('#1c1430'), at: 0.42 },
  { t: new THREE.Color('#7a3852'), at: 0.58 },
  { t: new THREE.Color('#f0b8c8'), at: 0.72 },
  { t: new THREE.Color('#eeb4c8'), at: 0.85 },
  { t: new THREE.Color('#e8a5bc'), at: 1.00 },
];

// Sample the multi-stop palette at position t ∈ [0,1]
function sampleSky(t: number, out: THREE.Color): THREE.Color {
  t = Math.min(1, Math.max(0, t));
  for (let i = 1; i < SKY_STOPS.length; i++) {
    const prev = SKY_STOPS[i - 1];
    const curr = SKY_STOPS[i];
    if (t <= curr.at) {
      const local = (t - prev.at) / (curr.at - prev.at);
      // Smoothstep for a buttery crossfade
      const s = local * local * (3 - 2 * local);
      out.lerpColors(prev.t, curr.t, s);
      return out;
    }
  }
  out.copy(SKY_STOPS[SKY_STOPS.length - 1].t);
  return out;
}

// ─────────────────────────────────────────────────────────────
//  EnvironmentManager — runs inside the Canvas
//  Manages background, fog, ambient & directional lights,
//  all smoothly interpolated every frame.
// ─────────────────────────────────────────────────────────────
function EnvironmentManager() {
  const { scene } = useThree();

  // Persistent refs — no re-renders, just mutations
  const bgColor = useRef(new THREE.Color('#08101f'));
  const fogColor = useRef(new THREE.Color('#08101f'));
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const dirRef = useRef<THREE.DirectionalLight>(null);
  const fillRef = useRef<THREE.DirectionalLight>(null);
  const rimRef = useRef<THREE.DirectionalLight>(null);

  // Current smoothed progress
  const smoothProg = useRef(0);

  useFrame((_, delta) => {
    const raw = useStoryStore.getState().scrollProgress;
    const dt = Math.min(delta, 0.05);

    // ── Exponential smooth — feels like iOS spring ──
    // tau ≈ 0.18s → very responsive but never jarring
    const alpha = 1 - Math.exp(-dt / 0.18);
    smoothProg.current += (raw - smoothProg.current) * alpha;
    const p = smoothProg.current;

    // ── Background ──
    sampleSky(p, bgColor.current);
    scene.background = bgColor.current;

    // ── Fog — haze thickens near/after transition ──
    sampleSky(p, fogColor.current);
    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.color.copy(fogColor.current);
      // Winter: dense fog at 0.035; spring: clear at 0.012
      const fogDensity = THREE.MathUtils.lerp(0.032, 0.012, Math.min(1, p / 0.75));
      scene.fog.density = fogDensity;
    }

    // ── Lights ──
    if (ambientRef.current) {
      // Winter: cool blue-white; spring: warm golden
      const winterAmb = new THREE.Color(0x2a3d5f);
      const springAmb = new THREE.Color(0xfff0e0);
      ambientRef.current.color.lerpColors(winterAmb, springAmb, Math.min(1, p / 0.8));
      ambientRef.current.intensity = THREE.MathUtils.lerp(0.6, 0.85, Math.min(1, p / 0.8));
    }

    if (dirRef.current) {
      // Main sun: cold angle in winter, higher warmer in spring
      const winterSun = new THREE.Color(0x8ab4d4);
      const springSun = new THREE.Color(0xffe8b0);
      dirRef.current.color.lerpColors(winterSun, springSun, Math.min(1, p / 0.75));
      dirRef.current.intensity = THREE.MathUtils.lerp(0.4, 1.1, Math.min(1, p / 0.75));

      // Sun elevation
      const elevation = THREE.MathUtils.lerp(0.3, 1.0, Math.min(1, p / 0.8));
      dirRef.current.position.set(2.0, elevation * 5, 3.0);
    }

    if (fillRef.current) {
      // Fill light from opposite side — cold sky bounce
      fillRef.current.intensity = THREE.MathUtils.lerp(0.2, 0.5, Math.min(1, p / 0.8));
    }

    if (rimRef.current) {
      // Rim / back light — spring brings warm rim
      rimRef.current.intensity = Math.min(1, p / 0.7) * 0.4;
    }
  });

  // Set up scene fog once
  useMemo(() => {
    scene.fog = new THREE.FogExp2('#08101f', 0.032);
  }, [scene]);

  return (
    <>
      {/* Ambient */}
      <ambientLight ref={ambientRef} color="#2a3d5f" intensity={0.6} />

      {/* Sun / key light */}
      <directionalLight
        ref={dirRef}
        color="#8ab4d4"
        intensity={0.4}
        position={[2, 1.5, 3]}
        castShadow={false}
      />

      {/* Fill — cold sky bounce */}
      <directionalLight
        ref={fillRef}
        color="#b8d4f0"
        intensity={0.2}
        position={[-3, 2, -2]}
      />

      {/* Rim — spring warmth */}
      <directionalLight
        ref={rimRef}
        color="#ffe0a0"
        intensity={0}
        position={[0, -1, -4]}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
//  Scene
// ─────────────────────────────────────────────────────────────
export default function Scene() {
  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 55, near: 0.1, far: 80 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          // Physically correct mode for better light response
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
        dpr={[1, Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 2, 2)]}
      >
        <EnvironmentManager />
        <SnowParticles count={1400} />
        <CherryBlossomParticles />
      </Canvas>
    </div>
  );
}