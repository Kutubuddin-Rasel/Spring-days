'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useStoryStore } from '@/store/useStoryStore';

export default function EasterEggs() {
  const scrollProgress = useStoryStore((state) => state.scrollProgress);
  
  // Show only in the final 15% of the scroll
  const isVisible = scrollProgress > 0.85;

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
                className="pointer-events-auto cursor-pointer p-2 md:p-3 bg-white/80 backdrop-blur-md rounded shadow-lg flex flex-col items-center hover:scale-110 hover:rotate-0 hover:z-30 transition-transform duration-500 group"
              >
                <div className="w-20 h-24 md:w-28 md:h-32 bg-slate-200/50 rounded-sm mb-2 overflow-hidden relative flex items-center justify-center">
                   <span className="text-3xl group-hover:scale-110 transition-transform duration-500">🇯🇵</span>
                </div>
                <span className="font-playfair text-xs md:text-sm text-slate-800">Japan</span>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: -20, rotate: 6 }}
                animate={{ opacity: 1, y: 0, rotate: 4 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 1, delay: 0.4 }}
                className="pointer-events-auto cursor-pointer p-2 md:p-3 bg-white/80 backdrop-blur-md rounded shadow-lg flex flex-col items-center hover:scale-110 hover:rotate-0 hover:z-30 transition-transform duration-500 group"
              >
                <div className="w-20 h-24 md:w-28 md:h-32 bg-slate-200/50 rounded-sm mb-2 overflow-hidden relative flex items-center justify-center">
                   <span className="text-3xl group-hover:scale-110 transition-transform duration-500">🇰🇷</span>
                </div>
                <span className="font-playfair text-xs md:text-sm text-slate-800">South Korea</span>
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
                  className="pointer-events-auto cursor-pointer p-2 md:p-3 bg-white/80 backdrop-blur-md rounded shadow-lg flex flex-col items-center hover:scale-110 hover:rotate-0 hover:z-30 transition-transform duration-500 group"
                >
                  <div className="w-20 h-24 md:w-28 md:h-32 bg-slate-200/50 rounded-sm mb-2 overflow-hidden relative flex items-center justify-center">
                    <span className="text-3xl group-hover:scale-110 transition-transform duration-500">🇫🇷</span>
                  </div>
                  <span className="font-playfair text-xs md:text-sm text-slate-800">Paris</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20, rotate: 2 }}
                  animate={{ opacity: 1, x: 0, rotate: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 1, delay: 0.8 }}
                  className="pointer-events-auto cursor-pointer p-2 md:p-3 bg-white/80 backdrop-blur-md rounded shadow-lg flex flex-col items-center hover:scale-110 hover:rotate-0 hover:z-30 transition-transform duration-500 group hidden md:flex"
                >
                  <div className="w-20 h-24 md:w-28 md:h-32 bg-slate-200/50 rounded-sm mb-2 overflow-hidden relative flex items-center justify-center">
                    <span className="text-3xl group-hover:scale-110 transition-transform duration-500">🇨🇭</span>
                  </div>
                  <span className="font-playfair text-xs md:text-sm text-slate-800">Switzerland</span>
                </motion.div>
              </div>

              {/* Treats */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 1, delay: 1 }}
                className="flex flex-col gap-3 pointer-events-auto pl-4"
              >
                {['Cookies N Cream', 'Kinder Bueno', 'Ferrero Rocher', 'Kinder Joy'].map((treat, i) => (
                  <motion.div
                    key={treat}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + i * 0.2, duration: 0.8 }}
                    className="group flex items-center justify-end gap-2 cursor-pointer"
                  >
                    <span className="text-xs md:text-sm font-inter text-pink-800/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0">
                      {treat}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-white/40 backdrop-blur border border-white/40 shadow-sm flex items-center justify-center text-xs group-hover:bg-white/80 group-hover:scale-110 transition-all duration-300">
                      🍫
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
