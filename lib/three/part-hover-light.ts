export type PartLightId = "head" | "eye" | "hand";

export const PART_LIGHT = {
  head: { color: "#f75d5d", intensity: 18 },
  eye: { color: "#ffc4bc", intensity: 14 },
  hand: { color: "#ffe2b8", intensity: 16 },
} as const;

export const SCENE_LIGHT = {
  ambient: { base: 8, dim: 2.2 },
  directional: { base: 2, dim: 0.6 },
} as const;

export function getLightIntensityTargets(hover: {
  head: boolean;
  eye: boolean;
  hand: boolean;
}) {
  const anyHovered = hover.head || hover.eye || hover.hand;

  return {
    head: hover.head ? PART_LIGHT.head.intensity : 0,
    eye: hover.eye ? PART_LIGHT.eye.intensity : 0,
    hand: hover.hand ? PART_LIGHT.hand.intensity : 0,
    ambient: anyHovered ? SCENE_LIGHT.ambient.dim : SCENE_LIGHT.ambient.base,
    directional: anyHovered
      ? SCENE_LIGHT.directional.dim
      : SCENE_LIGHT.directional.base,
  };
}
