'use client';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useStoryStore } from '@/store/useStoryStore';

export default function AudioToggle() {
  const { isAudioPlaying, toggleAudio } = useStoryStore();
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isAudioPlaying) {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isAudioPlaying]);

  return (
    <>
      <audio ref={audioRef} loop src="/audio/spring-day.mp3" />
      
      <button
        onClick={toggleAudio}
        className="fixed bottom-8 right-8 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white/80 hover:bg-white/10 hover:text-white hover:border-white/20 hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.15)] cursor-pointer overflow-hidden group"
        aria-label={isAudioPlaying ? "Pause music" : "Play music"}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        {isAudioPlaying ? (
          <div className="flex gap-[3px] items-end h-4 relative z-10">
            <motion.div animate={{ height: ["40%", "100%", "60%", "100%", "40%"] }} transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }} className="w-1 bg-current rounded-full" />
            <motion.div animate={{ height: ["80%", "40%", "100%", "50%", "80%"] }} transition={{ repeat: Infinity, duration: 1.0, ease: "easeInOut" }} className="w-1 bg-current rounded-full" />
            <motion.div animate={{ height: ["50%", "100%", "30%", "80%", "50%"] }} transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }} className="w-1 bg-current rounded-full" />
          </div>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-[2px] relative z-10">
            <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
          </svg>
        )}
      </button>
    </>
  );
}
