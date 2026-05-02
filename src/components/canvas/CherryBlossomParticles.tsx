'use client';
import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useStoryStore } from '@/store/useStoryStore';
import { BufferGeometryUtils } from 'three/examples/jsm/Addons.js';

useGLTF.preload('/petal-optimized.glb');
useGLTF.preload('/petal2-optimized.glb');
useGLTF.preload('/flower-optimized.glb');

const COUNT_A = 700;
const COUNT_B = 700;
const COUNT_C = 100;
const COUNT = COUNT_A + COUNT_B + COUNT_C;

const BASE_SCALE_A = 0.4;
const BASE_SCALE_B = 0.4;
const BASE_SCALE_C = 0.65;

const RANGE_A_END = COUNT_A;
const RANGE_B_END = COUNT_A + COUNT_B;

// Z fade band — no hard wall, smoothly scale to 0 before hitting the camera lens
const Z_FADE_START = 6.0;
const Z_FADE_END = 9.0;

const SPAWN_WIDTH = 46;
const SPAWN_DEPTH = 30;
const SPAWN_TOP = 20;
const KILL_Y = -18; // Dropped from -9 to account for deep-Z frustum visibility
const TWO_PI = Math.PI * 2;

const FIELDS = 22;
const state = new Float32Array(COUNT * FIELDS);

const PX = 0, PY = 1, PZ = 2, RX = 3, RY = 4, RZ = 5, DEPTH = 6,
  FALLF = 7, DRIFTFX = 8, DRIFTFZ = 9, DRIFTPX = 10, DRIFTPZ = 11,
  FLUTF = 12, FLUTA = 13, FLUTP = 14,
  SPIRF = 15, SPIRR = 16, SPIRP = 17,
  WOBF = 18, WOBP = 19, TRBF = 20, TRBP = 21;

function spawn(base: number, y?: number): void {
  const depth = Math.random();
  const s = base;
  state[s + PX] = (Math.random() - 0.5) * SPAWN_WIDTH;
  state[s + PY] = y !== undefined ? y : KILL_Y + Math.random() * (SPAWN_TOP - KILL_Y);
  state[s + PZ] = -22 + depth * SPAWN_DEPTH;
  state[s + RX] = Math.random() * TWO_PI;
  state[s + RY] = Math.random() * TWO_PI;
  state[s + RZ] = Math.random() * TWO_PI;
  state[s + DEPTH] = depth;
  state[s + FALLF] = 0.28 + depth * 0.58 + Math.random() * 0.28;
  state[s + DRIFTFX] = 0.10 + Math.random() * 0.24;
  state[s + DRIFTFZ] = 0.08 + Math.random() * 0.18;
  state[s + DRIFTPX] = Math.random() * TWO_PI;
  state[s + DRIFTPZ] = Math.random() * TWO_PI;
  state[s + FLUTF] = 0.80 + Math.random() * 2.40;
  state[s + FLUTA] = 0.16 + Math.random() * 0.38;
  state[s + FLUTP] = Math.random() * TWO_PI;
  state[s + SPIRF] = 0.12 + Math.random() * 0.30;
  state[s + SPIRR] = 0.20 + Math.random() * 0.72;
  state[s + SPIRP] = Math.random() * TWO_PI;
  state[s + WOBF] = 1.10 + Math.random() * 3.0;
  state[s + WOBP] = Math.random() * TWO_PI;
  state[s + TRBF] = 0.90 + Math.random() * 2.6;
  state[s + TRBP] = Math.random() * TWO_PI;
}

for (let i = 0; i < COUNT; i++) spawn(i * FIELDS);

const instanceScale = new Float32Array(COUNT);
for (let i = 0; i < COUNT; i++) {
  const depth = state[i * FIELDS + DEPTH];
  const parallax = 0.55 + depth * 0.65;
  if (i < RANGE_A_END) instanceScale[i] = BASE_SCALE_A * parallax;
  else if (i < RANGE_B_END) instanceScale[i] = BASE_SCALE_B * parallax;
  else instanceScale[i] = BASE_SCALE_C * parallax;
}

