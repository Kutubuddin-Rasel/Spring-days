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

      // Simple and elegant fade-in and subtle float up
      gsap.fromTo(
        text,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          ease: "power2.out",
          scrollTrigger: {
            trigger: section,
            start: "top 70%", // Start fading in when the top of section is at 70% of viewport
            end: "center center", // Fully visible at center
            scrub: 2, // Smooth scrubbing
          }
        }
      );

      // Fade out as it goes up
      gsap.to(text, {
        opacity: 0,
        y: -30,
        ease: "power2.in",
        scrollTrigger: {
          trigger: section,
          start: "center center",
          end: "bottom 30%", // Fully faded out when bottom is at 30% of viewport
          scrub: 2,
        }
      });
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="relative w-full z-10 pointer-events-none">
      {/* 400vh total height (4 sections x 100vh) */}
      <section className="story-section h-screen flex items-center justify-center p-8">
        <p className="story-text text-2xl md:text-4xl lg:text-5xl font-playfair text-white/90 text-center leading-relaxed tracking-wide drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] max-w-4xl">
          Like the long winter in 'Spring Day', there are moments when the cold seems to linger, and the sky feels heavy...
        </p>
      </section>

      <section className="story-section h-screen flex items-center justify-center p-8">
        <p className="story-text text-2xl md:text-4xl lg:text-5xl font-playfair text-white/90 text-center leading-relaxed tracking-wide drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] max-w-4xl">
          But I've always admired how much you love the rain. It washes the world anew.
        </p>
      </section>
      <section className="story-section h-screen flex items-center justify-center p-8">
        <p className="story-text text-2xl md:text-4xl lg:text-5xl font-playfair text-slate-800 text-center leading-relaxed tracking-wide drop-shadow-sm max-w-4xl">
          And just like the sky after a storm, your true radiance shines brilliantly through any passing cloud.
        </p>
      </section>
      <section className="story-section h-screen flex items-center justify-center p-8">
        <p className="story-text text-2xl md:text-4xl lg:text-5xl font-playfair text-slate-800 text-center leading-relaxed tracking-wide drop-shadow-sm max-w-4xl">
          No matter how much the seasons change, my promise remains.
        </p>
      </section>
      <section className="story-section h-screen flex items-center justify-center p-8">
        <p className="story-text text-2xl md:text-4xl lg:text-5xl font-playfair text-slate-800 text-center leading-relaxed tracking-wide drop-shadow-sm max-w-4xl">
          I will walk beside you through every storm, cherishing the beautiful person you are inside and out.
        </p>
      </section>

      <section className="story-section h-screen flex items-center justify-center p-8">
        <p className="story-text text-2xl md:text-4xl lg:text-5xl font-playfair text-slate-800 text-center leading-relaxed tracking-wide drop-shadow-sm max-w-4xl">
          We only have to wait a little longer... until the spring days come.
        </p>
      </section>
      <section className="story-section h-screen flex items-center justify-center p-8">
        <p className="story-text text-2xl md:text-4xl lg:text-5xl font-playfair text-slate-800 text-center leading-relaxed tracking-wide drop-shadow-sm max-w-4xl">
          Because no winter lasts forever, and my favorite season will always be wherever you are.
        </p>
      </section>
    </div>
  );
}
