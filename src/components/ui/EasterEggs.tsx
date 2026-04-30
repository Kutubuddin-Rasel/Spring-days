'use client';
import { useRef, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, useSpring, useTransform, MotionValue, AnimatePresence } from 'framer-motion';
import { useStoryStore } from '@/store/useStoryStore';

// ─────────────────────────────────────────────────────────────
//  Design constants
// ─────────────────────────────────────────────────────────────
const SPRING_APPEAR = 0.95;
const SPRING_FULL = 0.88;
const SPRING_BG_TINT = 'rgba(252, 233, 240, 0.72)';

// ─────────────────────────────────────────────────────────────
//  Data
// ─────────────────────────────────────────────────────────────
interface Destination {
  image?: string;
  emoji: string;
  name: string;
  sub: string;
  hue: number;
  delay: number;
  rotate: number;
}

const DESTINATIONS: Destination[] = [
  { image: '/images/japan/CheeryTree-MountFuji.avif', emoji: '🇯🇵', name: 'Japan', sub: 'Our dream spring together', hue: 340, delay: 0.00, rotate: -3 },
  { image: '/images/south/south-korea-han-river-walkside.avif', emoji: '🇰🇷', name: 'South Korea', sub: 'Walking the Han River, hand in hand', hue: 210, delay: 0.12, rotate: 4 },
  { image: '/images/paris/paris-cafe.avif', emoji: '🇫🇷', name: 'Paris', sub: 'A café for two, just you and me', hue: 30, delay: 0.24, rotate: -2 },
  { image: '/images/swiz/Swiz-Lauterbrunnen-street.avif', emoji: '🇨🇭', name: 'Switzerland', sub: 'Our alpine getaway', hue: 120, delay: 0.36, rotate: 3 },
];

interface Treat {
  label: string;
  icon: string;
  color: string;
  delay: number;
}

const TREATS: Treat[] = [
  { label: 'Cookies & Cream', icon: '🍪', color: '#4a3b32', delay: 0.10 },
  { label: 'Kinder Bueno', icon: '🍫', color: '#8b5a2b', delay: 0.22 },
  { label: 'Ferrero Rocher', icon: '✨', color: '#d4af37', delay: 0.34 },
  { label: 'Kinder Joy', icon: '🥚', color: '#cd5c5c', delay: 0.46 },
];

// ─────────────────────────────────────────────────────────────
//  Hooks
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
    const nx = (e.clientX - r.left) / r.width - 0.5;
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

  const transform = useTransform(
    [rotX, rotY, scale] as MotionValue<number>[],
    ([rx, ry, sc]: number[]) =>
      `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${sc})`,
  );

  return { ref, transform, glowX, glowY };
}