const _dummy = new THREE.Object3D();
const _euler = new THREE.Euler();
const _quat = new THREE.Quaternion();
const _pos = new THREE.Vector3();
const _scale = new THREE.Vector3();

const smoothstep = (x: number) => x * x * (3 - 2 * x);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

// Gentle spring breeze math 
let _wx = 0, _wz = 0;
function updateWind(t: number): void {
  _wx = 0.22
    + 0.25 * Math.sin(t * 1.09 + 0.62)
    + 0.12 * Math.sin(t * 2.87 + 2.05)
    + 0.05 * Math.sin(t * 5.94 + 4.31);
  _wz = 0.06 * Math.sin(t * 0.83 + 1.25)
    + 0.03 * Math.sin(t * 3.10 + 0.88);
}

// Organic plant-tissue material — fully matte, no glass/transmission rendering
function extractGeoMat(scene: THREE.Group): {
  geometry: THREE.BufferGeometry | null;
  material: THREE.MeshStandardMaterial | null;
} {
  const geometries: THREE.BufferGeometry[] = [];
  let sourceMap: THREE.Texture | null = null;
  let found = false;

  scene.updateMatrixWorld(true);
  scene.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh;
      const geom = mesh.geometry.clone();
      geom.applyMatrix4(mesh.matrixWorld);
      geometries.push(geom);

      if (!found) {
        found = true;
        const src = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
        if (src instanceof THREE.MeshStandardMaterial) {
          sourceMap = src.map;
        }
      }
    }
  });

  const mergedGeo = geometries.length > 0
    ? BufferGeometryUtils.mergeGeometries(geometries, false)
    : null;

  if (!mergedGeo) return { geometry: null, material: null };

  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xf9c8d8),
    map: sourceMap,
    roughness: 0.85,  // Velvety organic finish
    metalness: 0.0,
    emissive: new THREE.Color(0xe07a9c), // Fake subsurface scattering
    emissiveIntensity: 0.15,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  return { geometry: mergedGeo, material };
}

