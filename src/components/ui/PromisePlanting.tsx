'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useSpring, useTransform, MotionValue } from 'framer-motion';
import { useStoryStore } from '@/store/useStoryStore';

// ─────────────────────────────────────────────────────────────
//  Spring easing curve — Apple's signature feel
// ─────────────────────────────────────────────────────────────
const APPLE_EASE = [0.22, 1, 0.36, 1] as const;
const SPRING_SOFT = { stiffness: 80, damping: 20, mass: 0.8 };

// ─────────────────────────────────────────────────────────────
//  Per-promise ambient palette
//  Each promise has its own bloom color + glow tint
//  These sync with the cherry blossom / spring scene colors
// ─────────────────────────────────────────────────────────────
interface PromisePalette {
  bloom: string;        // radial bloom behind text
  glow: string;         // text glow (drop-shadow)
  seedCore: string;     // seed button inner gradient
  seedRim: string;      // seed button specular rim
  particle: string;     // burst particle color
}

const PALETTES: PromisePalette[] = [
  {
    bloom: 'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(255,220,235,0.80) 0%, rgba(255,180,210,0.30) 55%, transparent 100%)',
    glow: '0px 0px 30px rgba(255,160,200,0.55), 0px 4px 20px rgba(220,80,130,0.30)',
    seedCore: 'linear-gradient(135deg, #f9a8c9 0%, #e85d8a 100%)',
    seedRim: 'rgba(255,240,248,0.90)',
    particle: '#f4b8d4',
  },
  {
    bloom: 'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(220,235,255,0.80) 0%, rgba(180,210,255,0.30) 55%, transparent 100%)',
    glow: '0px 0px 30px rgba(160,200,255,0.55), 0px 4px 20px rgba(80,130,220,0.30)',
    seedCore: 'linear-gradient(135deg, #a8c8f9 0%, #5d8ae8 100%)',
    seedRim: 'rgba(240,248,255,0.90)',
    particle: '#b8d4f4',
  },
  {
    bloom: 'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(235,220,255,0.80) 0%, rgba(210,180,255,0.30) 55%, transparent 100%)',
    glow: '0px 0px 30px rgba(200,160,255,0.55), 0px 4px 20px rgba(130,80,220,0.30)',
    seedCore: 'linear-gradient(135deg, #c8a8f9 0%, #8a5de8 100%)',
    seedRim: 'rgba(248,240,255,0.90)',
    particle: '#d4b8f4',
  },
  {
    bloom: 'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(220,255,235,0.80) 0%, rgba(180,255,210,0.30) 55%, transparent 100%)',
    glow: '0px 0px 30px rgba(160,255,200,0.55), 0px 4px 20px rgba(80,220,130,0.30)',
    seedCore: 'linear-gradient(135deg, #a8f9c8 0%, #5de88a 100%)',
    seedRim: 'rgba(240,255,248,0.90)',
    particle: '#b8f4d4',
  },
  {
    bloom: 'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(255,240,220,0.80) 0%, rgba(255,210,180,0.30) 55%, transparent 100%)',
    glow: '0px 0px 30px rgba(255,200,160,0.55), 0px 4px 20px rgba(220,130,80,0.30)',
    seedCore: 'linear-gradient(135deg, #f9c8a8 0%, #e88a5d 100%)',
    seedRim: 'rgba(255,248,240,0.90)',
    particle: '#f4d4b8',
  },
];

// ─────────────────────────────────────────────────────────────
//  Burst Particle — pure CSS/Framer, zero Three.js overhead
// ─────────────────────────────────────────────────────────────
interface BurstParticle {
  id: number;
  angle: number;
  distance: number;
  size: number;
  delay: number;
}

function generateBurst(count: number): BurstParticle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    angle: (360 / count) * i + (Math.random() - 0.5) * (360 / count),
    distance: 60 + Math.random() * 90,
    size: 4 + Math.random() * 8,
    delay: Math.random() * 0.08,
  }));
}

interface BurstProps {
  color: string;
  active: boolean;
}

