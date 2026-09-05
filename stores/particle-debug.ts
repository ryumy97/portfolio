import { create } from "zustand";

type ParticleDebugState = {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
};

function debugParamEnabled() {
  if (typeof window === "undefined") return false;
  const debug = new URLSearchParams(window.location.search).get("debug");
  return debug === "particles" || debug === "1";
}

export const useParticleDebug = create<ParticleDebugState>((set) => ({
  enabled: false,
  setEnabled: (enabled) => set({ enabled }),
}));

export function initParticleDebugFromUrl() {
  if (debugParamEnabled()) useParticleDebug.getState().setEnabled(true);
}
