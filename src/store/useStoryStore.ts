import { create } from 'zustand';

export type Season = 'winter' | 'spring';

interface StoryState {
  season: Season;
  setSeason: (season: Season) => void;
  scrollProgress: number;
  setScrollProgress: (progress: number) => void;
  isAudioPlaying: boolean;
  toggleAudio: () => void;
}

export const useStoryStore = create<StoryState>((set) => ({
  season: 'winter',
  setSeason: (season) => set({ season }),
  scrollProgress: 0,
  setScrollProgress: (progress) => set({ scrollProgress: progress }),
  isAudioPlaying: false,
  toggleAudio: () => set((state) => ({ isAudioPlaying: !state.isAudioPlaying })),
}));