// ─────────────────────────────────────────────────────────────
//  Polaroid Card — with Hero Mode Support
// ─────────────────────────────────────────────────────────────
function PolaroidCard({ d, visible, isHero, layoutId }: { d: Destination; visible: boolean; isHero?: boolean; layoutId?: string }) {
  const { ref, transform } = useTilt3D(isHero ? 25 : 16);

  return (
    <motion.div
      layoutId={layoutId}
      initial={{ opacity: 0, y: -36, rotate: d.rotate - 4 }}
      animate={visible
        ? { opacity: 1, y: 0, rotate: isHero ? 0 : d.rotate }
        : { opacity: 0, y: -36, rotate: d.rotate - 4 }
      }
      transition={{
        delay: visible && !isHero ? d.delay : 0,
        duration: isHero ? 0.8 : 0.72,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="pointer-events-auto origin-center"
      style={{ transformStyle: 'preserve-3d', zIndex: isHero ? 100 : 1 }}
    >
      <motion.div
        ref={ref}
        style={{ transform, transformStyle: 'preserve-3d' }}
        className="relative cursor-pointer select-none"
      >
        <div
          className="relative flex flex-col items-center gap-0 rounded-[3px] shadow-[0_12px_40px_-8px_rgba(0,0,0,0.22),0_2px_8px_rgba(0,0,0,0.10)]"
          style={{
            background: 'linear-gradient(160deg, #fdfbf6 0%, #f8f3ec 100%)',
            padding: isHero ? '20px 20px 40px' : '10px 10px 20px',
            border: '1px solid rgba(200,185,168,0.5)',
          }}
        >
          <div
            className="absolute -top-[10px] left-1/2 -translate-x-1/2 z-20"
            style={{
              width: isHero ? 80 : 44, 
              height: isHero ? 36 : 20,
              background: `hsla(${d.hue}, 70%, 85%, 0.55)`,
              backdropFilter: 'blur(2px)',
              transform: `rotate(${d.rotate * -0.6}deg)`,
              boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
            }}
          />
          <div
            className="relative overflow-hidden flex items-center justify-center bg-slate-100"
            style={{
              width: isHero ? 380 : 96, 
              height: isHero ? 440 : 112,
              boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.08)',
            }}
          >
            {d.image ? (
              <>
                <Image 
                  src={d.image} 
                  alt={d.name} 
                  fill
                  sizes={isHero ? "600px" : "150px"}
                  quality={100}
                  priority={isHero}
                  className="object-cover transition-transform duration-700 ease-out hover:scale-105"
                />
                <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.4)] pointer-events-none" />
                {/* Subtle glossy reflection without mix-blend wash-out */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
              </>
            ) : (
              <>
                <span className="transition-transform duration-500 group-hover:scale-110" style={{ fontSize: isHero ? '10rem' : '2.6rem', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.18))' }}>
                  {d.emoji}
                </span>
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.08) 100%)' }} />
              </>
            )}
          </div>
          <p className="mt-3 text-center font-playfair italic text-slate-800 leading-none drop-shadow-sm" style={{ fontSize: isHero ? 36 : 14, letterSpacing: '0.04em' }}>
            {d.name}
          </p>
          <p className="text-center font-medium text-slate-600 leading-none transition-opacity duration-300" style={{ fontSize: isHero ? 22 : 10, letterSpacing: '0.06em', marginTop: isHero ? '12px' : '4px', opacity: 0.9 }}>
            {d.sub}
          </p>
          <div className="absolute inset-x-0 top-0 h-px rounded-t-[3px] pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)' }} />
        </div>
        <div className="absolute inset-x-2 -bottom-3 h-4 rounded-full pointer-events-none" style={{ background: 'rgba(0,0,0,0.12)', filter: 'blur(8px)', transform: 'translateZ(-10px)' }} />
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Artisanal Chocolate Redux
// ─────────────────────────────────────────────────────────────
function ArtisanalChocolate({ t, visible, isHero, layoutId }: { t: Treat; visible: boolean; isHero?: boolean; layoutId?: string }) {
  const [hovered, setHovered] = useState(false);
  const { ref, transform } = useTilt3D(isHero ? 25 : 20);

  return (
    <motion.div
      layoutId={layoutId}
      initial={{ opacity: 0, scale: 0.8, x: isHero ? 0 : 40 }}
      animate={visible ? { opacity: 1, scale: isHero ? 1.4 : 1, x: 0 } : { opacity: 0, scale: 0.8, x: 40 }}
      transition={{ type: 'spring', stiffness: 90, damping: 16 }}
      className={`pointer-events-auto flex group cursor-pointer ${isHero ? 'flex-col items-center gap-4' : 'flex-row items-center justify-end gap-3'}`}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      {!isHero && (
        <motion.span
          initial={false}
          animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : 10, filter: hovered ? 'blur(0px)' : 'blur(4px)' }}
          className="font-playfair italic text-slate-700 tracking-widest whitespace-nowrap bg-white/40 backdrop-blur-sm px-2 py-0.5 rounded-sm"
          style={{ fontSize: 11 }}
        >
          {t.label}
        </motion.span>
      )}

      <motion.div ref={ref} style={{ transform }} className="relative">
        <div 
          className="relative rounded-[6px] shadow-lg flex items-center justify-center overflow-hidden border border-white/20"
          style={{ width: 44, height: 44, background: `linear-gradient(135deg, ${t.color} 0%, #1a0f08 100%)` }}
        >
          {/* Gold Drizzle */}
          <div className="absolute inset-0 opacity-40 mix-blend-overlay" style={{ background: 'repeating-linear-gradient(45deg, transparent, transparent 6px, #ffd700 6px, #ffd700 8px)' }} />
          {/* Specular Sheen */}
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/30 to-transparent" />
          <span className="text-xl z-10 drop-shadow-md">{t.icon}</span>
        </div>
        <div className="absolute inset-x-1 -bottom-2 h-2 rounded-full bg-black/20 blur-[3px]" />
      </motion.div>

      {isHero && (
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-playfair italic text-slate-800 bg-white/60 backdrop-blur-md px-3 py-1 rounded-full shadow-sm text-center"
          style={{ fontSize: 13 }}
        >
          {t.label}
        </motion.span>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Ambient petal echo
// ─────────────────────────────────────────────────────────────
const ECHO_PETALS = Array.from({ length: 9 }, (_, i) => ({
  id: i, left: `${8 + i * 10.5}%`, delay: `${i * 0.55}s`, duration: `${3.8 + (i % 3) * 0.9}s`, size: 10 + (i % 4) * 5, hue: 338 + (i % 5) * 5,
}));

// ─────────────────────────────────────────────────────────────
//  Main component
// ─────────────────────────────────────────────────────────────
export default function EasterEggs() {
  const progress = useScrollProgress();
  const plantedCount = useStoryStore(s => s.plantedCount);
  const isHeroAnimating = useStoryStore(s => s.isHeroAnimating);
  const setHeroAnimating = useStoryStore(s => s.setHeroAnimating);
  
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    return useStoryStore.subscribe(s => {
      setVisible(s.scrollProgress >= SPRING_APPEAR);
    });
  }, []);

  // Hero Timer
  useEffect(() => {
    if (isHeroAnimating) {
      const timer = setTimeout(() => {
        setHeroAnimating(false);
      }, 2500); // Wait 2.5 seconds before returning
      return () => clearTimeout(timer);
    }
  }, [isHeroAnimating, setHeroAnimating]);

  const heroIndex = isHeroAnimating && plantedCount > 0 ? plantedCount - 1 : null;

  const overlayOpacity = useTransform(progress, [SPRING_APPEAR - 0.02, SPRING_FULL], [0, 1]);
  const surge = useSpring(0, { stiffness: 300, damping: 20 });

  useEffect(() => {
    if (plantedCount > 0) {
      surge.set(1);
      const timeout = setTimeout(() => surge.set(0), 300);
      return () => clearTimeout(timeout);
    }
  }, [plantedCount, surge]);

  const basePetalOpacity = useTransform(progress, [0.38, 0.60, SPRING_APPEAR], [0, 0.55, 0.85]);
  const petalOpacity = useTransform([basePetalOpacity, surge] as MotionValue<number>[], ([base, s]: number[]) => Math.min(1, base + s * 0.4));

  return (
    <>
      {/* ── Ambient CSS petal echoes ── */}
      <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
        <motion.div style={{ opacity: petalOpacity }} className="absolute inset-0">
          {ECHO_PETALS.map(p => (
            <div key={p.id} className="absolute top-0" style={{ left: p.left, width: p.size, height: p.size * 1.55, animation: `petalDrift ${p.duration} ease-in-out ${p.delay} infinite both` }}>
              <svg viewBox="0 0 40 64" fill="none" style={{ width: '100%', height: '100%' }}>
                <path d="M20 62 C6 46 4 14 20 2 C36 14 34 46 20 62Z" fill={`hsla(${p.hue}, 80%, 88%, 0.72)`} />
                <path d="M20 62 C6 46 4 14 20 2 C36 14 34 46 20 62Z" stroke={`hsla(${p.hue}, 70%, 75%, 0.30)`} strokeWidth="0.5" />
                <path d="M20 58 Q20 32 20 6" stroke={`hsla(${p.hue}, 50%, 68%, 0.22)`} strokeWidth="0.6" />
              </svg>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Main UI layer ── */}
      <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden">
        <motion.div className="absolute inset-0 pointer-events-none" style={{ opacity: overlayOpacity, background: `radial-gradient(ellipse 90% 70% at 50% 110%, ${SPRING_BG_TINT} 0%, transparent 80%)` }} />

        {/* Hero Cinematic Portal */}
        <AnimatePresence>
          {heroIndex !== null && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="fixed inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none pb-[12vh]"
            >
              {heroIndex < 4 && (
                <PolaroidCard layoutId={`polaroid-${DESTINATIONS[heroIndex].name}`} d={DESTINATIONS[heroIndex]} visible={true} isHero={true} />
              )}
              {heroIndex === 4 && (
                <div className="flex flex-col items-center gap-12">
                  <motion.h4 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-playfair text-2xl md:text-3xl text-slate-800 drop-shadow-md italic text-center px-4"
                  >
                    Your favorite treats, waiting for you...
                  </motion.h4>
                  <div className="flex flex-wrap justify-center gap-12 md:gap-20 max-w-4xl px-4 mt-6">
                    {TREATS.map((t) => (
                      <ArtisanalChocolate key={t.label} layoutId={`treat-${t.label}`} t={t} visible={true} isHero={true} />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Corner Layout Grids ── */}
        <div className="absolute inset-x-0 top-0 flex justify-between items-start px-4 md:px-10 pt-6">
          {/* Top-left: Japan */}
          <div className="w-[120px]">
            {heroIndex !== 0 && <PolaroidCard layoutId={`polaroid-${DESTINATIONS[0].name}`} d={DESTINATIONS[0]} visible={visible && plantedCount >= 1} />}
          </div>
          {/* Top-right: South Korea */}
          <div className="w-[120px]">
            {heroIndex !== 1 && <PolaroidCard layoutId={`polaroid-${DESTINATIONS[1].name}`} d={DESTINATIONS[1]} visible={visible && plantedCount >= 2} />}
          </div>
        </div>

        <div className="absolute inset-x-0 flex justify-between items-end px-4 md:px-10" style={{ bottom: 80 }}>
          {/* Bottom-left group: Paris + Switzerland */}
          <div className="flex gap-3 md:gap-5 items-end">
            <div className="w-[120px]">
              {heroIndex !== 2 && <PolaroidCard layoutId={`polaroid-${DESTINATIONS[2].name}`} d={DESTINATIONS[2]} visible={visible && plantedCount >= 3} />}
            </div>
            <div className="hidden md:block w-[120px]">
              {heroIndex !== 3 && <PolaroidCard layoutId={`polaroid-${DESTINATIONS[3].name}`} d={DESTINATIONS[3]} visible={visible && plantedCount >= 4} />}
            </div>
          </div>

          {/* Bottom-right: Truffles column */}
          <div className="flex flex-col gap-[12px] items-end">
            {TREATS.map((t, index) => (
              <div key={t.label} className="h-[44px]">
                {heroIndex !== 4 && <ArtisanalChocolate layoutId={`treat-${t.label}`} t={t} visible={visible && plantedCount >= 5} />}
              </div>
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