'use client';
import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStoryStore } from '@/store/useStoryStore';

// ─────────────────────────────────────────────
//  Procedural petal texture
//  512×512, pink with translucent venation,
//  soft SSS-like glow and a specular sheen
// ─────────────────────────────────────────────
function createPetalTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // ── Petal base shape (tear-drop, wider at top) ──
  ctx.clearRect(0, 0, size, size);

  const cx = size / 2;

  // Filled petal form
  ctx.beginPath();
  ctx.moveTo(cx, size * 0.92);           // tip at bottom
  ctx.bezierCurveTo(                     // left edge
    cx - size * 0.38, size * 0.70,
    cx - size * 0.44, size * 0.22,
    cx, size * 0.06
  );
  ctx.bezierCurveTo(                     // right edge
    cx + size * 0.44, size * 0.22,
    cx + size * 0.38, size * 0.70,
    cx, size * 0.92
  );
  ctx.closePath();

  // Base fill — SSS-like pink gradient (light at centre, deeper at edges)
  const baseGrad = ctx.createRadialGradient(cx, size * 0.38, 0, cx, size * 0.5, size * 0.52);
  baseGrad.addColorStop(0.00, 'rgba(255, 240, 245, 0.98)');  // pale centre
  baseGrad.addColorStop(0.30, 'rgba(255, 192, 210, 0.95)');  // warm mid
  baseGrad.addColorStop(0.65, 'rgba(240, 148, 175, 0.90)');  // deeper pink
  baseGrad.addColorStop(1.00, 'rgba(210,  90, 130, 0.70)');  // edge
  ctx.fillStyle = baseGrad;
  ctx.fill();

  // ── Venation lines (centre vein + 3 pairs of laterals) ──
  ctx.save();
  ctx.clip(); // keep veins inside petal
  ctx.strokeStyle = 'rgba(230, 100, 140, 0.18)';
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';

  // Centre vein
  ctx.beginPath();
  ctx.moveTo(cx, size * 0.92);
  ctx.quadraticCurveTo(cx, size * 0.48, cx, size * 0.10);
  ctx.stroke();

  // Lateral veins
  const laterals = [
    { t: 0.55, spread: 0.22 },
    { t: 0.38, spread: 0.18 },
    { t: 0.24, spread: 0.12 },
  ];
  for (const { t, spread } of laterals) {
    const py = size * (0.92 - t * 0.82);
    const qy = py - size * 0.12;
    // left
    ctx.beginPath();
    ctx.moveTo(cx, py);
    ctx.quadraticCurveTo(cx - size * spread * 0.7, qy, cx - size * spread, py - size * 0.06);
    ctx.stroke();
    // right
    ctx.beginPath();
    ctx.moveTo(cx, py);
    ctx.quadraticCurveTo(cx + size * spread * 0.7, qy, cx + size * spread, py - size * 0.06);
    ctx.stroke();
  }
  ctx.restore();

  // ── Specular highlight — upper-left, soft ──
  ctx.save();
  // Re-clip to petal
  ctx.beginPath();
  ctx.moveTo(cx, size * 0.92);
  ctx.bezierCurveTo(cx - size * 0.38, size * 0.70, cx - size * 0.44, size * 0.22, cx, size * 0.06);
  ctx.bezierCurveTo(cx + size * 0.44, size * 0.22, cx + size * 0.38, size * 0.70, cx, size * 0.92);
  ctx.closePath();
  ctx.clip();

  const spec = ctx.createRadialGradient(cx * 0.72, size * 0.22, 0, cx * 0.72, size * 0.22, size * 0.20);
  spec.addColorStop(0.0, 'rgba(255, 255, 255, 0.45)');
  spec.addColorStop(0.4, 'rgba(255, 255, 255, 0.12)');
  spec.addColorStop(1.0, 'rgba(255, 255, 255, 0.00)');
  ctx.fillStyle = spec;
  ctx.fillRect(0, 0, size, size);
  ctx.restore();

  // ── Rim light on right edge — mimics translucency ──
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, size * 0.92);
  ctx.bezierCurveTo(cx - size * 0.38, size * 0.70, cx - size * 0.44, size * 0.22, cx, size * 0.06);
  ctx.bezierCurveTo(cx + size * 0.44, size * 0.22, cx + size * 0.38, size * 0.70, cx, size * 0.92);
  ctx.closePath();
  ctx.clip();

  const rim = ctx.createLinearGradient(cx - size * 0.5, 0, cx + size * 0.5, 0);
  rim.addColorStop(0.0, 'rgba(255, 210, 225, 0.0)');
  rim.addColorStop(0.78, 'rgba(255, 210, 225, 0.0)');
  rim.addColorStop(0.92, 'rgba(255, 228, 240, 0.30)');
  rim.addColorStop(1.0, 'rgba(255, 240, 248, 0.0)');
  ctx.fillStyle = rim;
  ctx.fillRect(0, 0, size, size);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  tex.premultiplyAlpha = false;
  return tex;
}

