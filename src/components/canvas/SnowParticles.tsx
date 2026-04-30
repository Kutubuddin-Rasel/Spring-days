'use client';
import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStoryStore } from '@/store/useStoryStore';

// ─────────────────────────────────────────────
//  Procedural snow-flake texture
//  Renders a 128×128 canvas: soft glowing orb
//  with a specular highlight to sell the 3-D look.
// ─────────────────────────────────────────────
function createSnowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Outer glow (atmosphere)
  const glow = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  glow.addColorStop(0, 'rgba(220, 240, 255, 1.0)');
  glow.addColorStop(0.18, 'rgba(200, 225, 255, 0.95)');
  glow.addColorStop(0.40, 'rgba(170, 210, 255, 0.55)');
  glow.addColorStop(0.65, 'rgba(140, 190, 255, 0.18)');
  glow.addColorStop(1.0, 'rgba(120, 170, 255, 0.0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  // Specular highlight — top-left quadrant, small, sharp
  const spec = ctx.createRadialGradient(46, 46, 0, 46, 46, 16);
  spec.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
  spec.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
  spec.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
  ctx.fillStyle = spec;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ─────────────────────────────────────────────
//  Per-particle state (kept outside component
//  so it doesn't trigger React re-renders)
// ─────────────────────────────────────────────
interface SnowPhysics {
  /** World-space position */
  x: number; y: number; z: number;
  /** Fall speed (units / sec) */
  fallSpeed: number;
  /** Horizontal sway — Lissajous variant */
  swayFreqX: number;
  swayFreqZ: number;
  swayAmpX: number;
  swayAmpZ: number;
  /** Random phase offsets */
  phaseX: number;
  phaseZ: number;
  /** Particle radius → drives point size */
  radius: number;
  /** Turbulence — each flake has its own micro-wind */
  turbAmp: number;
  turbFreq: number;
  turbPhase: number;
}

function buildPhysics(count: number): SnowPhysics[] {
  const arr: SnowPhysics[] = [];
  for (let i = 0; i < count; i++) {
    const radius = 0.15 + Math.random() * 0.22; // 0.08–0.30 → size variety
    arr.push({
      x: (Math.random() - 0.5) * 44,
      y: -5 + Math.random() * 22,       // spread from -5 → 17
      z: -10 + Math.random() * 20,
      fallSpeed: 0.35 + Math.pow(radius / 0.30, 1.4) * 1.8, // bigger ↔ faster
      swayFreqX: 0.25 + Math.random() * 0.9,
      swayFreqZ: 0.18 + Math.random() * 0.7,
      swayAmpX: 0.20 + Math.random() * 0.80,
      swayAmpZ: 0.10 + Math.random() * 0.35,
      phaseX: Math.random() * Math.PI * 2,
      phaseZ: Math.random() * Math.PI * 2,
      radius,
      turbAmp: 0.06 + Math.random() * 0.14,
      turbFreq: 1.2 + Math.random() * 2.5,
      turbPhase: Math.random() * Math.PI * 2,
    });
  }
  return arr;
}

// ─────────────────────────────────────────────
//  Smooth step helper
// ─────────────────────────────────────────────
const smoothstep = (x: number) => x * x * (3 - 2 * x);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

// ─────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────
export default function SnowParticles({ count = 1400 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // ── Geometry: positions + sizes ──
  const { positions, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const phys = buildPhysics(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = phys[i].x;
      pos[i * 3 + 1] = phys[i].y;
      pos[i * 3 + 2] = phys[i].z;
      sz[i] = phys[i].radius;
    }
    return { positions: pos, sizes: sz };
  }, [count]);

  // ── Physics ref (mutable, no re-render) ──
  const physRef = useRef<SnowPhysics[]>(buildPhysics(count));

  // ── Texture ──
  const snowTexture = useMemo(() => {
    if (typeof document !== 'undefined') return createSnowTexture();
    return null;
  }, []);

  // ── Timer ──
  const [timer] = useState(() => new THREE.Timer());
  useEffect(() => {
    if (typeof document !== 'undefined') timer.connect(document);
    return () => { timer.dispose?.(); };
  }, [timer]);

  // ─────────────────────────────────────────
  //  Custom shader material for per-particle
  //  size + smooth alpha falloff + additive
  //  blending.  Vertex shader reads "a_size"
  //  attribute; fragment shader re-creates
  //  the soft-orb look in real-time so the
  //  texture is just the highlight layer.
  // ─────────────────────────────────────────
  const shaderMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      u_texture: { value: snowTexture },
      u_opacity: { value: 1.0 },
      u_pixelRatio: { value: typeof window !== 'undefined' ? window.devicePixelRatio : 1 },
    },
    vertexShader: /* glsl */`
      attribute float a_size;
      varying   float v_size;

      void main() {
        v_size = a_size;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        // Perspective-correct size: larger when close, correct depth cue
        gl_PointSize = a_size * (520.0 / -mvPosition.z);
        gl_Position  = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: /* glsl */`
      uniform sampler2D u_texture;
      uniform float     u_opacity;
      varying float     v_size;

      void main() {
        // gl_PointCoord is [0,1]²; centre is (0.5, 0.5)
        vec2  uv   = gl_PointCoord;
        float dist = distance(uv, vec2(0.5));

        // Hard discard outside circle
        if (dist > 0.5) discard;

        // Smooth alpha falloff — ice-sphere feel
        float alpha = 1.0 - smoothstep(0.20, 0.50, dist);
        alpha = pow(alpha, 1.6); // slight gamma tweak

        vec4 tex = texture2D(u_texture, uv);
        // Core tint: icy blue-white
        vec3 color = mix(vec3(0.72, 0.88, 1.0), vec3(1.0), tex.r * 0.8);

        gl_FragColor = vec4(color, alpha * tex.a * u_opacity);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), [snowTexture]);

  // ── Frame loop ──
  useFrame(() => {
    timer.update();
    const delta = Math.min(timer.getDelta(), 0.05); // cap at 50ms
    const elapsed = timer.getElapsed();
    const progress = useStoryStore.getState().scrollProgress;

    if (!pointsRef.current) return;

    const phys = physRef.current;
    const geo = pointsRef.current.geometry;
    const posArr = geo.attributes.position.array as Float32Array;
    const sizeArr = geo.attributes.a_size.array as Float32Array;

    // Global slow-down as spring approaches (progress 0 → 0.55)
    // Ease to near-zero by the transition point
    const slowFactor = 1 - smoothstep(clamp01(progress / 0.60));
    // Subtle "final breath" drift — keeps a few specks moving at spring
    const minFactor = 0.04;
    const speedMult = minFactor + (1 - minFactor) * slowFactor;

    // Opacity: full until 0.55, then fade by 0.70
    const opacityT = clamp01((progress - 0.55) / 0.15);
    const targetOp = (1 - smoothstep(opacityT)) * 0.82;
    const mat = shaderMaterial;
    // Smooth the opacity so it doesn't snap
    const curOp = (mat.uniforms.u_opacity.value as number);
    mat.uniforms.u_opacity.value = curOp + (targetOp - curOp) * Math.min(1, delta * 4);

    for (let i = 0; i < count; i++) {
      const p = phys[i];

      // ── Fall ──
      p.y -= p.fallSpeed * delta * speedMult;

      // ── Sway (Lissajous) ──
      const t = elapsed;
      const swX = Math.sin(t * p.swayFreqX + p.phaseX) * p.swayAmpX;
      const swZ = Math.cos(t * p.swayFreqZ + p.phaseZ) * p.swayAmpZ;
      // Apply as velocity, not absolute offset, so the flake drifts naturally
      p.x += (swX - Math.sin((t - delta) * p.swayFreqX + p.phaseX) * p.swayAmpX) * speedMult;
      p.z += (swZ - Math.cos((t - delta) * p.swayFreqZ + p.phaseZ) * p.swayAmpZ) * speedMult;

      // ── Micro-turbulence ──
      p.x += Math.sin(t * p.turbFreq + p.turbPhase) * p.turbAmp * delta * speedMult;

      // ── Reset ──
      if (p.y < -6) {
        p.y = 17 + Math.random() * 3;
        p.x = (Math.random() - 0.5) * 44;
        p.z = -10 + Math.random() * 20;
      }

      posArr[i * 3] = p.x;
      posArr[i * 3 + 1] = p.y;
      posArr[i * 3 + 2] = p.z;

      // Size pulse — very subtle breathing to mimic tumbling facets
      const breath = 1 + 0.06 * Math.sin(elapsed * p.turbFreq * 0.7 + p.turbPhase);
      sizeArr[i] = p.radius * breath;
    }

    geo.attributes.position.needsUpdate = true;
    geo.attributes.a_size.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} material={shaderMaterial}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-a_size"
          args={[sizes, 1]}
        />
      </bufferGeometry>
    </points>
  );
}