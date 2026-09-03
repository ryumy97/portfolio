import { create } from "zustand";
import { colorForPath } from "@/lib/page-color";
import { normalizePath } from "@/lib/page-href";
import { usePageColor } from "@/stores/page-color";

type PageTransitionState = {
  layer: "back" | "front";
  generation: number;
  pendingPath: string | null;
  covered: boolean;
  begin: (path: string) => void;
  markCovered: () => void;
  markRevealed: () => void;
};

export const usePageTransition = create<PageTransitionState>((set, get) => ({
  layer: "front",
  generation: 0,
  pendingPath: null,
  covered: false,
  begin: (path) => {
    const next = normalizePath(path);
    const nextColor = colorForPath(next);
    const { layer, pendingPath } = get();
    if (layer === "front") {
      if (pendingPath === next) return;
      usePageColor.getState().retarget(nextColor);
      set({ pendingPath: next });
      return;
    }
    usePageColor.getState().advance(nextColor);
    set({
      layer: "front",
      covered: false,
      pendingPath: next,
      generation: get().generation + 1,
    });
  },
  markCovered: () => set({ covered: true }),
  markRevealed: () => set({ layer: "back", pendingPath: null }),
}));