// ─────────────────────────────────────────────
//  Per-petal state
// ─────────────────────────────────────────────
interface PetalPhysics {
  x: number; y: number; z: number;
  // Euler angles
  rx: number; ry: number; rz: number;
  // Angular velocities
  vrx: number; vry: number; vrz: number;
  // Scale
  scale: number;
  // Fall / drift
  fallSpeed: number;
  // Swirl / drift orbit
  orbitFreq: number;
  orbitAmp: number;
  orbitPhase: number;
  // Pendulum rock (realistic flutter)
  pendulumFreq: number;
  pendulumAmp: number;
  pendulumPhase: number;
  // Lateral drift wave
  driftFreq: number;
  driftAmp: number;
  driftPhase: number;
  // Depth (z-layer for parallax)
  depthLayer: number; // 0 (far) → 1 (near)
}

function buildPetalPhysics(count: number): PetalPhysics[] {
  const arr: PetalPhysics[] = [];
  for (let i = 0; i < count; i++) {
    const depthLayer = Math.random();
    const scale = 0.06 + depthLayer * 0.14 + Math.random() * 0.06; // near → bigger
    arr.push({
      x: (Math.random() - 0.5) * 44,
      y: -5 + Math.random() * 22,
      z: -12 + depthLayer * 22,
      rx: Math.random() * Math.PI * 2,
      ry: Math.random() * Math.PI * 2,
      rz: Math.random() * Math.PI * 2,
      vrx: (Math.random() - 0.5) * 0.8,
      vry: (Math.random() - 0.5) * 1.2,
      vrz: (Math.random() - 0.5) * 0.6,
      scale,
      fallSpeed: 0.30 + scale * 4.5 + Math.random() * 0.5,
      orbitFreq: 0.15 + Math.random() * 0.35,
      orbitAmp: 0.30 + Math.random() * 0.90,
      orbitPhase: Math.random() * Math.PI * 2,
      pendulumFreq: 1.0 + Math.random() * 2.0,
      pendulumAmp: 0.18 + Math.random() * 0.35,
      pendulumPhase: Math.random() * Math.PI * 2,
      driftFreq: 0.20 + Math.random() * 0.50,
      driftAmp: 0.15 + Math.random() * 0.45,
      driftPhase: Math.random() * Math.PI * 2,
      depthLayer,
    });
  }
  return arr;
}

// ─────────────────────────────────────────────
//  Helper
// ─────────────────────────────────────────────
const smoothstep = (x: number) => x * x * (3 - 2 * x);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

const _mat4 = new THREE.Matrix4();
const _euler = new THREE.Euler();
const _quat = new THREE.Quaternion();
const _pos = new THREE.Vector3();
const _scl = new THREE.Vector3();
const _color = new THREE.Color();

