'use client';
import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import {
  motion, AnimatePresence, useSpring, useTransform, MotionValue,
} from 'framer-motion';
import { useStoryStore } from '@/store/useStoryStore';

// ─────────────────────────────────────────────────────────────
//  Constants & Types
// ─────────────────────────────────────────────────────────────
const EASE = [0.22, 1, 0.36, 1] as const;
const EASE_IN = [0.55, 0, 1, 0.45] as const;

// Apple-level spring presets — tuned for overdamped, fluid feel
// Rule of thumb: damping ≥ 2×sqrt(stiffness) for no bounce
const SPRING_ENTER = { type: 'spring', stiffness: 160, damping: 24 } as const;
const SPRING_EXPAND = { type: 'spring', stiffness: 220, damping: 30 } as const;
const SPRING_RECEDE = { type: 'spring', stiffness: 200, damping: 30 } as const;
const SPRING_SEND = { type: 'spring', stiffness: 280, damping: 32 } as const;

type Phase = 'idle' | 'opening' | 'letters' | 'sending' | 'granted';

// ─────────────────────────────────────────────────────────────
//  Star field data (generated once)
// ─────────────────────────────────────────────────────────────
const STARS = Array.from({ length: 110 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 0.8 + Math.random() * 2.2,
  delay: Math.random() * 4,
  dur: 2.5 + Math.random() * 3.5,
  base: 0.25 + Math.random() * 0.75,
}));

// ─────────────────────────────────────────────────────────────
//  Golden seal-burst particles
// ─────────────────────────────────────────────────────────────
const BURST_P = Array.from({ length: 22 }, (_, i) => {
  const angle = (360 / 22) * i + (Math.random() - 0.5) * 18;
  return {
    id: i,
    angle,
    dist: 65 + Math.random() * 90,
    size: 3.5 + Math.random() * 7,
    delay: Math.random() * 0.14,
  };
});

