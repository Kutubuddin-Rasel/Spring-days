import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStoryStore } from '@/store/useStoryStore';


const appleEase = [0.22, 1, 0.36, 1] as const;

export default function PromisePlanting() {
  const progress = useStoryStore(s => s.scrollProgress);
  const plantedCount = useStoryStore(s => s.plantedCount);
  const incrementPlantedCount = useStoryStore(s => s.incrementPlantedCount);
  const isHeroAnimating = useStoryStore(s => s.isHeroAnimating);
  
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const PROMISES = [
    "I promise to always be your safe place.",
    "I promise that my favorite view will always be the one with you in it.",
    "I promise to hold your hand through every spring.",
    "I promise to keep our shared dreams alive.",
    "I promise to love you, today and always.",
  ];

  // Helper hook for seed button 3D tilt
  const useTilt3D = () => {
    const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (isHeroAnimating) return; // Freeze tilt during hero
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      setTilt({ rotateX: -y / 4, rotateY: x / 4 });
    };
    const handleMouseLeave = () => setTilt({ rotateX: 0, rotateY: 0 });
    return { tilt, handleMouseMove, handleMouseLeave };
  };

  const { tilt, handleMouseMove, handleMouseLeave } = useTilt3D();

  useEffect(() => {
    if (progress < 0.95 && plantedCount > 0) {
      useStoryStore.setState({ plantedCount: 0, isHeroAnimating: false });
    }
  }, [progress, plantedCount]);

  if (progress < 0.98) return null;

  const handlePlant = (e: React.MouseEvent | React.TouchEvent) => {
    if (plantedCount >= PROMISES.length || isHeroAnimating) return;

    incrementPlantedCount();
    useStoryStore.setState({ isHeroAnimating: true });
  };

  const isComplete = plantedCount >= PROMISES.length;

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-30 overflow-hidden" style={{ perspective: '800px' }}>
      
      {/* ── Ethereal Breathing Aura for Text ── */}
      <AnimatePresence>
        {!isComplete && !isHeroAnimating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0.6, 1, 0.6], 
              scale: [1, 1.05, 1] 
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            {/* Highly optimized pure CSS radial gradient, incredibly smooth stops */}
            <div 
              className="w-[800px] h-[400px] rounded-[100%] mix-blend-overlay" 
              style={{ background: 'radial-gradient(50% 50% at 50% 50%, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.7) 30%, rgba(255, 255, 255, 0) 100%)' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Center Text Container (Promises OR Final Climax) ── */}
      <div className="absolute inset-0 flex items-center justify-center flex-col px-6">
        <AnimatePresence mode="wait">
          {!isComplete ? (
            <motion.div
              key={plantedCount}
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: isHeroAnimating ? 0 : 1, 
                y: isHeroAnimating ? 60 : 0 
              }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8, ease: appleEase }}
              className="text-center z-40 max-w-2xl pointer-events-none"
            >
              <h3 
                className="font-playfair leading-[1.45] tracking-wide text-[clamp(1.25rem,3.5vw,3rem)]"
                style={{ 
                  background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0px 0px 25px rgba(255,255,255,1)) drop-shadow(0px 0px 45px rgba(255,255,255,0.8)) drop-shadow(0px 4px 15px rgba(244,143,177,0.5))'
                }}
              >
                {PROMISES[plantedCount]}
              </h3>
            </motion.div>
          ) : (
            <motion.div
              key="climax"
              className="text-center z-50 pointer-events-auto"
            >
              <h2 className="font-playfair text-4xl md:text-6xl text-slate-900 tracking-widest uppercase flex flex-wrap justify-center gap-x-4 gap-y-2">
                {"Spring is finally here.".split(" ").map((word, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 40, filter: 'blur(12px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{
                      duration: 1.2,
                      delay: isHeroAnimating ? 2.5 + i * 0.15 : i * 0.15 + 0.5,
                      ease: appleEase
                    }}
                    className="inline-block"
                    style={{
                      background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: 'drop-shadow(0px 0px 15px rgba(255,255,255,1)) drop-shadow(0px 4px 10px rgba(244,143,177,0.4))'
                    }}
                  >
                    {word}
                  </motion.span>
                ))}
              </h2>
            </motion.div>
          )}
        </AnimatePresence>
      </div>


      {/* ── Vision Pro Breathing Seed Button ── */}
      <AnimatePresence>
        {!isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ 
              opacity: isHeroAnimating ? 0.4 : 1, 
              y: 0, 
              scale: isHeroAnimating ? 0.9 : 1 
            }}
            exit={{ opacity: 0, y: 50, scale: 0.8, filter: 'blur(10px)' }}
            transition={{ duration: 1, ease: appleEase }}
            className={`absolute bottom-16 md:bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6 z-40 ${isHeroAnimating ? 'pointer-events-none' : 'pointer-events-auto'}`}
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: isHeroAnimating ? 0 : 1 }}
              className="text-slate-600/80 font-playfair tracking-widest text-sm uppercase"
            >
              Touch the seed to bloom a promise
            </motion.p>
            
            {/* The Breathing Orb */}
            <motion.div 
              className="relative w-20 h-20 group cursor-pointer"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onClick={handlePlant}
              onTouchEnd={(e) => { e.preventDefault(); handlePlant(e); }}
              animate={{
                y: isHeroAnimating ? 0 : [0, -6, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {/* Contact Shadow (syncs with breathing) */}
              <motion.div 
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-14 h-4 bg-pink-900/30 blur-[10px] rounded-full transition-transform duration-500 group-hover:scale-110 group-active:scale-90"
                animate={{ scale: isHeroAnimating ? 1 : [1, 0.8, 1], opacity: isHeroAnimating ? 0.5 : [1, 0.6, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              
              {/* 3D Glass Body */}
              <motion.div 
                className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-200/50 to-pink-500/70 backdrop-blur-xl border border-white/60 overflow-hidden flex items-center justify-center transition-transform duration-300 ease-out"
                style={{
                  boxShadow: 'inset 0 -10px 20px rgba(216,27,96,0.6), inset 0 4px 10px rgba(255,255,255,0.8), 0 8px 24px rgba(0,0,0,0.15)',
                  transform: `perspective(400px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                animate={{ scale: isHeroAnimating ? 1 : [1, 1.04, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                {/* Glowing Deep Core */}
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-pink-400 to-rose-600 blur-[6px] opacity-90" />
                
                {/* Intense Specular Highlight (The Apple Gloss) */}
                <div className="absolute top-1 left-2 w-12 h-8 bg-gradient-to-b from-white to-transparent rounded-full blur-[1px] opacity-90 transform -rotate-[25deg]" style={{ clipPath: 'ellipse(50% 50% at 50% 30%)' }} />
                
                {/* Sweeping Light Beam */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent w-[200%] h-[200%] -top-1/2 -left-1/2 rotate-45"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
                />

                {/* Inner Caustic Bounce */}
                <div className="absolute bottom-1 right-2 w-10 h-6 bg-gradient-to-t from-pink-200 to-transparent rounded-full blur-[3px] opacity-70 transform rotate-[20deg]" />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
