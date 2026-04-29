'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStoryStore } from '@/store/useStoryStore';

const PROMISES = [
  "I promise to always be your umbrella in the monsoon, keeping you safe and dry.",
  "I promise to remind you every day of the beautiful, radiant person you are inside.",
  "I promise to hold your hand through every long winter, until the spring comes.",
  "I promise to respect, honor, and cherish everything that makes you who you are.",
  "I promise that my favorite view will always be the one with you in it."
];

interface Blossom {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

const FlowerSVG = () => (
  <svg viewBox="0 0 100 100" className="w-16 h-16 md:w-24 md:h-24 drop-shadow-[0_0_10px_rgba(244,114,182,0.8)]">
    <defs>
      <linearGradient id="petalGlow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fce7f3" />
        <stop offset="100%" stopColor="#f472b6" />
      </linearGradient>
    </defs>
    <motion.path
      d="M 50 50 C 30 10, 70 10, 50 50 C 90 30, 90 70, 50 50 C 70 90, 30 90, 50 50 C 10 70, 10 30, 50 50 Z"
      fill="none"
      stroke="url(#petalGlow)"
      strokeWidth="2"
      initial={{ pathLength: 0, fill: "rgba(244, 114, 182, 0)" }}
      animate={{ pathLength: 1, fill: "rgba(244, 114, 182, 0.4)" }}
      transition={{
        pathLength: { duration: 1.5, ease: "easeInOut" },
        fill: { duration: 1, delay: 1 }
      }}
    />
    <motion.circle
      cx="50" cy="50" r="4"
      fill="#fdf2f8"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 1.5, type: "spring" }}
    />
  </svg>
);

export default function PromisePlanting() {
  const scrollProgress = useStoryStore((state) => state.scrollProgress);
  const isVisible = scrollProgress > 0.90; // Triggers earlier to leave scroll space

  const [blossoms, setBlossoms] = useState<Blossom[]>([]);
  const [currentPromiseIndex, setCurrentPromiseIndex] = useState(-1);

  useEffect(() => {
    if (!isVisible) {
      setBlossoms([]);
      setCurrentPromiseIndex(-1);
    }
  }, [isVisible]);

  const handlePlant = () => {
    if (currentPromiseIndex >= PROMISES.length - 1) return;

    // Generate random positions around the screen for the blossoms
    const x = typeof window !== 'undefined' ? Math.random() * (window.innerWidth * 0.8) + (window.innerWidth * 0.1) : 0;
    const y = typeof window !== 'undefined' ? Math.random() * (window.innerHeight * 0.6) + (window.innerHeight * 0.1) : 0;
    const rotation = Math.random() * 360;
    const scale = 0.8 + Math.random() * 0.5;

    setBlossoms((prev) => [...prev, { id: Date.now(), x, y, rotation, scale }]);
    setCurrentPromiseIndex((prev) => prev + 1);
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0"
          >
            {/* The Central Seed / Plant Button */}
            <div className="absolute inset-x-0 bottom-16 md:bottom-24 flex justify-center items-center flex-col gap-6">
              <AnimatePresence>
                {currentPromiseIndex < PROMISES.length - 1 && (
                  <>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="font-playfair text-sm md:text-base text-slate-700 tracking-[0.2em] font-medium drop-shadow-[0_2px_10px_rgba(255,255,255,0.8)]"
                    >
                      {currentPromiseIndex === -1 ? "Touch the seed to bloom a promise" : "Keep blooming..."}
                    </motion.p>
                    <motion.button
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handlePlant}
                      className="pointer-events-auto relative w-16 h-16 rounded-full flex justify-center items-center cursor-pointer group"
                    >
                      {/* Outer Glow / Pulse */}
                      <div className="absolute inset-0 rounded-full bg-pink-300/30 animate-ping opacity-75" />
                      {/* Mid Ring */}
                      <div className="absolute inset-2 rounded-full border border-pink-400/50 group-hover:border-pink-400/80 transition-colors duration-500 shadow-[0_0_20px_rgba(244,114,182,0.6)]" />
                      {/* Core */}
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-white to-pink-200 shadow-[0_0_15px_#fff,0_0_30px_#fbcfe8] group-hover:shadow-[0_0_25px_#fff,0_0_50px_#fbcfe8] transition-all duration-500" />
                    </motion.button>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Planted Blossoms (SVG Animations) */}
            {blossoms.map((blossom) => (
              <motion.div
                key={blossom.id}
                initial={{ scale: 0, opacity: 0, rotate: blossom.rotation - 45 }}
                animate={{ scale: blossom.scale, opacity: 1, rotate: blossom.rotation }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="absolute pointer-events-none origin-center transform -translate-x-1/2 -translate-y-1/2"
                style={{ left: blossom.x, top: blossom.y }}
              >
                <FlowerSVG />
              </motion.div>
            ))}

            {/* Current Promise Display */}
            <AnimatePresence mode="wait">
              {currentPromiseIndex >= 0 && (
                <motion.div
                  key={currentPromiseIndex}
                  initial={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -20, scale: 0.95, filter: "blur(10px)" }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="absolute inset-x-0 top-1/3 flex justify-center pointer-events-none px-4 md:px-12"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-pink-500/10 blur-xl rounded-full" />
                    <p className="font-playfair text-2xl md:text-4xl lg:text-5xl text-white text-center max-w-4xl leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] font-medium">
                      {PROMISES[currentPromiseIndex]}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Completion Message */}
            <AnimatePresence>
              {currentPromiseIndex === PROMISES.length - 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5, duration: 2 }}
                  className="absolute inset-x-0 bottom-24 flex justify-center pointer-events-none"
                >
                  <p className="font-playfair text-lg md:text-xl text-slate-800 uppercase tracking-[0.4em] font-medium drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
                    Spring is finally here.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