// ─────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────
export default function CherryBlossomParticles({ count = 600 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const physRef = useRef<PetalPhysics[]>(buildPetalPhysics(count));

  const petalTexture = useMemo(() => {
    if (typeof document !== 'undefined') return createPetalTexture();
    return null;
  }, []);

  // ── Geometry — a gentle curved quad (PlaneGeometry, slightly bent) ──
  // We bend it in a shader for the cupped-petal look.
  const geometry = useMemo(() => {
    // High-res plane so the vertex shader can curve it
    const g = new THREE.PlaneGeometry(1, 1.6, 6, 10);
    // Bend the plane into a shallow cup along Y
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const lx = pos.getX(i);          // -0.5 → 0.5
      const ly = pos.getY(i);          // -0.8 → 0.8
      // Cup depth: max at centre, zero at edges
      const cup = 0.06 * Math.cos(lx * Math.PI);
      pos.setZ(i, cup + 0.012 * (ly * ly)); // slight longitudinal bow
    }
    pos.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, []);

  // ── Per-instance colour buffer for subtle tint variety ──
  const colorBuffer = useMemo(() => {
    const buf = new Float32Array(count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      // Hue between 340°–355° (pink), saturation 0.55–0.75, lightness 0.75–0.92
      c.setHSL(
        (340 + Math.random() * 15) / 360,
        0.55 + Math.random() * 0.20,
        0.75 + Math.random() * 0.17,
      );
      buf[i * 3] = c.r;
      buf[i * 3 + 1] = c.g;
      buf[i * 3 + 2] = c.b;
    }
    return buf;
  }, [count]);

  // ── Material — custom shader for SSS + backface translucency ──
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      u_map: { value: petalTexture },
      u_opacity: { value: 0.0 },
      u_light: { value: new THREE.Vector3(0.6, 1.0, 0.5).normalize() },
    },
    vertexShader: /* glsl */`
      attribute vec3 instanceColor;
      varying   vec2 vUv;
      varying   vec3 vNormal;
      varying   vec3 vWorldNormal;
      varying   vec3 vInstanceColor;

      void main() {
        vUv            = uv;
        vInstanceColor = instanceColor;

        // Transform normal properly through instance matrix
        mat3 normalMat = mat3(instanceMatrix);
        vNormal      = normalize(normalMatrix * normalMat * normal);
        vWorldNormal = normalize(normalMat * normal);

        vec4 worldPos = instanceMatrix * vec4(position, 1.0);
        gl_Position   = projectionMatrix * modelViewMatrix * worldPos;
      }
    `,
    fragmentShader: /* glsl */`
      uniform sampler2D u_map;
      uniform float     u_opacity;
      uniform vec3      u_light;

      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vWorldNormal;
      varying vec3 vInstanceColor;

      void main() {
        vec4 texCol = texture2D(u_map, vUv);
        if (texCol.a < 0.04) discard;

        // ── Lambert diffuse (front face) ──
        float ndotl = max(0.0, dot(vNormal, u_light));

        // ── SSS approximation: back-lit translucency ──
        // When the light hits the back of the petal, it glows through
        float backLight = max(0.0, dot(-vNormal, u_light));
        float sss       = pow(backLight, 3.0) * 0.55;

        // ── Rim (translucent edge glow) ──
        // Use UV to compute edge distance on the petal shape
        float edgeDist = min(vUv.x, 1.0 - vUv.x) * 2.0; // 0 at edge, 1 at centre
        float rim      = (1.0 - smoothstep(0.0, 0.25, edgeDist)) * 0.30;

        // ── Combine ──
        vec3 ambient = vInstanceColor * 0.35;
        vec3 diffuse = vInstanceColor * ndotl * 0.55;
        vec3 sssCol  = vec3(1.0, 0.75, 0.82) * sss;      // warm pink SSS
        vec3 rimCol  = vec3(1.0, 0.88, 0.92) * rim;

        vec3 finalColor = (ambient + diffuse + sssCol + rimCol) * texCol.rgb;

        // Slightly boost saturation for pop
        float luma = dot(finalColor, vec3(0.2126, 0.7152, 0.0722));
        finalColor = mix(vec3(luma), finalColor, 1.18);

        gl_FragColor = vec4(finalColor, texCol.a * u_opacity);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.NormalBlending,
  }), [petalTexture]);

  // ── Attach per-instance colour attribute ──
  useEffect(() => {
    if (!meshRef.current) return;
    const attr = new THREE.InstancedBufferAttribute(colorBuffer, 3);
    meshRef.current.geometry.setAttribute('instanceColor', attr);
  }, [colorBuffer]);

  // ── Timer ──
  const [timer] = useState(() => new THREE.Timer());
  useEffect(() => {
    if (typeof document !== 'undefined') timer.connect(document);
    return () => { timer.dispose?.(); };
  }, [timer]);

  // ─────────────────────────────────────────
  //  Frame loop
  // ─────────────────────────────────────────
  useFrame(() => {
    timer.update();
    const delta = Math.min(timer.getDelta(), 0.05);
    const elapsed = timer.getElapsed();
    const progress = useStoryStore.getState().scrollProgress;

    if (!meshRef.current) return;

    // Intensity: blossoms arrive during / after the winter-spring transition
    // 0 before 0.38, ramp to 1 at 0.60, stay full
    const intensityT = clamp01((progress - 0.38) / 0.22);
    const intensity = smoothstep(intensityT);

    // Opacity: fade in over same window, stay full through end
    const targetOpacity = intensity * 0.92;
    const curOp = (material.uniforms.u_opacity.value as number);
    material.uniforms.u_opacity.value = curOp + (targetOpacity - curOp) * Math.min(1, delta * 2.5);

    const phys = physRef.current;

    for (let i = 0; i < count; i++) {
      const p = phys[i];

      // ── Fall ──
      p.y -= p.fallSpeed * delta * (0.15 + intensity * 0.85);

      // ── Orbital drift (helical descent) ──
      const orb = elapsed * p.orbitFreq + p.orbitPhase;
      p.x += Math.sin(orb) * p.orbitAmp * delta * (0.5 + intensity * 0.5);
      p.z += Math.cos(orb) * p.orbitAmp * 0.35 * delta * (0.5 + intensity * 0.5);

      // ── Lateral wave (chaotic cross-wind) ──
      const driftPrev = Math.sin((elapsed - delta) * p.driftFreq + p.driftPhase);
      const driftCurr = Math.sin(elapsed * p.driftFreq + p.driftPhase);
      p.x += (driftCurr - driftPrev) * p.driftAmp;

      // ── Pendulum rock — drives realistic flutter in rz ──
      const pendulum = Math.sin(elapsed * p.pendulumFreq + p.pendulumPhase) * p.pendulumAmp;

      // ── Rotation ──
      p.rx += p.vrx * delta;
      p.ry += p.vry * delta;
      p.rz = pendulum;  // rz controlled by pendulum, overrides free spin

      // Slight air-resistance damping on free axes
      p.vrx *= 0.9985;
      p.vry *= 0.9985;

      // ── Reset ──
      if (p.y < -7) {
        p.y = 17 + Math.random() * 5;
        p.x = (Math.random() - 0.5) * 44;
        p.z = -12 + p.depthLayer * 22;
        // Re-randomise angles on spawn
        p.rx = Math.random() * Math.PI * 2;
        p.ry = Math.random() * Math.PI * 2;
        p.vrx = (Math.random() - 0.5) * 0.8;
        p.vry = (Math.random() - 0.5) * 1.2;
      }

      // ── Build instance matrix ──
      _euler.set(p.rx, p.ry, p.rz, 'XYZ');
      _quat.setFromEuler(_euler);
      _pos.set(p.x, p.y, p.z);
      _scl.setScalar(p.scale);
      _mat4.compose(_pos, _quat, _scl);
      meshRef.current.setMatrixAt(i, _mat4);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
    />
  );
}