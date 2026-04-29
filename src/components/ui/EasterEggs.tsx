'use client';
import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useSpring, useTransform, MotionValue } from 'framer-motion';
import { useStoryStore } from '@/store/useStoryStore';

// ─────────────────────────────────────────────────────────────
//  Design constants — tuned to sync with cherry blossom onset
//  CherryBlossomParticles: intensityT = clamp01((p - 0.38) / 0.22)
//  Full blossom at p ≈ 0.60, EasterEggs trigger at p > 0.80
// ─────────────────────────────────────────────────────────────
const SPRING_APPEAR = 0.95; // matches PromisePlanting
const SPRING_FULL = 0.88; // fully saturated at this point

// Sky palette mirror (CSS) — must match Scene.tsx SKY_STOPS
// at progress > 0.80 sky is firmly in blossom/spring territory
// We derive CSS vars here so the UI syncs with the WebGL sky.
const SPRING_BG_TINT = 'rgba(252, 233, 240, 0.72)'; // ~#fce9f0 at 72%

// ─────────────────────────────────────────────────────────────
//  Data
// ─────────────────────────────────────────────────────────────
interface Destination {
  emoji: string;
  name: string;
  sub: string;    // subtle descriptor that appears on hover
  hue: number;    // accent hue for card glow (HSL)
  delay: number;  // stagger offset (seconds)
  rotate: number; // resting tilt
}

const DESTINATIONS: Destination[] = [
  { emoji: '🇯🇵', name: 'Japan', sub: 'Cherry blossom season', hue: 340, delay: 0.00, rotate: -3 },
  { emoji: '🇰🇷', name: 'South Korea', sub: 'Lotte World & Han River', hue: 210, delay: 0.12, rotate: 4 },
  { emoji: '🇫🇷', name: 'Paris', sub: 'Café au lait & the Louvre', hue: 30, delay: 0.24, rotate: -2 },
  { emoji: '🇨🇭', name: 'Switzerland', sub: 'Alps & fondue for two', hue: 120, delay: 0.36, rotate: 3 },
];

interface Treat {
  label: string;
  icon: string;   // emoji fallback
  color: string;  // chocolate shell colour
  sheen: string;  // specular highlight colour
  delay: number;
}

const TREATS: Treat[] = [
  { label: 'Cookies & Cream', icon: '🍪', color: '#2a1e14', sheen: '#c8a87a', delay: 0.10 },
  { label: 'Kinder Bueno', icon: '🍫', color: '#3b1f0a', sheen: '#d4a86c', delay: 0.22 },
  { label: 'Ferrero Rocher', icon: '✨', color: '#4a2e08', sheen: '#d4af37', delay: 0.34 },
  { label: 'Kinder Joy', icon: '🥚', color: '#c5340a', sheen: '#f4a261', delay: 0.46 },
];

// ─────────────────────────────────────────────────────────────
//  Smooth scroll-progress → CSS value bridge
//  Reads from Zustand 60fps and feeds a spring
// ─────────────────────────────────────────────────────────────
function useScrollProgress(): MotionValue<number> {
  const mv = useSpring(0, { stiffness: 80, damping: 20, mass: 0.6 });
  useEffect(() => {
    let raf: number;
    const tick = () => {
      mv.set(useStoryStore.getState().scrollProgress);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mv]);
  return mv;
}

// ─────────────────────────────────────────────────────────────
//  3-D tilt card hook
//  Returns { ref, style } — attach to the outer div
// ─────────────────────────────────────────────────────────────
function useTilt3D(strength = 18) {
  const ref = useRef<HTMLDivElement>(null);
  const rotX = useSpring(0, { stiffness: 260, damping: 28 });
  const rotY = useSpring(0, { stiffness: 260, damping: 28 });
  const glowX = useSpring(50, { stiffness: 260, damping: 28 });
  const glowY = useSpring(50, { stiffness: 260, damping: 28 });
  const scale = useSpring(1, { stiffness: 300, damping: 26 });

  const onMove = useCallback((e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5; // -0.5 → 0.5
    const ny = (e.clientY - r.top) / r.height - 0.5;
    rotX.set(-ny * strength);
    rotY.set(nx * strength);
    glowX.set(50 + nx * 60);
    glowY.set(50 + ny * 60);
  }, [rotX, rotY, glowX, glowY, strength]);

  const onEnter = useCallback(() => scale.set(1.06), [scale]);
  const onLeave = useCallback(() => {
    rotX.set(0); rotY.set(0);
    glowX.set(50); glowY.set(50);
    scale.set(1);
  }, [rotX, rotY, glowX, glowY, scale]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener('mousemove', onMove as EventListener);
    el.addEventListener('mouseenter', onEnter as EventListener);
    el.addEventListener('mouseleave', onLeave as EventListener);
    return () => {
      el.removeEventListener('mousemove', onMove as EventListener);
      el.removeEventListener('mouseenter', onEnter as EventListener);
      el.removeEventListener('mouseleave', onLeave as EventListener);
    };
  }, [onMove, onEnter, onLeave]);

  // Build the transform string as a MotionValue
  const transform = useTransform(
    [rotX, rotY, scale] as MotionValue<number>[],
    ([rx, ry, sc]: number[]) =>
      `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${sc})`,
  );

  return { ref, transform, glowX, glowY };
}

