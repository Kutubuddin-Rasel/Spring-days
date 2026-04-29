import { create } from 'zustand';

interface StoryState {
  scrollProgress: number;
  setScrollProgress: (progress: number) => void;
  isAudioPlaying: boolean;
  toggleAudio: () => void;
}

export const useStoryStore = create<StoryState>((set) => ({
  scrollProgress: 0,
  setScrollProgress: (progress) => set({ scrollProgress: progress }),
  isAudioPlaying: false,
  toggleAudio: () => set((state) => ({ isAudioPlaying: !state.isAudioPlaying })),
}));
