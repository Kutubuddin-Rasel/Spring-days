import { create } from 'zustand';

interface StoryState {
  scrollProgress: number;
  setScrollProgress: (progress: number) => void;
  isAudioPlaying: boolean;
  toggleAudio: () => void;
  plantedCount: number;
  incrementPlantedCount: () => void;
  isHeroAnimating: boolean;
  setHeroAnimating: (val: boolean) => void;
}

export const useStoryStore = create<StoryState>((set) => ({
  scrollProgress: 0,
  setScrollProgress: (progress) => set({ scrollProgress: progress }),
  isAudioPlaying: false,
  toggleAudio: () => set((state) => ({ isAudioPlaying: !state.isAudioPlaying })),
  plantedCount: 0,
  incrementPlantedCount: () => set((state) => ({ plantedCount: state.plantedCount + 1 })),
  isHeroAnimating: false,
  setHeroAnimating: (val) => set({ isHeroAnimating: val }),
}));