// ─────────────────────────────────────────────────────────────
//  Polaroid card — 3-D tilt + spring mount
// ─────────────────────────────────────────────────────────────
function PolaroidCard({ d, visible }: { d: Destination; visible: boolean }) {
  const { ref, transform, glowX, glowY } = useTilt3D(16);

  const glowBg = useTransform(
    [glowX, glowY] as MotionValue<number>[],
    ([gx, gy]: number[]) =>
      `radial-gradient(circle at ${gx}% ${gy}%, hsla(${d.hue},80%,80%,0.35) 0%, transparent 70%)`,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -36, rotate: d.rotate - 4, scale: 0.88 }}
      animate={visible
        ? { opacity: 1, y: 0, rotate: d.rotate, scale: 1 }
        : { opacity: 0, y: -36, rotate: d.rotate - 4, scale: 0.88 }
      }
      transition={{
        delay: visible ? d.delay : 0,
        duration: 0.72,
        ease: [0.22, 1, 0.36, 1], // custom spring-like cubic — Apple's signature
      }}
      // pointer-events so the 3-D tilt works
      className="pointer-events-auto"
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* 3-D tilt wrapper */}
      <motion.div
        ref={ref}
        style={{ transform, transformStyle: 'preserve-3d' }}
        className="relative cursor-pointer select-none"
      >
        {/* ── Card body ── */}
        <div
          className="relative flex flex-col items-center gap-0 rounded-[3px] shadow-[0_12px_40px_-8px_rgba(0,0,0,0.22),0_2px_8px_rgba(0,0,0,0.10)]"
          style={{
            background: 'linear-gradient(160deg, #fdfbf6 0%, #f8f3ec 100%)',
            padding: '10px 10px 20px',
            border: '1px solid rgba(200,185,168,0.5)',
          }}
        >
          {/* Dynamic gloss layer */}
          <motion.div
            className="absolute inset-0 rounded-[3px] pointer-events-none z-10"
            style={{ background: glowBg }}
          />

          {/* Washi tape */}
          <div
            className="absolute -top-[10px] left-1/2 -translate-x-1/2 z-20"
            style={{
              width: 44, height: 20,
              background: `hsla(${d.hue}, 70%, 85%, 0.55)`,
              backdropFilter: 'blur(2px)',
              transform: `rotate(${d.rotate * -0.6}deg)`,
              boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
            }}
          />

          {/* Photo area */}
          <div
            className="relative overflow-hidden flex items-center justify-center"
            style={{
              width: 96, height: 112,
              background: `linear-gradient(135deg, hsla(${d.hue},40%,90%,0.6), hsla(${d.hue},30%,80%,0.4))`,
              boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.08)',
            }}
          >
            {/* Emoji */}
            <span
              className="text-[2.6rem] transition-transform duration-500 group-hover:scale-110"
              style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.18))' }}
            >
              {d.emoji}
            </span>

            {/* Inner vignette */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.08) 100%)',
              }}
            />
          </div>

          {/* Label */}
          <p
            className="mt-2 text-center font-playfair italic text-slate-700 leading-none"
            style={{ fontSize: 13, letterSpacing: '0.04em' }}
          >
            {d.name}
          </p>

          {/* Sub-label (fades in on hover) */}
          <p
            className="text-center text-slate-400 leading-none mt-[3px] transition-opacity duration-300"
            style={{ fontSize: 9, letterSpacing: '0.08em', opacity: 0.6 }}
          >
            {d.sub}
          </p>

          {/* Realistic paper edge highlight */}
          <div
            className="absolute inset-x-0 top-0 h-px rounded-t-[3px] pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)' }}
          />
        </div>

        {/* Cast shadow plane (z-translated back) */}
        <div
          className="absolute inset-x-2 -bottom-3 h-4 rounded-full pointer-events-none"
          style={{
            background: 'rgba(0,0,0,0.12)',
            filter: 'blur(8px)',
            transform: 'translateZ(-10px)',
          }}
        />
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Truffle — 3-D sphere with specular, rim, and label reveal
// ─────────────────────────────────────────────────────────────
function TruffleButton({ t, visible }: { t: Treat; visible: boolean }) {
  const [hovered, setHovered] = useState(false);
  const { ref, transform } = useTilt3D(22);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40, scale: 0.8 }}
      animate={visible
        ? { opacity: 1, x: 0, scale: 1 }
        : { opacity: 0, x: 40, scale: 0.8 }
      }
      transition={{
        delay: visible ? t.delay : 0,
        duration: 0.65,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="pointer-events-auto flex items-center justify-end gap-3 group cursor-pointer"
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      {/* Label — slides in from right on hover */}
      <motion.span
        initial={false}
        animate={{
          opacity: hovered ? 1 : 0,
          x: hovered ? 0 : 10,
          filter: hovered ? 'blur(0px)' : 'blur(4px)',
        }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="font-playfair italic text-slate-700 tracking-widest whitespace-nowrap"
        style={{ fontSize: 11, letterSpacing: '0.22em' }}
      >
        {t.label}
      </motion.span>

      {/* 3-D sphere */}
      <motion.div
        ref={ref}
        style={{ transform }}
        className="relative"
      >
        {/* Outer shell */}
        <div
          className="relative rounded-full flex items-center justify-center transition-shadow duration-300"
          style={{
            width: 38, height: 38,
            background: `radial-gradient(circle at 36% 32%, ${t.sheen} 0%, ${t.color} 55%, #0a0600 100%)`,
            boxShadow: hovered
              ? `0 0 0 1px ${t.sheen}55, 0 6px 20px ${t.color}88, 0 0 30px ${t.sheen}44`
              : `0 3px 10px ${t.color}66, 0 1px 3px rgba(0,0,0,0.4)`,
          }}
        >
          {/* Specular highlight — teardrop shaped */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 12, height: 8,
              top: 7, left: 9,
              background: `radial-gradient(ellipse, ${t.sheen}cc 0%, transparent 100%)`,
              transform: 'rotate(-30deg)',
              filter: 'blur(1px)',
            }}
          />

          {/* Secondary bounce light (bottom-right) */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 8, height: 6,
              bottom: 7, right: 7,
              background: `radial-gradient(ellipse, rgba(255,255,255,0.18) 0%, transparent 100%)`,
              filter: 'blur(1.5px)',
            }}
          />

          {/* Rim light ring */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 75% 75%, rgba(255,255,255,0.10) 0%, transparent 55%)',
            }}
          />

          {/* Gold rim border */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              boxShadow: `inset 0 0 0 1px ${t.sheen}33`,
            }}
          />
        </div>

        {/* Shadow disc */}
        <div
          className="absolute inset-x-1 -bottom-2 h-2 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(ellipse, ${t.color}55, transparent)`,
            filter: 'blur(4px)',
          }}
        />
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Ambient petal echo — small decorative petals that drift
//  across the EasterEggs layer, perfectly synced with the
//  CherryBlossomParticles intensity ramp (onset at p=0.38,
//  full at p=0.60).  These are pure CSS so they cost nothing.
// ─────────────────────────────────────────────────────────────
const ECHO_PETALS = Array.from({ length: 9 }, (_, i) => ({
  id: i,
  left: `${8 + i * 10.5}%`,
  delay: `${i * 0.55}s`,
  duration: `${3.8 + (i % 3) * 0.9}s`,
  size: 10 + (i % 4) * 5,
  hue: 338 + (i % 5) * 5,
}));

