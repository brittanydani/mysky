import { create } from 'zustand';

interface CheckInInteractionState {
  liveMood: number;
  committedMood: number;
  setLiveMood: (value: number) => void;
  setCommittedMood: (value: number) => void;
  reset: () => void;
}

const DEFAULT_MOOD = 5;

export const useCheckInInteractionStore = create<CheckInInteractionState>((set) => ({
  liveMood: DEFAULT_MOOD,
  committedMood: DEFAULT_MOOD,

  setLiveMood: (value) =>
    set({
      liveMood: Math.max(0, Math.min(10, value)),
    }),

  setCommittedMood: (value) =>
    set({
      committedMood: Math.max(0, Math.min(10, value)),
    }),

  reset: () =>
    set({
      liveMood: DEFAULT_MOOD,
      committedMood: DEFAULT_MOOD,
    }),
}));

// Escape hatch for useFrame hot path — avoids subscribing the 3D scene to React
export const getLiveMood = () => useCheckInInteractionStore.getState().liveMood;
