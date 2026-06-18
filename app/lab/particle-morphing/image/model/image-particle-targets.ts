import type { ImageParticleSample } from "@/lib/three/sample-image-particles";

export const IMAGE_PARTICLE_TRANSITION_DURATION_S = 1;
export const INACTIVE_PARTICLE_Z = -8;

export function getMaxImageParticleCount(
  samples: ImageParticleSample[],
): number {
  return Math.max(...samples.map((sample) => sample.count));
}

export function createPaddedImageParticleTargets(
  sample: ImageParticleSample,
  maxCount: number,
) {
  const positions = new Float32Array(maxCount * 3);
  const colors = new Float32Array(maxCount * 3);
  const alphas = new Float32Array(maxCount);

  positions.set(sample.positions);
  colors.set(sample.colors);

  for (let i = 0; i < sample.count; i++) {
    alphas[i] = 1;
  }

  for (let i = sample.count; i < maxCount; i++) {
    const index = i * 3;
    positions[index] = 0;
    positions[index + 1] = 0;
    positions[index + 2] = INACTIVE_PARTICLE_Z;
    alphas[i] = 0;
  }

  return { positions, colors, alphas };
}