// ─────────────────────────────────────────────────────────────
//  Main component
// ─────────────────────────────────────────────────────────────
export default function EasterEggs() {
  const progress = useScrollProgress();
  const rawProgress = useStoryStore(s => s.scrollProgress);

  // Derive visibility as a boolean (avoids render on every frame)
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    // Subscribe to raw store — faster than React re-render
    return useStoryStore.subscribe(s => {
      setVisible(s.scrollProgress >= SPRING_APPEAR);
    });
  }, []);

  // ── Background tint opacity: 0 before SPRING_APPEAR, 1 at SPRING_FULL ──
  const overlayOpacity = useTransform(
    progress,
    [SPRING_APPEAR - 0.02, SPRING_FULL],
    [0, 1],
  );

  // ── Petal echo opacity syncs with CherryBlossomParticles ──
  // intensity = clamp01((p - 0.38) / 0.22) → full at 0.60
  const petalOpacity = useTransform(
    progress,
    [0.38, 0.60, SPRING_APPEAR],
    [0, 0.55, 0.85],
  );

  return (
    <>
      {/* ── Ambient CSS petal echoes ── */}
      <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
        <motion.div style={{ opacity: petalOpacity }} className="absolute inset-0">
          {ECHO_PETALS.map(p => (
            <div
              key={p.id}
              className="absolute top-0"
              style={{
                left: p.left,
                width: p.size,
                height: p.size * 1.55,
                animationName: 'petalDrift',
                animationDuration: p.duration,
                animationDelay: p.delay,
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite',
                animationFillMode: 'both',
              }}
            >
              <svg viewBox="0 0 40 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                <path
                  d="M20 62 C6 46 4 14 20 2 C36 14 34 46 20 62Z"
                  fill={`hsla(${p.hue}, 80%, 88%, 0.72)`}
                />
                <path
                  d="M20 62 C6 46 4 14 20 2 C36 14 34 46 20 62Z"
                  stroke={`hsla(${p.hue}, 70%, 75%, 0.30)`}
                  strokeWidth="0.5"
                  fill="none"
                />
                {/* Centre vein */}
                <path
                  d="M20 58 Q20 32 20 6"
                  stroke={`hsla(${p.hue}, 50%, 68%, 0.22)`}
                  strokeWidth="0.6"
                  fill="none"
                />
              </svg>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Main UI layer ── */}
      <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden">
        {/* Warm spring tint that syncs with the WebGL sky at p≈0.80+ */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: overlayOpacity,
            background: `radial-gradient(ellipse 90% 70% at 50% 110%, ${SPRING_BG_TINT} 0%, transparent 80%)`,
          }}
        />

        {/* ── Polaroid grid — 2×2 corners ── */}
        <div className="absolute inset-x-0 top-0 flex justify-between items-start px-4 md:px-10 pt-6">
          {/* Top-left: Japan */}
          <PolaroidCard d={DESTINATIONS[0]} visible={visible} />
          {/* Top-right: South Korea */}
          <PolaroidCard d={DESTINATIONS[1]} visible={visible} />
        </div>

        <div
          className="absolute inset-x-0 flex justify-between items-end px-4 md:px-10"
          style={{ bottom: 80 }}
        >
          {/* Bottom-left group: Paris + Switzerland */}
          <div className="flex gap-3 md:gap-5 items-end">
            <PolaroidCard d={DESTINATIONS[2]} visible={visible} />
            <div className="hidden md:block">
              <PolaroidCard d={DESTINATIONS[3]} visible={visible} />
            </div>
          </div>

          {/* Bottom-right: Truffles column */}
          <div className="flex flex-col gap-[10px] items-end">
            {TREATS.map(t => (
              <TruffleButton key={t.label} t={t} visible={visible} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Keyframe injection ── */}
      <style>{`
        @keyframes petalDrift {
          0%   { transform: translateY(-20px) rotate(0deg)   translateX(0px);   opacity: 0; }
          8%   { opacity: 1; }
          50%  { transform: translateY(50vh)  rotate(180deg) translateX(18px);  opacity: 0.75; }
          92%  { opacity: 0.4; }
          100% { transform: translateY(102vh) rotate(340deg) translateX(-8px);  opacity: 0; }
        }
      `}</style>
    </>
  );
}