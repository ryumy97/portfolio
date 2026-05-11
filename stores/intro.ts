import { create } from "zustand";

type IntroState = "start" | "transitioning" | "end";

interface IntroStore {
  state: IntroState;
  setState: (newState: IntroState) => void;
}

export const useIntroStore = create<IntroStore>((set) => ({
  state: "start",
  setState: (newState) => set({ state: newState }),
}));