function SeedBurst({ color, active }: BurstProps) {
  const particles = useRef(generateBurst(18));

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      {particles.current.map(p => {
        const rad = (p.angle * Math.PI) / 180;
        const tx = Math.cos(rad) * p.distance;
        const ty = Math.sin(rad) * p.distance;
        return (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              background: color,
              top: '50%',
              left: '50%',
              marginTop: -p.size / 2,
              marginLeft: -p.size / 2,
              boxShadow: `0 0 ${p.size * 2}px ${color}`,
            }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={active
              ? { x: tx, y: ty, opacity: [0, 1, 0], scale: [0, 1.4, 0] }
              : { x: 0, y: 0, opacity: 0, scale: 0 }
            }
            transition={{
              duration: 0.9,
              delay: p.delay,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  3D Tilt Hook — mouse-driven perspective rotation
//  Returns spring-animated transform string
// ─────────────────────────────────────────────────────────────
function use3DTilt(strength = 14) {
  const rotX = useSpring(0, { stiffness: 220, damping: 26 });
  const rotY = useSpring(0, { stiffness: 220, damping: 26 });
  const scl = useSpring(1, { stiffness: 300, damping: 28 });

  const ref = useRef<HTMLDivElement>(null);

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    rotX.set(-ny * strength);
    rotY.set(nx * strength);
  }, [rotX, rotY, strength]);

  const onLeave = useCallback(() => {
    rotX.set(0);
    rotY.set(0);
    scl.set(1);
  }, [rotX, rotY, scl]);

  const onEnter = useCallback(() => scl.set(1.04), [scl]);

  const transform = useTransform(
    [rotX, rotY, scl] as MotionValue<number>[],
    ([rx, ry, sc]: number[]) =>
      `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${sc})`,
  );

  return { ref, transform, onMove, onLeave, onEnter };
}

// ─────────────────────────────────────────────────────────────
//  3D Promise Text Card
//  True layered depth: shadow plane + body + gloss sheen
// ─────────────────────────────────────────────────────────────
interface PromiseCardProps {
  text: string;
  palette: PromisePalette;
  visible: boolean;
  isReceding: boolean; // when hero polaroid is rising
}

function PromiseCard({ text, palette, visible, isReceding }: PromiseCardProps) {
  const { ref, transform, onMove, onLeave, onEnter } = use3DTilt(12);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.5 }}
      style={{ zIndex: 40 }}
    >
      {/* Bloom aura behind the card — synced to palette */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: 700,
          height: 380,
          background: palette.bloom,
          borderRadius: '50%',
          filter: 'blur(40px)',
        }}
        animate={{
          opacity: isReceding ? 0 : [0.7, 1.0, 0.7],
          scale: isReceding ? 0.85 : [1, 1.06, 1],
        }}
        transition={{
          duration: 4,
          repeat: isReceding ? 0 : Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* 3D tiltable card wrapper */}
      <motion.div
        className="relative pointer-events-auto"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{
          opacity: isReceding ? 0 : 1,
          y: isReceding ? 80 : 0,
          filter: isReceding ? 'blur(12px)' : 'blur(0px)',
          scale: isReceding ? 0.92 : 1,
        }}
        transition={{ duration: 0.8, ease: APPLE_EASE }}
      >
        <motion.div
          ref={ref}
          style={{ transform, transformStyle: 'preserve-3d' }}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          onMouseEnter={onEnter}
          className="relative"
        >
          {/* ── Shadow layer (translateZ negative = behind) ── */}
          <div
            className="absolute inset-0 rounded-[28px] pointer-events-none"
            style={{
              background: 'rgba(0,0,0,0.06)',
              filter: 'blur(24px)',
              transform: 'translateZ(-20px) translateY(18px) scale(0.94)',
            }}
          />

          {/* ── Glass body ── */}
          <div
            className="relative rounded-[28px] px-10 py-9 md:px-16 md:py-12 max-w-[680px] text-center"
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.72) 0%, rgba(255,248,252,0.55) 100%)',
              backdropFilter: 'blur(32px) saturate(180%)',
              WebkitBackdropFilter: 'blur(32px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.75)',
              boxShadow: `
                inset 0 1.5px 0 rgba(255,255,255,0.95),
                inset 0 -1px 0 rgba(255,255,255,0.30),
                0 12px 60px rgba(0,0,0,0.10),
                0 2px 8px rgba(0,0,0,0.06)
              `,
              transform: 'translateZ(0px)',
            }}
          >
            {/* Top gloss sheen — the "Apple glass" highlight */}
            <div
              className="absolute inset-x-0 top-0 h-[55%] rounded-[28px] pointer-events-none"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 100%)',
                borderRadius: '28px 28px 60% 60% / 28px 28px 40px 40px',
              }}
            />

            {/* Ambient inner rim glow (palette-tinted) */}
            <div
              className="absolute inset-0 rounded-[28px] pointer-events-none"
              style={{
                boxShadow: `inset 0 0 40px rgba(255,200,220,0.12)`,
              }}
            />

            {/* ── Promise text — 3 rendered layers for depth ── */}
            <div className="relative" style={{ transformStyle: 'preserve-3d' }}>
              {/* Layer 1: Deep shadow (translateZ back) */}
              <p
                className="absolute inset-0 font-playfair leading-[1.45] tracking-wide text-[clamp(1.1rem,3vw,2.5rem)] select-none pointer-events-none"
                aria-hidden="true"
                style={{
                  color: 'transparent',
                  WebkitTextStroke: '0px transparent',
                  textShadow: '0 6px 20px rgba(180,80,120,0.22)',
                  transform: 'translateZ(-8px)',
                  filter: 'blur(3px)',
                  opacity: 0.8,
                }}
              >
                {text}
              </p>

              {/* Layer 2: Main text body */}
              <p
                className="relative font-playfair leading-[1.45] tracking-wide text-[clamp(1.1rem,3vw,2.5rem)]"
                style={{
                  background: 'linear-gradient(160deg, #1e293b 0%, #334155 40%, #1e293b 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: `drop-shadow(${palette.glow})`,
                  transform: 'translateZ(4px)',
                }}
              >
                {text}
              </p>

              {/* Layer 3: Top highlight shimmer */}
              <p
                className="absolute inset-0 font-playfair leading-[1.45] tracking-wide text-[clamp(1.1rem,3vw,2.5rem)] select-none pointer-events-none"
                aria-hidden="true"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.45) 0%, transparent 60%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  transform: 'translateZ(8px)',
                  mixBlendMode: 'overlay',
                }}
              >
                {text}
              </p>
            </div>

            {/* Promise index dots */}
            <div className="relative flex justify-center gap-2 mt-6 z-10" style={{ transform: 'translateZ(6px)' }}>
              {PALETTES.map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-500"
                  style={{
                    width: i < (visible ? 1 : 0) ? 20 : 7,
                    height: 7,
                    background: i === PALETTES.indexOf(palette)
                      ? `linear-gradient(90deg, ${palette.seedCore})`
                      : 'rgba(0,0,0,0.12)',
                    transform: i === PALETTES.indexOf(palette) ? 'scaleY(1.1)' : 'scaleY(1)',
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Seed Orb — the 3D glass button
//  Full Apple Vision Pro material: multi-layer compositing,
//  physics breathing, caustic light sweep
// ─────────────────────────────────────────────────────────────
interface SeedOrbProps {
  palette: PromisePalette;
  onPlant: () => void;
  isHeroAnimating: boolean;
  disabled: boolean;
}

function SeedOrb({ palette, onPlant, isHeroAnimating, disabled }: SeedOrbProps) {
  const [bursting, setBursting] = useState(false);
  const { ref, transform, onMove, onLeave, onEnter } = use3DTilt(20);

  const handleClick = useCallback(() => {
    if (disabled || isHeroAnimating) return;
    setBursting(true);
    onPlant();
    setTimeout(() => setBursting(false), 1000);
  }, [disabled, isHeroAnimating, onPlant]);

  return (
    <motion.div
      className="relative flex flex-col items-center gap-6"
      animate={{
        opacity: isHeroAnimating ? 0.3 : 1,
        y: isHeroAnimating ? 20 : 0,
        scale: isHeroAnimating ? 0.88 : 1,
        filter: isHeroAnimating ? 'blur(6px)' : 'blur(0px)',
      }}
      transition={{ duration: 0.7, ease: APPLE_EASE }}
      style={{ pointerEvents: isHeroAnimating ? 'none' : 'auto' }}
    >
      {/* Label */}
      <motion.p
        className="font-playfair tracking-[0.22em] text-xs uppercase text-slate-600/75"
        animate={{ opacity: isHeroAnimating ? 0 : 1, y: isHeroAnimating ? 8 : 0 }}
        transition={{ duration: 0.5, ease: APPLE_EASE }}
      >
        Touch the seed to bloom a promise
      </motion.p>

      {/* Orb wrapper — breathing + tilt */}
      <motion.div
        className="relative w-24 h-24"
        animate={{
          y: isHeroAnimating ? 0 : [0, -8, 0],
        }}
        transition={{
          duration: 4.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Contact shadow — synced to breathing */}
        <motion.div
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full"
          style={{
            width: 70,
            height: 18,
            background: 'rgba(0,0,0,0.18)',
            filter: 'blur(12px)',
          }}
          animate={{
            scaleX: isHeroAnimating ? 1 : [1, 0.75, 1],
            opacity: isHeroAnimating ? 0.3 : [0.9, 0.5, 0.9],
          }}
          transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Burst ring — outer ripple on click */}
        <AnimatePresence>
          {bursting && (
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ border: `2px solid ${palette.particle}` }}
              initial={{ scale: 1, opacity: 0.9 }}
              animate={{ scale: 2.8, opacity: 0 }}
              exit={{}}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          )}
        </AnimatePresence>

        {/* Second outer ripple */}
        <AnimatePresence>
          {bursting && (
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ border: `1px solid ${palette.particle}`, opacity: 0.5 }}
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 3.6, opacity: 0 }}
              exit={{}}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            />
          )}
        </AnimatePresence>

        {/* Particle burst */}
        <SeedBurst color={palette.particle} active={bursting} />

        {/* The 3D Glass Orb itself */}
        <motion.div
          ref={ref}
          style={{ transform, transformStyle: 'preserve-3d' }}
          className="absolute inset-0 cursor-pointer"
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          onMouseEnter={onEnter}
          onClick={handleClick}
          onTouchEnd={(e) => { e.preventDefault(); handleClick(); }}
          whileTap={{ scale: 0.88 }}
          animate={{
            scale: isHeroAnimating ? 1 : [1, 1.055, 1],
          }}
          transition={{
            duration: 3.4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Outer atmosphere halo */}
          <div
            className="absolute -inset-3 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${palette.particle}55 0%, transparent 70%)`,
              filter: 'blur(10px)',
            }}
          />

          {/* Main orb body */}
          <div
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{
              background: palette.seedCore,
              boxShadow: `
                inset 0 -14px 28px rgba(0,0,0,0.25),
                inset 0 6px 16px ${palette.seedRim},
                0 10px 40px rgba(0,0,0,0.20),
                0 0 0 1px rgba(255,255,255,0.45)
              `,
            }}
          >
            {/* Deep core glow */}
            <div
              className="absolute inset-3 rounded-full"
              style={{
                background: palette.seedCore,
                filter: 'blur(8px)',
                opacity: 0.9,
              }}
            />

            {/* Primary specular highlight — the Apple gloss ellipse */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: '6%',
                left: '12%',
                width: '68%',
                height: '40%',
                background: `radial-gradient(ellipse at 40% 30%, ${palette.seedRim} 0%, rgba(255,255,255,0.5) 45%, transparent 100%)`,
                borderRadius: '50%',
                transform: 'rotate(-20deg)',
              }}
            />

            {/* Secondary bounce — bottom rim translucency */}
            <div
              className="absolute pointer-events-none"
              style={{
                bottom: '8%',
                right: '10%',
                width: '50%',
                height: '28%',
                background: `radial-gradient(ellipse, rgba(255,255,255,0.30) 0%, transparent 100%)`,
                borderRadius: '50%',
                filter: 'blur(2px)',
                transform: 'rotate(18deg)',
              }}
            />

            {/* Animated light sweep — caustic shimmer */}
            <motion.div
              className="absolute pointer-events-none"
              style={{
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)',
                rotate: '45deg',
              }}
              animate={{ x: ['-60%', '60%'] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'linear', repeatDelay: 1.2 }}
            />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Climax — "Spring is finally here."
