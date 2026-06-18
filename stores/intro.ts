import { create } from "zustand";

type IntroState = "start" | "transitioning" | "end";

interface IntroStore {
  state: IntroState;
  setState: (newState: IntroState) => void;
  progress: number;
  setProgress: (progress: number) => void;
}

export const useIntroStore = create<IntroStore>((set) => ({
  state: "start",
  setState: (newState) => set({ state: newState }),
  progress: 0,
  setProgress: (progress) => set({ progress }),
}));
