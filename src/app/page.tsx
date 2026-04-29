'use client';
import { useRef } from 'react';
import Scene from '@/components/canvas/Scene';
import AudioToggle from '@/components/ui/AudioToggle';
import StoryOverlay from '@/components/ui/StoryOverlay';
import PromisePlanting from '@/components/ui/PromisePlanting';
import EasterEggs from '@/components/ui/EasterEggs';
import { useStoryStore } from '@/store/useStoryStore';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function Home() {
  const setScrollProgress = useStoryStore(state => state.setScrollProgress);
  const mainRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    ScrollTrigger.create({
      trigger: mainRef.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        setScrollProgress(self.progress);
      }
    });
  }, { scope: mainRef });

  return (
    <main ref={mainRef} className="relative w-full bg-slate-950">
      <Scene />
      <AudioToggle />
      <StoryOverlay />
      <EasterEggs />
      <PromisePlanting />
      {/* Extra space at the end for the climax features to breathe */}
      <div className="h-[100vh] w-full" />
    </main>
  );
}