//  Orchestrated per-word entrance with palette bloom
// ─────────────────────────────────────────────────────────────
interface ClimaxProps {
  isHeroAnimating: boolean;
}

function ClimaxReveal({ isHeroAnimating }: ClimaxProps) {
  const words = "Spring is finally here.".split(" ");

  return (
    <motion.div
      className="text-center z-50 pointer-events-auto relative"
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Climax bloom */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: 800,
          height: 400,
          top: '50%',
          left: '50%',
          translate: '-50% -50%',
          background: 'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(255,220,235,0.85) 0%, rgba(252,210,225,0.50) 45%, transparent 100%)',
          filter: 'blur(50px)',
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: [0, 1, 0.8], scale: [0.8, 1.1, 1.0] }}
        transition={{ duration: 2, ease: APPLE_EASE, delay: isHeroAnimating ? 2.2 : 0.2 }}
      />

      {/* Glass card around climax text */}
      <div
        className="relative rounded-[32px] px-12 py-10 md:px-20 md:py-14"
        style={{
          background: 'linear-gradient(145deg, rgba(255,255,255,0.75) 0%, rgba(255,248,252,0.58) 100%)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          border: '1px solid rgba(255,255,255,0.80)',
          boxShadow: `
            inset 0 1.5px 0 rgba(255,255,255,0.95),
            inset 0 -1px 0 rgba(255,255,255,0.30),
            0 20px 80px rgba(220,120,160,0.18),
            0 4px 16px rgba(0,0,0,0.08)
          `,
          transform: 'translateZ(0px)',
        }}
      >
        {/* Gloss sheen */}
        <div
          className="absolute inset-x-0 top-0 h-[50%] pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 100%)',
            borderRadius: '32px 32px 60% 60% / 32px 32px 40px 40px',
          }}
        />

        <h2 className="font-playfair text-4xl md:text-6xl tracking-widest uppercase flex flex-wrap justify-center gap-x-4 gap-y-2 relative">
          {words.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 50, filter: 'blur(16px)', scale: 0.9 }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
              transition={{
                duration: 1.2,
                delay: (isHeroAnimating ? 2.6 : 0.4) + i * 0.18,
                ease: APPLE_EASE,
              }}
              className="inline-block relative"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Word shadow layer */}
              <span
                className="absolute inset-0 font-playfair"
                aria-hidden="true"
                style={{
                  background: 'linear-gradient(160deg, rgba(220,80,130,0.15) 0%, transparent 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  transform: 'translateZ(-4px) translateY(3px)',
                  filter: 'blur(2px)',
                }}
              >
                {word}
              </span>

              {/* Word main */}
              <span
                style={{
                  background: 'linear-gradient(160deg, #1e293b 0%, #334155 45%, #1e293b 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0px 0px 20px rgba(255,255,255,0.9)) drop-shadow(0px 4px 12px rgba(244,143,177,0.45))',
                  transform: 'translateZ(4px)',
                  display: 'block',
                }}
              >
                {word}
              </span>
            </motion.span>
          ))}
        </h2>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Background Sync Layer
