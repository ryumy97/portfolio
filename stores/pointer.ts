import { create } from "zustand";

type PointerStore = {
  hover: {
    x: number;
    y: number;
    width: number;
    height: number;
    borderRadius: number;
  } | null;
  setHover: (hover: {
    x: number;
    y: number;
    width: number;
    height: number;
    borderRadius: number;
  }) => void;
  hoverOut: () => void;
};

const usePointerStore = create<PointerStore>((set) => ({
  hover: null,
  setHover: (hover) => set({ hover }),
  hoverOut: () => set({ hover: null }),
}));

export default usePointerStore;
