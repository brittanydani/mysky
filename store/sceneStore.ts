import { create } from 'zustand';

export type SceneKey =
  | 'TODAY_WAVES'
  | 'CHECK_IN_SPHERE'
  | 'PATTERNS_ORBIT'
  | 'DREAM_MAP'
  | 'RESONANCE_HELIX'
  | null;

interface SceneState {
  activeScene: SceneKey;
  setActiveScene: (scene: SceneKey) => void;
  clearScene: () => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  activeScene: null,
  setActiveScene: (scene) => set({ activeScene: scene }),
  clearScene: () => set({ activeScene: null }),
}));
