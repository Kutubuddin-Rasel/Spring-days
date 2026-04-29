'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useStoryStore } from '@/store/useStoryStore';

export default function EasterEggs() {
  const scrollProgress = useStoryStore((state) => state.scrollProgress);
  
  // Show only in the final 20% of the scroll
  const isVisible = scrollProgress > 0.80;

  return (
    <div className="fixed inset-0 pointer-events-none z-20 flex flex-col justify-between p-4 md:p-12 overflow-hidden">
      <AnimatePresence>
        {isVisible && (
          <>
            {/* Top Row: Travel Destinations (Polaroids) */}
            <div className="w-full flex justify-between items-start">
              <motion.div
                initial={{ opacity: 0, y: -20, rotate: -6 }}
                animate={{ opacity: 1, y: 0, rotate: -3 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="pointer-events-auto cursor-pointer p-3 md:p-4 bg-[#fdfbf7] rounded-sm shadow-[0_10px_20px_rgba(0,0,0,0.1)] flex flex-col items-center hover:scale-110 hover:rotate-0 hover:z-30 transition-all duration-500 group relative border border-slate-200/60"
              >
                {/* Washi Tape */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-6 bg-white/40 backdrop-blur-sm shadow-sm rotate-2 z-10" />
                <div className="w-24 h-28 md:w-32 md:h-36 bg-slate-200/50 rounded-sm mb-3 overflow-hidden relative flex items-center justify-center shadow-inner">
                   <span className="text-4xl group-hover:scale-110 transition-transform duration-500">🇯🇵</span>
                </div>
                <span className="font-playfair italic text-sm md:text-base text-slate-700 tracking-wide">Japan</span>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: -20, rotate: 6 }}
                animate={{ opacity: 1, y: 0, rotate: 4 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 1, delay: 0.4 }}
                className="pointer-events-auto cursor-pointer p-3 md:p-4 bg-[#fdfbf7] rounded-sm shadow-[0_10px_20px_rgba(0,0,0,0.1)] flex flex-col items-center hover:scale-110 hover:rotate-0 hover:z-30 transition-all duration-500 group relative border border-slate-200/60"
              >
                {/* Washi Tape */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-6 bg-white/40 backdrop-blur-sm shadow-sm -rotate-3 z-10" />
                <div className="w-24 h-28 md:w-32 md:h-36 bg-slate-200/50 rounded-sm mb-3 overflow-hidden relative flex items-center justify-center shadow-inner">
                   <span className="text-4xl group-hover:scale-110 transition-transform duration-500">🇰🇷</span>
                </div>
                <span className="font-playfair italic text-sm md:text-base text-slate-700 tracking-wide">South Korea</span>
              </motion.div>
            </div>

            {/* Bottom Row: Travel & Treats */}
            <div className="w-full flex justify-between items-end pb-16 md:pb-0">
              <div className="flex gap-4 items-end">
                <motion.div
                  initial={{ opacity: 0, x: -20, rotate: -4 }}
                  animate={{ opacity: 1, x: 0, rotate: -2 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 1, delay: 0.6 }}
                  className="pointer-events-auto cursor-pointer p-3 md:p-4 bg-[#fdfbf7] rounded-sm shadow-[0_10px_20px_rgba(0,0,0,0.1)] flex flex-col items-center hover:scale-110 hover:rotate-0 hover:z-30 transition-all duration-500 group relative border border-slate-200/60"
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-6 bg-white/40 backdrop-blur-sm shadow-sm rotate-1 z-10" />
                  <div className="w-24 h-28 md:w-32 md:h-36 bg-slate-200/50 rounded-sm mb-3 overflow-hidden relative flex items-center justify-center shadow-inner">
                    <span className="text-4xl group-hover:scale-110 transition-transform duration-500">🇫🇷</span>
                  </div>
                  <span className="font-playfair italic text-sm md:text-base text-slate-700 tracking-wide">Paris</span>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, x: -20, rotate: 2 }}
                  animate={{ opacity: 1, x: 0, rotate: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 1, delay: 0.8 }}
                  className="pointer-events-auto cursor-pointer p-3 md:p-4 bg-[#fdfbf7] rounded-sm shadow-[0_10px_20px_rgba(0,0,0,0.1)] flex flex-col items-center hover:scale-110 hover:rotate-0 hover:z-30 transition-all duration-500 group relative border border-slate-200/60 hidden md:flex"
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-6 bg-white/40 backdrop-blur-sm shadow-sm -rotate-2 z-10" />
                  <div className="w-24 h-28 md:w-32 md:h-36 bg-slate-200/50 rounded-sm mb-3 overflow-hidden relative flex items-center justify-center shadow-inner">
                    <span className="text-4xl group-hover:scale-110 transition-transform duration-500">🇨🇭</span>
                  </div>
                  <span className="font-playfair italic text-sm md:text-base text-slate-700 tracking-wide">Switzerland</span>
                </motion.div>
              </div>

              {/* Treats */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 1, delay: 1 }}
                className="flex flex-col gap-4 pointer-events-auto pl-4"
              >
                {['Cookies N Cream', 'Kinder Bueno', 'Ferrero Rocher', 'Kinder Joy'].map((treat, i) => (
                  <motion.div
                    key={treat}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + i * 0.2, duration: 0.8 }}
                    className="group flex items-center justify-end gap-3 cursor-pointer"
                  >
                    <span className="text-xs md:text-sm font-playfair italic text-slate-700 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0 tracking-widest drop-shadow-sm">
                      {treat}
                    </span>
                    {/* Minimalist Truffle Button */}
                    <div className="relative w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-[#4a2e1b] to-[#2c1b0f] border border-[#d4af37]/60 shadow-[0_4px_10px_rgba(44,27,15,0.4)] flex items-center justify-center group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all duration-300">
                      <div className="w-4 h-4 md:w-5 md:h-5 rounded-full border border-[#d4af37]/30" />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
