export type ClipDebugState = {
  clipY: number;
  wave1: number;
  wave2: number;
  wave3: number;
  speed: number;
  color: string;
};

export const CLIP_DEBUG_DEFAULTS: ClipDebugState = {
  clipY: -0.3,
  wave1: 0.028,
  wave2: 0.02,
  wave3: 0.015,
  speed: 1,
  color: "#f06058",
};

export function createClipDebugState(
  overrides?: Partial<ClipDebugState>,
): ClipDebugState {
  return { ...CLIP_DEBUG_DEFAULTS, ...overrides };
}