function SealBurst({ active }: { active: boolean }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 10 }}>
      {BURST_P.map(p => {
        const rad = (p.angle * Math.PI) / 180;
        const tx = Math.cos(rad) * p.dist;
        const ty = Math.sin(rad) * p.dist;
        return (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size, height: p.size,
              top: '50%', left: '50%',
              marginTop: -p.size / 2, marginLeft: -p.size / 2,
              background: 'radial-gradient(circle, #FFE066 0%, #C41E3A 55%, transparent 100%)',
              boxShadow: `0 0 ${p.size * 2.5}px #FFD700`,
            }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={active
              ? { x: tx, y: ty, opacity: [0, 1, 0], scale: [0, 1.8, 0] }
              : { x: 0, y: 0, opacity: 0, scale: 0 }}
            transition={{ duration: 1.0, delay: p.delay, ease: EASE }}
          />
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  3D Tilt Hook
// ─────────────────────────────────────────────────────────────
function use3DTilt(strength = 14) {
  const rotX = useSpring(0, { stiffness: 240, damping: 28 });
  const rotY = useSpring(0, { stiffness: 240, damping: 28 });
  const scl = useSpring(1, { stiffness: 320, damping: 30 });
  const ref = useRef<HTMLDivElement>(null);

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    rotX.set(-(((e.clientY - r.top) / r.height) - 0.5) * strength);
    rotY.set((((e.clientX - r.left) / r.width) - 0.5) * strength);
  }, [rotX, rotY, strength]);

  const onLeave = useCallback(() => {
    rotX.set(0); rotY.set(0); scl.set(1);
  }, [rotX, rotY, scl]);

  const onEnter = useCallback(() => scl.set(1.06), [scl]);

  const transform = useTransform(
    [rotX, rotY, scl] as MotionValue<number>[],
    ([rx, ry, sc]: number[]) =>
      `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${sc})`,
  );

  return { ref, transform, onMove, onLeave, onEnter };
}

// ─────────────────────────────────────────────────────────────
//  Royal Crest
// ─────────────────────────────────────────────────────────────
function RoyalCrest({ size = 68 }: { size?: number }) {
  const c = 'rgba(255,215,190,0.93)';
  const cs = 'rgba(255,215,190,0.65)';
  return (
    <svg width={size} height={size} viewBox="0 0 68 68" fill="none">
      <path d="M16 30 L16 21 L24 27.5 L34 16 L44 27.5 L52 21 L52 30Z" fill={c} />
      <circle cx="34" cy="19" r="2.5" fill="rgba(255,100,80,0.80)" />
      <circle cx="24.5" cy="25.5" r="1.8" fill="rgba(100,180,255,0.75)" />
      <circle cx="43.5" cy="25.5" r="1.8" fill="rgba(100,180,255,0.75)" />
      <rect x="14" y="30" width="40" height="6" rx="1.5" fill={c} />
      <rect x="14" y="32.5" width="40" height="1" rx="0.5" fill="rgba(139,0,0,0.35)" />
      <circle cx="34" cy="49" r="7.5" fill="rgba(139,0,0,0.55)" />
      {[0, 51.4, 102.8, 154.2, 205.7, 257.1, 308.5].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const px = 34 + Math.cos(rad) * 9.5;
        const py = 49 + Math.sin(rad) * 9.5;
        return (
          <ellipse key={i} cx={px} cy={py} rx="3.8" ry="2.2"
            transform={`rotate(${deg} ${px} ${py})`}
            fill={c} opacity={0.78 - i * 0.03} />
        );
      })}
      <circle cx="34" cy="49" r="4.5" fill={c} opacity="0.90" />
      <circle cx="34" cy="49" r="2.2" fill="rgba(139,0,0,0.70)" />
      <circle cx="33" cy="48" r="0.9" fill="rgba(255,235,215,0.85)" />
      <path d="M8 40 Q6 33 11 29 Q12.5 36 8 40Z" fill={cs} />
      <path d="M9.5 47 Q6.5 40 11.5 36 Q14 43 9.5 47Z" fill={cs} />
      <path d="M12 53 Q9 46 14 42 Q16 49 12 53Z" fill={cs} />
      <path d="M60 40 Q62 33 57 29 Q55.5 36 60 40Z" fill={cs} />
      <path d="M58.5 47 Q61.5 40 56.5 36 Q54 43 58.5 47Z" fill={cs} />
      <path d="M56 53 Q59 46 54 42 Q52 49 56 53Z" fill={cs} />
      <path d="M10 28 Q11 37 11 46" stroke={cs} strokeWidth="0.8" fill="none" opacity="0.6" />
      <path d="M58 28 Q57 37 57 46" stroke={cs} strokeWidth="0.8" fill="none" opacity="0.6" />
      <circle cx="34" cy="10" r="2" fill={c} opacity="0.95" />
      <circle cx="24" cy="12" r="1.3" fill={c} opacity="0.75" />
      <circle cx="44" cy="12" r="1.3" fill={c} opacity="0.75" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
//  Wax Seal
// ─────────────────────────────────────────────────────────────
interface WaxSealProps { onBreak: () => void; broken: boolean }

function WaxSeal({ onBreak, broken }: WaxSealProps) {
  const [bursting, setBursting] = useState(false);
  const { ref, transform, onMove, onLeave, onEnter } = use3DTilt(28);

  const handleClick = useCallback(() => {
    if (broken) return;
    setBursting(true);
    setTimeout(() => { onBreak(); }, 380);
    setTimeout(() => { setBursting(false); }, 1100);
  }, [broken, onBreak]);

  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{ width: 128, height: 128 }}
      animate={broken
        ? { scale: 0, opacity: 0, y: -16, transition: { duration: 0.45, ease: EASE_IN } }
        : { scale: 1, opacity: 1, y: 0 }}
    >
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(196,30,58,0.45) 0%, rgba(196,30,58,0.15) 50%, transparent 75%)',
          filter: 'blur(18px)',
        }}
        animate={{ scale: [1, 1.28, 1], opacity: [0.65, 1, 0.65] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <AnimatePresence>
        {bursting && (
          <>
            <motion.div key="r1" className="absolute inset-0 rounded-full border-2 border-red-400/75 pointer-events-none"
              initial={{ scale: 1, opacity: 1 }} animate={{ scale: 2.8, opacity: 0 }} exit={{}}
              transition={{ duration: 0.85, ease: EASE }} />
            <motion.div key="r2" className="absolute inset-0 rounded-full border border-yellow-300/55 pointer-events-none"
              initial={{ scale: 1, opacity: 0.7 }} animate={{ scale: 3.8, opacity: 0 }} exit={{}}
              transition={{ duration: 1.15, ease: EASE, delay: 0.10 }} />
            <motion.div key="r3" className="absolute inset-0 rounded-full border border-orange-300/40 pointer-events-none"
              initial={{ scale: 1, opacity: 0.5 }} animate={{ scale: 4.8, opacity: 0 }} exit={{}}
              transition={{ duration: 1.5, ease: EASE, delay: 0.20 }} />
          </>
        )}
      </AnimatePresence>
      <SealBurst active={bursting} />
      <motion.div
        ref={ref}
        style={{ transform, transformStyle: 'preserve-3d', cursor: broken ? 'default' : 'pointer' }}
        className="absolute inset-0 rounded-full"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        onMouseEnter={onEnter}
        onClick={handleClick}
        onTouchEnd={(e) => { e.preventDefault(); handleClick(); }}
        whileTap={{ scale: 0.82 }}
        animate={{ scale: [1, 1.055, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="absolute -inset-[3px] rounded-full pointer-events-none" style={{
          background: 'conic-gradient(from 0deg, rgba(255,215,0,0.0) 0%, rgba(255,215,0,0.35) 20%, rgba(255,100,80,0.30) 40%, rgba(255,215,0,0.0) 60%, rgba(255,180,0,0.25) 80%, rgba(255,215,0,0.0) 100%)',
          filter: 'blur(3px)',
        }} />
        <div className="absolute inset-0 rounded-full overflow-hidden" style={{
          background: 'radial-gradient(circle at 32% 28%, #D42040 0%, #8B0000 50%, #5C0010 100%)',
          boxShadow: `inset 0 -10px 24px rgba(0,0,0,0.45), inset 0 5px 14px rgba(255,180,160,0.32), 0 10px 40px rgba(139,0,0,0.65), 0 3px 12px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,210,190,0.28)`,
        }}>
          {[0.85, 0.68, 0.52].map((s, i) => (
            <div key={i} className="absolute inset-0 rounded-full pointer-events-none" style={{
              boxShadow: `inset 0 0 0 ${1.5 + i * 0.8}px rgba(${i === 0 ? '255,170,150' : i === 1 ? '190,30,55' : '255,110,90'},${0.18 - i * 0.03})`,
              transform: `scale(${s})`,
            }} />
          ))}
          <div className="absolute pointer-events-none" style={{
            top: '5%', left: '9%', width: '66%', height: '40%',
            background: 'radial-gradient(ellipse at 38% 28%, rgba(255,235,220,0.58) 0%, rgba(255,185,165,0.26) 45%, transparent 100%)',
            borderRadius: '50%', transform: 'rotate(-20deg)',
          }} />
          <div className="absolute pointer-events-none" style={{
            bottom: '7%', right: '9%', width: '48%', height: '26%',
            background: 'radial-gradient(ellipse, rgba(255,255,255,0.20) 0%, transparent 100%)',
            borderRadius: '50%', filter: 'blur(2px)', transform: 'rotate(15deg)',
          }} />
          <div className="absolute inset-0 flex items-center justify-center" style={{
            filter: 'drop-shadow(0px 1.5px 3px rgba(60,0,0,0.90)) drop-shadow(0px -0.5px 1.5px rgba(255,190,160,0.55))',
            transform: 'translateZ(3px)',
          }}>
            <RoyalCrest size={80} />
          </div>
          <motion.div className="absolute pointer-events-none" style={{
            top: '-60%', left: '-60%', width: '220%', height: '220%',
            background: 'linear-gradient(45deg, transparent 35%, rgba(255,240,230,0.28) 50%, transparent 65%)',
          }}
            animate={{ x: ['-55%', '55%'] }}
            transition={{ duration: 3.0, repeat: Infinity, ease: 'linear', repeatDelay: 2.0 }}
          />
        </div>
      </motion.div>
      <motion.p
        className="absolute font-playfair italic text-white/40 tracking-[0.22em] pointer-events-none"
        style={{ fontSize: 9, bottom: -22, whiteSpace: 'nowrap', textTransform: 'uppercase' }}
        animate={{ opacity: [0.35, 0.65, 0.35] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        Break the seal
      </motion.p>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
//  The Envelope
// ─────────────────────────────────────────────────────────────
interface EnvelopeProps { phase: Phase; onSealBreak: () => void; }

function Envelope({ phase, onSealBreak }: EnvelopeProps) {
  const { ref, transform, onMove, onLeave, onEnter } = use3DTilt(7);
  const isOpen = phase === 'opening' || phase === 'letters';
  const isSending = phase === 'sending';

  return (
    <motion.div
      ref={ref} style={{ transform, transformStyle: 'preserve-3d' }}
      onMouseMove={onMove} onMouseLeave={onLeave} onMouseEnter={onEnter}
      className="relative"
      animate={{ y: isSending ? -20 : 0, scale: isSending ? 0.88 : 1, filter: isSending ? 'blur(4px)' : 'blur(0px)' }}
      transition={{ duration: 1.1, ease: EASE }}
    >
      <div className="absolute pointer-events-none" style={{
        bottom: -28, left: '50%', transform: 'translateX(-50%) translateZ(-30px)',
        width: '72%', height: 22, background: 'rgba(0,0,0,0.30)', filter: 'blur(18px)', borderRadius: '50%',
      }} />
      <div className="relative" style={{ width: 400, height: 272 }}>
        <div className="absolute inset-0 rounded-[8px]" style={{
          background: 'linear-gradient(162deg, #fefaf3 0%, #f6ede0 55%, #eddcca 100%)',
          border: '1px solid rgba(195,168,130,0.55)',
          boxShadow: `0 24px 80px rgba(0,0,0,0.24), 0 6px 20px rgba(0,0,0,0.14), inset 0 1.5px 0 rgba(255,255,255,0.92), inset 0 -1px 0 rgba(195,168,130,0.20)`,
        }}>
          {[6, 10, 14].map((inset, i) => (
            <div key={i} className="absolute rounded-[6px] pointer-events-none" style={{
              inset, border: `${i === 0 ? 1 : 0.5}px solid rgba(175,140,85,${0.40 - i * 0.10})`,
            }} />
          ))}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 272">
            <path d="M0 272 L200 148 L400 272Z" fill="rgba(215,188,148,0.18)" stroke="rgba(175,148,105,0.22)" strokeWidth="0.6" />
            <path d="M0 0 L0 272 L200 148Z" fill="rgba(215,188,148,0.12)" stroke="rgba(175,148,105,0.16)" strokeWidth="0.5" />
            <path d="M400 0 L400 272 L200 148Z" fill="rgba(215,188,148,0.14)" stroke="rgba(175,148,105,0.16)" strokeWidth="0.5" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingBottom: 28 }}>
            <div className="text-center" style={{ marginTop: 28 }}>
              <p className="font-playfair italic" style={{ fontSize: 13.5, color: 'rgba(155,120,72,0.60)', letterSpacing: '0.14em', lineHeight: 1.7 }}>
                For You,<br />With All My Love
              </p>
            </div>
          </div>
          <div className="absolute pointer-events-none" style={{
            top: 18, right: 18, width: 48, height: 58,
            background: 'linear-gradient(145deg, #fce8f2 0%, #f2b8d4 100%)',
            border: '1px solid rgba(200,145,165,0.60)', borderRadius: '2px',
            boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.75), 0 2px 6px rgba(0,0,0,0.10)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
          }}>
            <span style={{ fontSize: 22 }}>🌸</span>
            <span style={{ fontSize: 7, color: 'rgba(180,100,130,0.70)', letterSpacing: '0.12em' }}>SPRING</span>
          </div>
          <div className="absolute pointer-events-none" style={{
            top: 22, right: 72, width: 36, height: 36, borderRadius: '50%',
            border: '1px solid rgba(155,120,72,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 7, color: 'rgba(155,120,72,0.30)', textAlign: 'center', lineHeight: 1.3 }}>FOR<br />YOU</span>
          </div>
        </div>
        <div className="absolute top-0 left-0 right-0 overflow-visible pointer-events-none" style={{
          height: '52%', transformOrigin: 'top center', transformStyle: 'preserve-3d',
          transform: isOpen ? 'perspective(800px) rotateX(-168deg)' : 'perspective(800px) rotateX(0deg)',
          transition: 'transform 1.0s cubic-bezier(0.22, 1, 0.36, 1)',
          zIndex: isOpen ? 0 : 5,
        }}>
          <svg width="400" height="141" viewBox="0 0 400 141" fill="none">
            <defs>
              <linearGradient id="flapFront" x1="0" y1="0" x2="400" y2="141" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#fdf5e8" />
                <stop offset="100%" stopColor="#edd8be" />
              </linearGradient>
            </defs>
            <path d="M0 0 L400 0 L200 141 Z" fill="url(#flapFront)" stroke="rgba(175,148,105,0.25)" strokeWidth="0.6" />
            <line x1="200" y1="0" x2="200" y2="141" stroke="rgba(175,148,105,0.10)" strokeWidth="0.6" />
            <path d="M0 0 L180 0 L90 70 Z" fill="rgba(255,255,255,0.10)" />
          </svg>
        </div>
        <div className="absolute left-1/2 pointer-events-auto" style={{ top: '50%', transform: 'translate(-50%, -50%)', zIndex: 20 }}>
          <WaxSeal onBreak={onSealBreak} broken={phase !== 'idle'} />
        </div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div className="absolute inset-x-[10px] pointer-events-none"
            style={{ top: 8, bottom: '48%', background: 'linear-gradient(180deg, rgba(255,240,220,0.60) 0%, rgba(255,220,190,0.25) 100%)', borderRadius: '6px 6px 0 0', zIndex: 1 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Letter paper styles
// ─────────────────────────────────────────────────────────────
const LETTER_STYLES = [
  {
    bg: 'linear-gradient(158deg, #fffbf8 0%, #fde8ef 65%, #f9d5e4 100%)',
    accent: '#c4608a', accentLight: 'rgba(220,140,170,0.55)', border: 'rgba(210,155,175,0.50)',
    headerBg: 'rgba(252,215,230,0.45)', flower: '🌸', label: 'First Wish',
    tilt: -13, initTilt: -24, xOff: -295, yOff: 22, sendX: 260, sendY: -420, sendR: 38,
  },
  {
    bg: 'linear-gradient(158deg, #fdfbff 0%, #ede0f8 65%, #e0cff5 100%)',
    accent: '#8b60c4', accentLight: 'rgba(175,140,220,0.55)', border: 'rgba(185,155,215,0.50)',
    headerBg: 'rgba(225,210,248,0.45)', flower: '✨', label: 'Second Wish',
    tilt: -2, initTilt: -6, xOff: 0, yOff: -14, sendX: 0, sendY: -400, sendR: 0,
  },
  {
    bg: 'linear-gradient(158deg, #f8fff8 0%, #d9f0e0 65%, #c8e8d2 100%)',
    accent: '#5a9e72', accentLight: 'rgba(130,190,150,0.55)', border: 'rgba(150,195,165,0.50)',
    headerBg: 'rgba(200,238,215,0.45)', flower: '🌿', label: 'Third Wish',
    tilt: 13, initTilt: 24, xOff: 295, yOff: 22, sendX: -260, sendY: -420, sendR: -38,
  },
];

// ─────────────────────────────────────────────────────────────
//  Focus Halo
// ─────────────────────────────────────────────────────────────
function FocusHalo({ color, visible }: { color: string; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute pointer-events-none"
          style={{
            inset: -20,
            borderRadius: 8,
            background: `radial-gradient(ellipse at 50% 100%, ${color}28 0%, transparent 70%)`,
            filter: 'blur(12px)',
          }}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: [0.6, 1, 0.6], scale: [0.98, 1.02, 0.98] }}
          exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.3 } }}
          transition={{ opacity: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }, scale: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } }}
        />
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────
//  Wish Letter Card
// ─────────────────────────────────────────────────────────────
interface WishLetterProps {
  index: number;
  value: string;
  onChange: (v: string) => void;
  sealed: boolean;
  onSeal: () => void;
  isSending: boolean;
  focusedIndex: number | null;
  onFocusChange: (i: number | null) => void;
}

function WishLetter({ index, value, onChange, sealed, onSeal, isSending, focusedIndex, onFocusChange }: WishLetterProps) {
  const s = LETTER_STYLES[index];
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [textareaActive, setTextareaActive] = useState(false);

  const isExpanded = !sealed && focusedIndex === index;
  const isReceded = focusedIndex !== null && focusedIndex !== index;

  useEffect(() => {
    if (!sealed && textareaRef.current) {
      const t = setTimeout(() => textareaRef.current?.focus(), 400 + index * 180);
      return () => clearTimeout(t);
    }
  }, [sealed, index]);

  // ── Entrance stagger delays per letter ──
  const entranceDelay = 0.08 + index * 0.16;

  const getAnimate = () => {
    if (isSending) {
      return {
        x: s.xOff + s.sendX,
        y: s.sendY,
        rotate: s.sendR,
        scale: 0.22,
        opacity: 0,
        filter: 'blur(4px)',
        transition: {
          ...SPRING_SEND,
          delay: index * 0.08,
          filter: { type: 'tween', duration: 0.4, ease: 'easeIn' },
          opacity: { type: 'tween', duration: 0.4, delay: index * 0.08 },
        },
      };
    }
    if (isExpanded) {
      return {
        opacity: 1,
        y: -165,
        x: 0,
        rotate: 0,
        scale: 1.38,
        filter: 'blur(0px)',
        transition: {
          ...SPRING_EXPAND,
          filter: { type: 'tween', duration: 0.35, ease: 'easeOut' },
          opacity: { type: 'tween', duration: 0.25, ease: 'easeOut' },
        },
      };
    }
    if (isReceded) {
      return {
        opacity: 0.38,
        y: s.yOff + 8,
        x: s.xOff,
        rotate: s.tilt,
        scale: 0.80,
        filter: 'blur(2.5px)',
        transition: {
          ...SPRING_RECEDE,
          opacity: { type: 'tween', duration: 0.38, ease: 'easeInOut' },
          filter: { type: 'tween', duration: 0.42, ease: 'easeInOut' },
        },
      };
    }
    // ── Default spread — spring with per-letter stagger ──
    return {
      opacity: 1,
      y: s.yOff,
      x: s.xOff,
      rotate: s.tilt,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        ...SPRING_ENTER,
        delay: entranceDelay,
        opacity: { type: 'tween', duration: 0.55, ease: 'easeOut', delay: entranceDelay },
        filter: { type: 'tween', duration: 0.55, ease: 'easeOut', delay: entranceDelay },
      },
    };
  };

  return (
    <motion.div
      className="absolute"
      style={{
        bottom: 0,
        left: '50%',
        marginLeft: -120,
        transformOrigin: 'bottom center',
        transformStyle: 'preserve-3d',
        // Avoid zIndex snap causing visual pop — use willChange
        zIndex: isExpanded ? 50 : isReceded ? 1 : 5,
        willChange: 'transform, opacity, filter',
      }}
      // ── Entrance: rise from below the envelope with blur + scale ──
      initial={{
        opacity: 0,
        y: 100,
        x: s.xOff,
        rotate: s.initTilt,
        scale: 0.68,
        filter: 'blur(14px)',
      }}
      animate={getAnimate()}
      onMouseEnter={() => { if (!sealed) onFocusChange(index); }}
      onMouseLeave={() => { if (!textareaActive) onFocusChange(null); }}
    >
      <FocusHalo color={s.accent} visible={isExpanded} />

      <div
        className="relative flex flex-col"
        style={{
          width: 240,
          background: s.bg,
          border: `1px solid ${isExpanded ? s.border.replace('0.50', '0.85') : s.border}`,
          borderRadius: 4,
          boxShadow: isExpanded
            ? `0 40px 100px rgba(0,0,0,0.30), 0 12px 32px rgba(0,0,0,0.18), inset 0 1.5px 0 rgba(255,255,255,0.95), 0 0 0 1.5px ${s.accentLight}`
            : `0 20px 60px rgba(0,0,0,0.20), 0 4px 14px rgba(0,0,0,0.12), inset 0 1.5px 0 rgba(255,255,255,0.92)`,
          overflow: 'hidden',
          transition: 'box-shadow 0.5s ease, border-color 0.4s ease',
        }}
      >
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="absolute left-0 right-0 pointer-events-none" style={{
            top: 130 + i * 26, height: 0.6, background: s.accentLight, opacity: 0.6,
          }} />
        ))}
        <div className="absolute top-[115px] bottom-[80px] pointer-events-none" style={{
          left: 36, width: 0.6, background: s.accentLight, opacity: 0.5,
        }} />

        <div className="px-5 pt-5 pb-4 flex flex-col items-center gap-1.5" style={{
          background: s.headerBg, borderBottom: `1px solid ${s.border}`,
        }}>
          <span style={{ fontSize: 28 }}>{s.flower}</span>
          <p className="font-playfair uppercase tracking-[0.20em] text-center" style={{ fontSize: 9.5, color: s.accent }}>
            {s.label}
          </p>
          <div className="flex items-center gap-2 w-full mt-0.5">
            <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${s.accentLight})` }} />
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="rounded-full" style={{ width: 3, height: 3, background: s.accent, opacity: 0.50 + i * 0.18 }} />
              ))}
            </div>
            <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${s.accentLight}, transparent)` }} />
          </div>
        </div>

        <div className="flex-1 relative px-5 pt-3.5 pb-4" style={{ minHeight: 155 }}>
          {sealed ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-3">
              <motion.div className="w-9 h-9 rounded-full flex items-center justify-center text-white"
                style={{
                  background: `radial-gradient(circle at 35% 30%, ${s.accent}ee, ${s.accent}88)`,
                  boxShadow: `0 4px 18px ${s.accent}70, inset 0 1px 0 rgba(255,255,255,0.35)`,
                }}
                initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 18 }}
              >
                <span style={{ fontSize: 14 }}>✓</span>
              </motion.div>
              <p className="font-playfair italic text-center leading-relaxed" style={{
                fontSize: 12, color: s.accent, opacity: 0.82, lineHeight: 1.65, padding: '0 4px',
              }}>
                {value.trim() || 'A wish sealed with love'}
              </p>
            </div>
          ) : (
            <>
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => { setTextareaActive(true); onFocusChange(index); }}
                onBlur={() => { setTextareaActive(false); onFocusChange(null); }}
                placeholder="Write your wish here…"
                className="w-full resize-none outline-none bg-transparent font-playfair leading-[1.75] ml-[28px]"
                style={{
                  fontSize: 12.5, color: '#334155', caretColor: s.accent,
                  minHeight: 136, width: 'calc(100% - 28px)', verticalAlign: 'top',
                }}
              />
              <div className="absolute bottom-3 right-4 flex items-center gap-1.5">
                {[12, 28, 48].map((threshold, i) => (
                  <div key={i} className="rounded-full transition-all duration-400" style={{
                    width: 5, height: 5,
                    background: value.length > threshold ? s.accent : `${s.accentLight}`,
                    opacity: value.length > threshold ? 1 : 0.35,
                    transform: value.length > threshold ? 'scale(1.2)' : 'scale(1)',
                    transition: 'all 0.35s',
                  }} />
                ))}
              </div>
            </>
          )}
        </div>

        {!sealed && (
          <div className="px-5 pb-5 flex justify-center">
            <motion.button
              onClick={onSeal}
              onPointerDown={(e) => e.preventDefault()}
              disabled={!value.trim()}
              className="relative px-6 py-2 rounded-full font-playfair italic text-white overflow-hidden tracking-wide"
              style={{
                fontSize: 11,
                background: value.trim() ? `linear-gradient(135deg, ${s.accent} 0%, ${s.accent}bb 100%)` : 'rgba(0,0,0,0.10)',
                opacity: value.trim() ? 1 : 0.45,
                boxShadow: value.trim() ? `0 5px 18px ${s.accent}60, inset 0 1px 0 rgba(255,255,255,0.28)` : 'none',
                cursor: value.trim() ? 'pointer' : 'not-allowed',
                letterSpacing: '0.10em',
              }}
              whileHover={{ scale: value.trim() ? 1.05 : 1 }}
              whileTap={{ scale: 0.92 }}
            >
              <div className="absolute inset-x-0 top-0 h-1/2 rounded-full pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.32) 0%, transparent 100%)' }} />
              <motion.div className="absolute pointer-events-none" style={{
                top: '-60%', left: '-60%', width: '220%', height: '220%',
                background: 'linear-gradient(45deg, transparent 35%, rgba(255,255,255,0.22) 50%, transparent 65%)',
              }}
                animate={{ x: ['-50%', '50%'] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'linear', repeatDelay: 1.2 }}
              />
              Seal this wish ✦
            </motion.button>
          </div>
        )}

        {sealed && (
          <motion.div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2"
            initial={{ scale: 0, rotate: -25 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 20 }}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{
              background: `radial-gradient(circle at 32% 28%, ${s.accent}dd, ${s.accent}99)`,
              boxShadow: `0 3px 12px ${s.accent}80, inset 0 1px 0 rgba(255,255,255,0.35)`,
              border: '1px solid rgba(255,255,255,0.38)', fontSize: 14,
            }}>✦</div>
          </motion.div>
        )}

        <div className="absolute top-0 right-0 pointer-events-none" style={{
          width: 0, height: 0, borderStyle: 'solid', borderWidth: '0 28px 28px 0',
          borderColor: `transparent ${s.border.replace('0.50', '0.85')} transparent transparent`,
        }} />
      </div>

      <AnimatePresence>
        {!sealed && !isExpanded && !isReceded && focusedIndex === null && (
          <motion.div
            className="absolute pointer-events-none"
            style={{ bottom: -28, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: [0.4, 0.65, 0.4], y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <p className="font-playfair italic" style={{ fontSize: 8.5, color: s.accent, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              hover to expand
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Response shimmer — shown while the genie thinks
// ─────────────────────────────────────────────────────────────
function ResponseShimmer({ accent, accentLight, border }: { accent: string; accentLight: string; border: string }) {
  return (
    <motion.div
      className="rounded-xl px-4 py-4"
      style={{
        background: `linear-gradient(135deg, ${accentLight.replace('0.55', '0.10')}, ${accentLight.replace('0.55', '0.05')})`,
        border: `1px solid ${border}`,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center gap-3">
        <motion.span
          style={{ fontSize: 13, color: accent }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
        >✦</motion.span>
        <div className="flex-1 flex flex-col gap-2">
          <motion.div
            className="rounded-full h-2.5"
            style={{ background: accentLight, width: '78%' }}
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="rounded-full h-2.5"
            style={{ background: accentLight, width: '55%' }}
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Genie Granted Message — with dynamic AI responses
// ─────────────────────────────────────────────────────────────
function GenieReveal({ wishes }: { wishes: [string, string, string] }) {
  const TITLE = "Your wishes have been heard.".split(' ');
  const [responses, setResponses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/genie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wishes }),
    })
      .then(r => r.json())
      .then(d => setResponses(Array.isArray(d.responses) ? d.responses : []))
      .catch(() => setResponses([]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      className="flex flex-col items-center gap-8 w-full max-w-[680px] mx-auto px-5 pt-24 pb-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
    >
      {/* Floating stars header */}
      <motion.div className="flex gap-3 items-center"
        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
      >
        {['✦', '✧', '★', '✧', '✦'].map((s, i) => (
          <motion.span key={i}
            style={{ fontSize: 14 + (i === 2 ? 4 : 0), color: i === 2 ? '#FFD700' : '#C41E3A' }}
            animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.2 + i * 0.3, repeat: Infinity, delay: i * 0.22, ease: 'easeInOut' }}
          >
            {s}
          </motion.span>
        ))}
      </motion.div>

      {/* Title */}
      <div className="text-center">
        <h2 className="font-playfair text-3xl md:text-4xl flex flex-wrap justify-center gap-x-3 gap-y-1.5">
          {TITLE.map((word, i) => (
            <motion.span key={i} className="inline-block"
              style={{
                background: 'linear-gradient(162deg, #1e293b 0%, #8B0000 45%, #1e293b 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                filter: 'drop-shadow(0 0 18px rgba(255,255,255,0.85))',
              }}
              initial={{ opacity: 0, y: 32, filter: 'blur(14px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 1.1, delay: 0.45 + i * 0.14, ease: EASE }}
            >
              {word}
            </motion.span>
          ))}
        </h2>
        <motion.p className="font-playfair italic mt-2.5"
          style={{ fontSize: 13.5, color: 'rgba(139,0,0,0.62)', letterSpacing: '0.18em' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 0.9 }}
        >
          — Your Genie speaks —
        </motion.p>
      </div>

      {/* Three wish cards */}
      <div className="flex flex-col gap-5 w-full">
        {wishes.map((wish, i) => {
          const ls = LETTER_STYLES[i];
          return (
            <motion.div key={i} className="relative rounded-[22px] overflow-hidden"
              style={{
                background: 'linear-gradient(148deg, rgba(255,255,255,0.78) 0%, rgba(255,250,255,0.60) 100%)',
                backdropFilter: 'blur(32px) saturate(180%)',
                WebkitBackdropFilter: 'blur(32px) saturate(180%)',
                border: `1px solid ${ls.border}`,
                boxShadow: `inset 0 1.5px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(255,255,255,0.30), 0 10px 45px rgba(0,0,0,0.09), 0 0 0 0.5px ${ls.accentLight}`,
              }}
              initial={{ opacity: 0, x: i % 2 === 0 ? -32 : 32, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.95, delay: 1.1 + i * 0.22, ease: EASE }}
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[22px]" style={{
                background: `linear-gradient(180deg, ${ls.accent}cc, ${ls.accent}44)`,
              }} />
              <div className="absolute inset-x-0 top-0 h-1/2 pointer-events-none" style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.42) 0%, transparent 100%)',
                borderRadius: '22px 22px 60% 60% / 22px 22px 32px 32px',
              }} />

              <div className="px-7 py-5 pl-8">
                <div className="flex items-center gap-2 mb-3">
                  <span style={{ fontSize: 16 }}>{ls.flower}</span>
                  <p className="font-playfair uppercase tracking-[0.22em]" style={{ fontSize: 9, color: ls.accent, opacity: 0.80 }}>
                    {ls.label}
                  </p>
                </div>

                <p className="font-playfair italic leading-relaxed" style={{ fontSize: 17, color: '#1e293b', lineHeight: 1.65 }}>
                  "{wish.trim() || 'A secret wish, held close to the heart'}"
                </p>

                <motion.div className="flex items-center gap-3 my-3.5"
                  initial={{ opacity: 0, scaleX: 0.4 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ duration: 0.7, delay: 1.5 + i * 0.22, ease: EASE }}
                >
                  <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${ls.accentLight})` }} />
                  <motion.span
                    style={{ fontSize: 11, color: ls.accent }}
                    animate={{ rotate: [0, 20, -20, 0], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
                  >✦</motion.span>
                  <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${ls.accentLight}, transparent)` }} />
                </motion.div>

                {/* ── Genie response — dynamic / loading shimmer ── */}
                <AnimatePresence mode="wait">
                  {loading ? (
                    <ResponseShimmer
                      key="shimmer"
                      accent={ls.accent}
                      accentLight={ls.accentLight}
                      border={ls.border}
                    />
                  ) : responses[i] ? (
                    <motion.div
                      key="response"
                      className="rounded-xl px-4 py-3"
                      style={{
                        background: `linear-gradient(135deg, ${ls.accentLight.replace('0.55', '0.12')}, ${ls.accentLight.replace('0.55', '0.05')})`,
                        border: `1px solid ${ls.border}`,
                      }}
                      initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.7, ease: EASE }}
                    >
                      <div className="flex items-start gap-2.5">
                        <motion.span
                          style={{ fontSize: 13, color: ls.accent, flexShrink: 0, paddingTop: 2 }}
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.5 }}
                        >✦</motion.span>
                        <p className="font-playfair italic leading-relaxed" style={{
                          fontSize: 14.5,
                          color: ls.accent,
                          letterSpacing: '0.03em',
                          lineHeight: 1.65,
                          filter: `drop-shadow(0 0 8px ${ls.accentLight})`,
                        }}>
                          {responses[i]}
                        </p>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Closing verse */}
      <motion.div className="text-center pb-4"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, delay: 2.2, ease: EASE }}
      >
        <p className="font-playfair font-semibold italic" style={{
          fontSize: 15.5, color: 'rgba(30,41,59,0.58)', letterSpacing: '0.08em', lineHeight: 2.1,
        }}>
          With all the magic woven into every spring day,<br />
          your wishes are written in the stars forever.
        </p>
        <motion.div className="flex justify-center gap-3 mt-5"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {['🌸', '✦', '🌸'].map((s, i) => <span key={i} style={{ fontSize: 20 }}>{s}</span>)}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Starfield + Night Sky Background
// ─────────────────────────────────────────────────────────────
function MagicBackground({ phase }: { phase: Phase | null }) {
  const isNight = phase !== null && phase !== 'granted';
  const isGranted = phase === 'granted';

  return (
    <motion.div className="fixed inset-0 pointer-events-none" style={{ zIndex: 31 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: phase !== null ? 1 : 0 }}
      transition={{ duration: 1.4, ease: EASE }}
    >
      {/* UPDATE THIS DIV: */}
      <motion.div className="absolute inset-0"
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
        animate={{
          background: isGranted
            ? 'rgba(255, 228, 240, 0.35)' // Sheer pink sky glass
            : 'rgba(6, 8, 26, 0.55)',     // Sheer night sky glass
        }}
        transition={{ duration: 1.8, ease: EASE }}
      />
      <AnimatePresence>
        {isNight && (
          <motion.div className="absolute inset-0 overflow-hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
          >
            {STARS.map(s => (
              <motion.div key={s.id} className="absolute rounded-full bg-white"
                style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size }}
                animate={{ opacity: [s.base * 0.35, s.base, s.base * 0.35], scale: [1, 1 + s.size * 0.12, 1] }}
                transition={{ duration: s.dur, repeat: Infinity, delay: s.delay, ease: 'easeInOut' }}
              />
            ))}
            <div className="absolute pointer-events-none" style={{
              top: '10%', left: '-10%', right: '-10%', height: '40%',
              background: 'radial-gradient(ellipse 120% 50% at 55% 50%, rgba(140,130,200,0.06) 0%, transparent 75%)',
              transform: 'rotate(-12deg)', filter: 'blur(22px)',
            }} />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isGranted && (
          <motion.div className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 1.4 }}
            style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 35%, rgba(255,215,0,0.10) 0%, transparent 70%)' }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Entrance floater animation
// ─────────────────────────────────────────────────────────────
function EntranceCue() {
  return (
    <motion.div className="absolute pointer-events-none text-center"
      style={{ top: -72, left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.9, ease: EASE }}
    >
      <p className="font-playfair italic tracking-[0.22em] text-white/55" style={{ fontSize: 10, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
        A sealed letter awaits you
      </p>
      <motion.div className="flex justify-center mt-2"
        animate={{ y: [0, 7, 0] }} transition={{ duration: 2.0, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
          <path d="M6 2 L6 13 M2 9 L6 13 L10 9" stroke="rgba(255,255,255,0.38)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Grant Wishes Button
// ─────────────────────────────────────────────────────────────
function GrantButton({ onGrant }: { onGrant: () => void }) {
  return (
    <motion.button onClick={onGrant}
      className="relative px-9 py-3.5 rounded-full font-playfair italic text-white overflow-hidden"
      style={{
        fontSize: 13.5, letterSpacing: '0.12em',
        background: 'linear-gradient(135deg, #8B0000 0%, #C41E3A 48%, #8B0000 100%)',
        boxShadow: `0 10px 36px rgba(196,30,58,0.58), inset 0 1.5px 0 rgba(255,210,190,0.42), 0 0 0 1px rgba(255,200,180,0.22)`,
      }}
      initial={{ opacity: 0, y: 36, scale: 0.82 }}
      animate={{
        opacity: 1, y: [0, -5, 0], scale: 1,
        transition: {
          opacity: { duration: 0.7, ease: EASE }, scale: { duration: 0.7, ease: EASE },
          y: { duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 0.8 },
        },
      }}
      exit={{ opacity: 0, y: 22, scale: 0.82, transition: { duration: 0.5, ease: EASE_IN } }}
      whileHover={{ scale: 1.07 }}
      whileTap={{ scale: 0.90 }}
    >
      <div className="absolute inset-x-0 top-0 h-1/2 rounded-full pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.24) 0%, transparent 100%)' }} />
      <motion.div className="absolute pointer-events-none" style={{
        top: '-60%', left: '-60%', width: '220%', height: '220%',
        background: 'linear-gradient(45deg, transparent 35%, rgba(255,235,220,0.22) 50%, transparent 65%)',
      }}
        animate={{ x: ['-55%', '55%'] }}
        transition={{ duration: 3.0, repeat: Infinity, ease: 'linear', repeatDelay: 1.6 }}
      />
      ✦ Grant My Wishes ✦
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────────────────────
export default function GenieWish() {
  const plantedCount = useStoryStore(s => s.plantedCount);

  const [phase, setPhase] = useState<Phase | null>(null);
  const [wishes, setWishes] = useState<[string, string, string]>(['', '', '']);
  const [sealed, setSealed] = useState<[boolean, boolean, boolean]>([false, false, false]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const allSealed = sealed.every(Boolean);
  const isComplete = plantedCount >= 5;

  useEffect(() => {
    if (isComplete && phase === null) {
      const t = setTimeout(() => setPhase('idle'), 5200);
      return () => clearTimeout(t);
    }
  }, [isComplete, phase]);

  useEffect(() => {
    if (plantedCount === 0 && phase !== null) {
      setPhase(null);
      setWishes(['', '', '']);
      setSealed([false, false, false]);
      setFocusedIndex(null);
    }
  }, [plantedCount, phase]);

  const handleSealBreak = useCallback(() => {
    setPhase('opening');
    setTimeout(() => setPhase('letters'), 950);
  }, []);

  const handleWishChange = useCallback((i: number, v: string) => {
    setWishes(prev => {
      const next = [...prev] as [string, string, string];
      next[i] = v;
      return next;
    });
  }, []);

  const handleSeal = useCallback((i: number) => {
    setSealed(prev => {
      const next = [...prev] as [boolean, boolean, boolean];
      next[i] = true;
      return next;
    });
    setFocusedIndex(null);
  }, []);

  const handleGrant = useCallback(() => {
    setPhase('sending');
    setTimeout(() => setPhase('granted'), 1550);
  }, []);

  if (phase === null) return null;

  const isSending = phase === 'sending';
  const showEnvelope = phase !== 'granted';
  const showLetters = phase === 'letters' || isSending;
  const isLetters = phase === 'letters';

  return (
    <>
      <MagicBackground phase={phase} />

      <AnimatePresence>
        {showEnvelope && (
          <motion.div key="scene"
            className="fixed inset-0 z-36 flex flex-col items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.6 } }}
          >
            <motion.div className="pointer-events-auto relative"
              animate={{ y: showLetters ? -155 : 0, scale: showLetters ? 0.72 : 1 }}
              transition={{ duration: 1.05, ease: EASE }}
            >
              <AnimatePresence>
                {phase === 'idle' && <EntranceCue key="cue" />}
              </AnimatePresence>
              <Envelope phase={phase} onSealBreak={handleSealBreak} />
            </motion.div>

            {/* ── Three letters — staggered fluid entrance ── */}
            <AnimatePresence>
              {showLetters && (
                <motion.div
                  key="letters"
                  className="absolute flex items-end justify-center pointer-events-auto overflow-visible"
                  style={{ bottom: '12%', left: 0, right: 0, height: 380 }}
                  initial={{ opacity: 1 }}
                  exit={{
                    opacity: 0,
                    transition: { duration: 0.4 },
                  }}
                >
                  {([0, 1, 2] as const).map(i => (
                    <WishLetter
                      key={i}
                      index={i}
                      value={wishes[i]}
                      onChange={(v) => handleWishChange(i, v)}
                      sealed={sealed[i]}
                      onSeal={() => handleSeal(i)}
                      isSending={isSending}
                      focusedIndex={focusedIndex}
                      onFocusChange={setFocusedIndex}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isLetters && allSealed && (
                <motion.div key="grant"
                  className="absolute bottom-[4%] left-1/2 -translate-x-1/2 pointer-events-auto z-50"
                >
                  <GrantButton onGrant={handleGrant} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'granted' && (
          <motion.div key="granted"
            className="fixed inset-0 z-36 flex overflow-y-auto overflow-x-hidden pointer-events-auto scroll-smooth"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9 }}
          >
            <div className="w-full min-h-full flex flex-col justify-start pb-24">
              <GenieReveal wishes={wishes} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}