'use client';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useRef } from 'react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const PHRASES = [
  "Like the long winter in 'Spring Day', there are moments when the cold seems to linger, and the sky feels heavy...",
  "But I've always admired how much you love the rain. It washes the world anew.",
  "And just like the sky after a storm, your true radiance shines brilliantly through any passing cloud.",
  "No matter how much the seasons change, my promise remains.",
  "I will walk beside you through every storm, cherishing the beautiful person you are inside and out.",
  "We only have to wait a little longer... until the spring days come.",
  "Because no winter lasts forever, and my favorite season will always be wherever you are."
];

export default function StoryOverlay() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 1, // Smooth scrubbing
      }
    });

    textRefs.current.forEach((text, i) => {
      if (!text) return;
      
      // Each phrase takes 4.5 units total. We overlap them by just 0.5 units 
      // so one finishes dissolving right as the next begins blooming.
      const startTime = i * 4; 
      
      // Cinematic blur-in (1.5 units)
      tl.fromTo(text, 
        { opacity: 0, y: 15, filter: "blur(12px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.5, ease: "power2.out" },
        startTime
      );
      
      // Cinematic blur-out (1.5 units)
      tl.to(text, 
        { opacity: 0, y: -15, filter: "blur(12px)", duration: 1.5, ease: "power2.in" },
        startTime + 3 // Hold for 1.5 units, then dissolve
      );
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="relative w-full z-10 pointer-events-none h-[700vh]">
      <div className="sticky top-0 h-screen w-full flex items-center justify-center p-8 overflow-hidden">
        {PHRASES.map((phrase, idx) => {
          // The background melts into spring pink starting around phrase 5.
          // Therefore, only phrases 5 and 6 should use the dark slate text color.
          const isDark = idx >= 5; 
          return (
            <p
              key={idx}
              ref={(el) => { textRefs.current[idx] = el; }}
              className={`absolute text-2xl md:text-4xl lg:text-5xl font-playfair text-center leading-relaxed tracking-wide max-w-4xl opacity-0 ${isDark
                  ? 'text-slate-800 drop-shadow-[0_2px_15px_rgba(255,255,255,0.8)]'
                  : 'text-slate-100 drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]'
                }`}
            >
              {phrase}
            </p>
          );
        })}
      </div>
    </div>
  );
}
