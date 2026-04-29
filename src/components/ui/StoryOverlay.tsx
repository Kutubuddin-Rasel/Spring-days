'use client';
import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function StoryOverlay() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const sections = gsap.utils.toArray('.story-section') as HTMLElement[];
    
    sections.forEach((section) => {
      const text = section.querySelector('.story-text');
      
      gsap.fromTo(
        text,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          scrollTrigger: {
            trigger: section,
            start: "top center",
            end: "center center",
            scrub: 1,
          }
        }
      );
      
      gsap.to(text, {
        opacity: 0,
        y: -50,
        scrollTrigger: {
          trigger: section,
          start: "center center",
          end: "bottom center",
          scrub: 1,
        }
      });
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="relative w-full z-10 pointer-events-none">
      {/* 400vh total height (4 sections x 100vh) */}
      <section className="story-section h-screen flex items-center justify-center p-8">
        <p className="story-text text-2xl md:text-4xl lg:text-5xl font-playfair text-white/90 text-center leading-relaxed tracking-wide drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] max-w-4xl">
          There are days when the sky feels heavy, and the cold seems to linger a little too long...
        </p>
      </section>
      
      <section className="story-section h-screen flex items-center justify-center p-8">
        <p className="story-text text-2xl md:text-4xl lg:text-5xl font-playfair text-white/90 text-center leading-relaxed tracking-wide drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] max-w-4xl">
          But I have always loved the rain. It washes the world anew, clearing the dust so the sky can breathe. And just like the sky, your light always shines beautifully through any passing cloud.
        </p>
      </section>
      
      <section className="story-section h-screen flex items-center justify-center p-8">
        <p className="story-text text-2xl md:text-4xl lg:text-5xl font-playfair text-slate-800 text-center leading-relaxed tracking-wide drop-shadow-sm max-w-4xl">
          So let me walk beside you through the storms. We only have to wait a little longer...
        </p>
      </section>

      <section className="story-section h-screen flex items-center justify-center p-8">
        <p className="story-text text-2xl md:text-4xl lg:text-5xl font-playfair text-slate-800 text-center leading-relaxed tracking-wide drop-shadow-sm max-w-4xl">
          ...until the spring days come. Because no winter lasts forever, and in every season, my favorite view is you.
        </p>
      </section>
    </div>
  );
}
