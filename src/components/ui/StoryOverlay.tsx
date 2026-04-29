'use client';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';
import { useRef, useEffect } from 'react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

// ─────────────────────────────────────────────────────────────
//  Story phrases — each drives a full "beat" in the timeline
// ─────────────────────────────────────────────────────────────
const PHRASES = [
  "Like the long winter in 'Spring Day', there are moments when the cold seems to linger, and the sky feels heavy...",
  "But I've always admired how much you love the rain. It washes the world anew.",
  "And just like the sky after a storm, your true radiance shines brilliantly through any passing cloud.",
  "No matter how much the seasons change, my promise remains.",
  "I will walk beside you through every storm, cherishing the beautiful person you are inside and out.",
  "We only have to wait a little longer... until the spring days come.",
  "Because no winter lasts forever, and my favorite season will always be wherever you are."
];

// Phrases 5+ appear over a light spring background
const IS_DARK_BG = [false, false, false, false, false, true, true];

// Seconds each phrase holds at full opacity (in scrub-time units)
const HOLD_UNITS = 2.2;
// Transition units (blur-in / blur-out)
const TRANS_UNITS = 1.4;
// Total units per phrase
const PHRASE_UNITS = HOLD_UNITS + TRANS_UNITS * 2;
// Overlap with next phrase
const OVERLAP = 0.3;

export default function StoryOverlay() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  useGSAP(() => {
    // ── Master timeline, scrubbed by scroll ──
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.2,          // slight lag = Apple-smooth feel
        // Prevent sudden jumps
        anticipatePin: 1,
      },
    });

    PHRASES.forEach((_, i) => {
      const start = i * (PHRASE_UNITS - OVERLAP);

      // ── Blur + fade + lift IN ──
      tl.fromTo(
        textRefs.current[i],
        {
          opacity: 0,
          y: 28,
          filter: 'blur(18px)',
          scale: 0.97,
          willChange: 'transform, opacity, filter',
        },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          scale: 1,
          duration: TRANS_UNITS,
          ease: 'power3.out',
        },
        start,
      );

      // ── Hold (invisible tween — just advances timeline) ──
      tl.to(textRefs.current[i], { duration: HOLD_UNITS }, `<+=${TRANS_UNITS}`);

      // ── Blur + fade + push OUT ──
      tl.to(
        textRefs.current[i],
        {
          opacity: 0,
          y: -22,
          filter: 'blur(14px)',
          scale: 1.02,
          duration: TRANS_UNITS,
          ease: 'power2.in',
        },
        `<+=${HOLD_UNITS}`,
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, { scope: containerRef });

  // ── Height: enough scroll room for all phrases ──
  const scrollHeight = `${PHRASES.length * (PHRASE_UNITS - OVERLAP) * 100 + 100}vh`;

  return (
    <div
      ref={containerRef}
      className="relative w-full z-10 pointer-events-none"
      style={{ height: scrollHeight }}
    >
      {/* Sticky viewport */}
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
        {/* Vignette — subtle, purely atmospheric */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 40%, rgba(0,0,0,0.22) 100%)',
          }}
        />

        {PHRASES.map((phrase, idx) => {
          const dark = IS_DARK_BG[idx];
          return (
            <p
              key={idx}
              ref={el => { textRefs.current[idx] = el; }}
              className={[
                'absolute',
                'text-center',
                'font-playfair',
                'leading-[1.45]',
                'tracking-wide',
                'max-w-[780px]',
                'px-6',
                'opacity-0',
                // Responsive sizing
                'text-[clamp(1.25rem,3.5vw,3rem)]',
                // Text colour
                dark
                  ? 'text-slate-800 drop-shadow-[0_1px_12px_rgba(255,255,255,0.75)]'
                  : 'text-slate-50  drop-shadow-[0_2px_20px_rgba(0,0,0,0.65)]',
              ].join(' ')}
              // Promote to GPU layer from the start
              style={{ willChange: 'transform, opacity, filter' }}
            >
              {phrase}
            </p>
          );
        })}
      </div>
    </div>
  );
}