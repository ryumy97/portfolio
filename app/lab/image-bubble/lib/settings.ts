export type ImageBubbleSettings = {
  gravity: number;
  spring: number;
  damp: number;
  neighborMinLengthRatio: number;
  neighborMaxLengthRatio: number;
  neighborCompressStrength: number;
  neighborExtendStrength: number;
  skipOneMinLengthRatio: number;
  skipOneMaxLengthRatio: number;
  skipOneCompressStrength: number;
  skipOneExtendStrength: number;
  bridgeMinLengthRatio: number;
  bridgeMaxLengthRatio: number;
  bridgeCompressStrength: number;
  bridgeExtendStrength: number;
  constraintPasses: number;
  pointerRadius: number;
  pointerLerp: number;
};

export const IMAGE_BUBBLE_DEFAULTS: ImageBubbleSettings = {
  gravity: 8,
  spring: 1.5,
  damp: 0.98,
  neighborMinLengthRatio: 0.98,
  neighborMaxLengthRatio: 1.02,
  neighborCompressStrength: 0.75,
  neighborExtendStrength: 0.75,
  skipOneMinLengthRatio: 0.95,
  skipOneMaxLengthRatio: 1.05,
  skipOneCompressStrength: 0.5,
  skipOneExtendStrength: 0.5,
  bridgeMinLengthRatio: 0.6,
  bridgeMaxLengthRatio: 1.5,
  bridgeCompressStrength: 0.01,
  bridgeExtendStrength: 0.005,
  constraintPasses: 16,
  pointerRadius: 120,
  pointerLerp: 0.18,
};