//  Smoothly transitions the page background tint in sync
//  with plantedCount and scrollProgress — bridges with Scene.tsx
// ─────────────────────────────────────────────────────────────
interface BgSyncProps {
  plantedCount: number;
  progress: number;
  isComplete: boolean;
}

function BackgroundSync({ plantedCount, progress, isComplete }: BgSyncProps) {
  const palette = PALETTES[Math.min(plantedCount, PALETTES.length - 1)];

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      animate={{
        background: isComplete
          ? 'radial-gradient(ellipse 100% 80% at 50% 80%, rgba(255,230,242,0.72) 0%, rgba(252,233,240,0.50) 50%, transparent 100%)'
          : palette.bloom,
        opacity: Math.min(1, (progress - 0.96) * 40),
      }}
      transition={{ duration: 1.2, ease: APPLE_EASE }}
    />
  );
}

// ─────────────────────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────────────────────
export default function PromisePlanting() {
  const progress = useStoryStore(s => s.scrollProgress);
  const plantedCount = useStoryStore(s => s.plantedCount);
  const incrementPlantedCount = useStoryStore(s => s.incrementPlantedCount);
  const isHeroAnimating = useStoryStore(s => s.isHeroAnimating);

  const containerRef = useRef<HTMLDivElement>(null);

  const PROMISES = [
    "I promise to always be your safe place.",
    "I promise that my favorite view will always be the one with you in it.",
    "I promise to hold your hand through every spring.",
    "I promise to keep our shared dreams alive.",
    "I promise to love you, today and always.",
  ];

  // Reset when scrolled away
  useEffect(() => {
    if (progress < 0.95 && plantedCount > 0) {
      useStoryStore.setState({ plantedCount: 0, isHeroAnimating: false });
    }
  }, [progress, plantedCount]);

  if (progress < 0.98) return null;

  const handlePlant = () => {
    if (plantedCount >= PROMISES.length || isHeroAnimating) return;
    incrementPlantedCount();
    useStoryStore.setState({ isHeroAnimating: true });
  };

  const isComplete = plantedCount >= PROMISES.length;
  const palette = PALETTES[Math.min(Math.max(plantedCount - 1, 0), PALETTES.length - 1)];
  const currentPalette = isComplete
    ? PALETTES[PALETTES.length - 1]
    : PALETTES[Math.min(plantedCount, PALETTES.length - 1)];

  // Which promise to show (the one just planted)
  const shownPromiseIdx = Math.max(plantedCount - 1, 0);
  const showPromiseCard = plantedCount > 0 && !isComplete;

  return (
    <>
      {/* Background tint layer — synced to scene */}
      <BackgroundSync
        plantedCount={plantedCount}
        progress={progress}
        isComplete={isComplete}
      />

      <div
        ref={containerRef}
        className="fixed inset-0 pointer-events-none z-30 overflow-hidden"
        style={{ perspective: '1000px' }}
      >
        {/* ── Promise Text Card (3D glass) ── */}
        <AnimatePresence mode="wait">
          {showPromiseCard && (
            <motion.div
              key={`promise-${shownPromiseIdx}`}
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.4 } }}
            >
              <PromiseCard
                text={PROMISES[shownPromiseIdx]}
                palette={PALETTES[shownPromiseIdx]}
                visible={!isHeroAnimating}
                isReceding={isHeroAnimating}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Intro state (no promise planted yet) ── */}
        <AnimatePresence>
          {plantedCount === 0 && !isComplete && (
            <motion.div
              key="intro"
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
              transition={{ duration: 0.9, ease: APPLE_EASE }}
            >
              <div
                className="text-center rounded-[28px] px-10 py-8 md:px-14 md:py-10 max-w-xl"
                style={{
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.68) 0%, rgba(255,248,252,0.50) 100%)',
                  backdropFilter: 'blur(28px) saturate(160%)',
                  WebkitBackdropFilter: 'blur(28px) saturate(160%)',
                  border: '1px solid rgba(255,255,255,0.70)',
                  boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.92), 0 10px 50px rgba(0,0,0,0.08)',
                }}
              >
                <div
                  className="absolute inset-x-0 top-0 h-[50%] pointer-events-none"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.50) 0%, rgba(255,255,255,0) 100%)',
                    borderRadius: '28px 28px 50% 50% / 28px 28px 36px 36px',
                  }}
                />
                <h3
                  className="font-playfair text-[clamp(1.1rem,3vw,2.4rem)] leading-[1.45] tracking-wide"
                  style={{
                    background: 'linear-gradient(160deg, #1e293b 0%, #334155 50%, #1e293b 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter: 'drop-shadow(0px 0px 28px rgba(255,255,255,1)) drop-shadow(0px 0px 48px rgba(255,255,255,0.80)) drop-shadow(0px 4px 16px rgba(244,143,177,0.45))',
                  }}
                >
                  {PROMISES[0]}
                </h3>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Climax ── */}
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence>
            {isComplete && (
              <motion.div
                key="climax"
                initial={{ opacity: 0, scale: 0.95, filter: 'blur(16px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.9, ease: APPLE_EASE, delay: isHeroAnimating ? 2.4 : 0 }}
              >
                <ClimaxReveal isHeroAnimating={isHeroAnimating} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Seed Orb Button ── */}
        <AnimatePresence>
          {!isComplete && (
            <motion.div
              key="seed"
              className="absolute bottom-16 md:bottom-24 left-1/2 -translate-x-1/2 z-40 pointer-events-auto"
              initial={{ opacity: 0, y: 50, scale: 0.8, filter: 'blur(12px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 50, scale: 0.8, filter: 'blur(12px)' }}
              transition={{ duration: 1, ease: APPLE_EASE }}
            >
              <SeedOrb
                palette={currentPalette}
                onPlant={handlePlant}
                isHeroAnimating={isHeroAnimating}
                disabled={isComplete}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}