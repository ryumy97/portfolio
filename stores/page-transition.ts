import { create } from "zustand";
import {
  type GatherSide,
  oppositeGather,
  type ParticleField,
  type ParticleOrigin,
} from "@/lib/page-particle-field";

type Phase = "idle" | "collecting" | "covering";

type PageTransitionState = {
  covering: boolean;
  covered: boolean;
  leaveStarted: boolean;
  generation: number;
  phase: Phase;
  gatherSide: GatherSide;
  entryFrom: ParticleOrigin;
  particleField: ParticleField | null;
  startCover: (gatherSide: GatherSide) => void;
  markLeaveStarted: () => void;
  markCollected: () => void;
  markCovered: () => void;
  markRevealed: () => void;
  commitParticleField: (field: ParticleField) => void;
};

export const usePageTransition = create<PageTransitionState>((set, get) => ({
  covering: false,
  covered: false,
  leaveStarted: false,
  generation: 0,
  phase: "idle",
  gatherSide: "left",
  entryFrom: "all",
  particleField: null,
  startCover: (gatherSide) => {
    const { covering, particleField } = get();
    if (covering) return;
    const hasField = particleField !== null;
    set({
      covering: true,
      covered: false,
      leaveStarted: !hasField,
      gatherSide,
      entryFrom: hasField ? oppositeGather(gatherSide) : "all",
      generation: get().generation + 1,
      phase: hasField ? "collecting" : "covering",
    });
  },
  markLeaveStarted: () => {
    if (get().leaveStarted) return;
    set({ leaveStarted: true });
  },
  markCollected: () => {
    if (get().phase !== "collecting") return;
    set({ phase: "covering" });
  },
  markCovered: () => set({ covered: true }),
  markRevealed: () => set({ covering: false, phase: "idle" }),
  commitParticleField: (field) => set({ particleField: field }),
}));