export default function CherryBlossomParticles() {
  const meshRefA = useRef<THREE.InstancedMesh>(null);
  const meshRefB = useRef<THREE.InstancedMesh>(null);
  const meshRefC = useRef<THREE.InstancedMesh>(null);

  const { scene: sceneA } = useGLTF('/petal-optimized.glb');
  const { scene: sceneB } = useGLTF('/petal2-optimized.glb');
  const { scene: sceneC } = useGLTF('/flower-optimized.glb');

  const { geometry: geoA, material: matA } = useMemo(() => extractGeoMat(sceneA), [sceneA]);
  const { geometry: geoB, material: matB } = useMemo(() => extractGeoMat(sceneB), [sceneB]);
  const { geometry: geoC, material: matC } = useMemo(() => extractGeoMat(sceneC), [sceneC]);

  useEffect(() => {
    if (meshRefA.current) meshRefA.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    if (meshRefB.current) meshRefB.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    if (meshRefC.current) meshRefC.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  }, [geoA, geoB, geoC]);

  const elapsedRef = useRef(0);

  useFrame((_, delta) => {
    const mA = meshRefA.current;
    const mB = meshRefB.current;
    const mC = meshRefC.current;
    if (!mA || !mB || !mC) return;

    const dt = Math.min(delta, 0.05);
    elapsedRef.current += dt;
    const t = elapsedRef.current;
    const prog = useStoryStore.getState().scrollProgress;

    const intensityT = clamp01((prog - 0.40) / 0.15);
    const intensity = smoothstep(intensityT);
    const targetOp = intensity * 0.90;

    // Fade in, then lock into solid depth writing to prevent X-ray bleed
    const DEPTH_WRITE_THRESHOLD = 0.15;
    ([matA, matB, matC] as THREE.MeshStandardMaterial[]).forEach((m) => {
      if (!m) return;
      const prev = m.opacity;
      m.opacity = prev + (targetOp - prev) * Math.min(1, dt * 2.8);
      const shouldWriteDepth = m.opacity >= DEPTH_WRITE_THRESHOLD;
      if (m.depthWrite !== shouldWriteDepth) {
        m.depthWrite = shouldWriteDepth;
        m.needsUpdate = true;
      }
    });

    updateWind(t);

    for (let i = 0; i < COUNT; i++) {
      const s = i * FIELDS;

      const fallSpeed = state[s + FALLF] * (0.12 + intensity * 0.88);
      state[s + PY] -= fallSpeed * dt;

      const spirAngle = t * state[s + SPIRF] + state[s + SPIRP];
      const prevSpiA = spirAngle - state[s + SPIRF] * dt;
      state[s + PX] += (Math.sin(spirAngle) - Math.sin(prevSpiA)) * state[s + SPIRR] * intensity;
      state[s + PZ] += (Math.cos(spirAngle) - Math.cos(prevSpiA)) * state[s + SPIRR] * 0.35 * intensity;

      const prevDx = Math.sin((t - dt) * state[s + DRIFTFX] + state[s + DRIFTPX]);
      const currDx = Math.sin(t * state[s + DRIFTFX] + state[s + DRIFTPX]);
      state[s + PX] += (currDx - prevDx) * 0.65 * intensity;

      const prevDz = Math.cos((t - dt) * state[s + DRIFTFZ] + state[s + DRIFTPZ]);
      const currDz = Math.cos(t * state[s + DRIFTFZ] + state[s + DRIFTPZ]);
      state[s + PZ] += (currDz - prevDz) * 0.38 * intensity;

      state[s + PX] += _wx * dt * 0.80 * intensity;
      state[s + PZ] += _wz * dt * 0.40 * intensity;

      const turbX = Math.sin(t * state[s + TRBF] + state[s + TRBP])
        * Math.cos(t * state[s + TRBF] * 1.38 + state[s + TRBP] + 1.07);
      state[s + PX] += turbX * 0.10 * dt * intensity;

      state[s + RZ] = Math.sin(t * state[s + FLUTF] + state[s + FLUTP]) * state[s + FLUTA];
      state[s + RX] += (0.32 + state[s + DEPTH] * 0.28 + Math.sin(t * state[s + WOBF] + state[s + WOBP]) * 0.14) * dt;
      state[s + RY] += (0.18 + _wx * 0.055) * dt;

      if (state[s + PY] < KILL_Y) {
        spawn(s, SPAWN_TOP + Math.random() * 5);
      }

      // Smooth scale-to-zero from Z=6 → Z=9
      const pz = state[s + PZ];
      let proxScale = instanceScale[i];
      if (pz > Z_FADE_START) {
        const t01 = clamp01((pz - Z_FADE_START) / (Z_FADE_END - Z_FADE_START));
        proxScale *= 1.0 - smoothstep(t01);
      }

      _pos.set(state[s + PX], state[s + PY], state[s + PZ]);
      _euler.set(state[s + RX], state[s + RY], state[s + RZ], 'XYZ');
      _quat.setFromEuler(_euler);
      _scale.setScalar(proxScale);
      _dummy.matrix.compose(_pos, _quat, _scale);

      if (i < RANGE_A_END) {
        mA.setMatrixAt(i, _dummy.matrix);
      } else if (i < RANGE_B_END) {
        mB.setMatrixAt(i - COUNT_A, _dummy.matrix);
      } else {
        mC.setMatrixAt(i - RANGE_B_END, _dummy.matrix);
      }
    }

    mA.instanceMatrix.needsUpdate = true;
    mB.instanceMatrix.needsUpdate = true;
    mC.instanceMatrix.needsUpdate = true;
  });

  if (!geoA || !matA || !geoB || !matB || !geoC || !matC) return null;

  return (
    <>
      <Environment preset="city" background={false} environmentIntensity={0.6} />
      <instancedMesh ref={meshRefA} args={[geoA, matA, COUNT_A]} frustumCulled={false} castShadow={false} receiveShadow={false} />
      <instancedMesh ref={meshRefB} args={[geoB, matB, COUNT_B]} frustumCulled={false} castShadow={false} receiveShadow={false} />
      <instancedMesh ref={meshRefC} args={[geoC, matC, COUNT_C]} frustumCulled={false} castShadow={false} receiveShadow={false} />
    </>
  );
}