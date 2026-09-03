import { create } from "zustand";
import { PAGE_COLOR, type Rgb } from "@/lib/page-color";

type PageColorState = {
  current: Rgb;
  previous: Rgb;
  reset: (pageColor: Rgb) => void;
  advance: (next: Rgb) => void;
  retarget: (next: Rgb) => void;
};

export const usePageColor = create<PageColorState>((set, get) => ({
  current: PAGE_COLOR.ivory,
  previous: PAGE_COLOR.ink,
  reset: (pageColor) => set({ previous: PAGE_COLOR.ink, current: pageColor }),
  advance: (next) => set({ previous: get().current, current: next }),
  retarget: (next) => set({ current: next }),
}));
