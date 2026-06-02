import { create } from "zustand";

interface PartHoverStore {
  head: boolean;
  eye: boolean;
  hand: boolean;
  phone: boolean;
  setHeadHover: (hovered: boolean) => void;
  setEyeHover: (hovered: boolean) => void;
  setHandHover: (hovered: boolean) => void;
  setPhoneHover: (hovered: boolean) => void;
}

export const usePartHoverStore = create<PartHoverStore>((set) => ({
  head: false,
  eye: false,
  hand: false,
  phone: false,
  setHeadHover: (hovered) =>
    set({ head: hovered, eye: false, hand: false, phone: false }),
  setEyeHover: (hovered) =>
    set({ eye: hovered, head: false, hand: false, phone: false }),
  setHandHover: (hovered) =>
    set({ hand: hovered, head: false, eye: false, phone: false }),
  setPhoneHover: (hovered) =>
    set({ phone: hovered, head: false, eye: false, hand: false }),
}));
