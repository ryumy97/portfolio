export type ImageParticleWaveParams = {
  amplitudeX: number;
  amplitudeY: number;
  frequencyX: number;
  frequencyY: number;
  phaseScaleX: number;
  phaseScaleY: number;
  timeScale: number;
  /** Per-particle frequency spread around 1.0 (e.g. 0.4 -> 0.6x to 1.4x). */
  frequencyJitter: number;
};

export const IMAGE_PARTICLE_WAVE_SEED = 9137;

export const IMAGE_PARTICLE_WAVE_DEFAULTS: ImageParticleWaveParams = {
  amplitudeX: 0.008,
  amplitudeY: 0.008,
  frequencyX: 15,
  frequencyY: 10,
  phaseScaleX: 1,
  phaseScaleY: 1,
  timeScale: 1,
  frequencyJitter: 0.45,
};

export type ImageParticleWaveFactors = {
  frequencyX: Float32Array;
  frequencyY: Float32Array;
};

function pseudoRandom01(
  particleIndex: number,
  channel: number,
  seed: number,
): number {
  let state = (seed + particleIndex * 374761 + channel * 668265) >>> 0;
  state = (state + 0x6d2b79f5) >>> 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Stable per-particle frequency multipliers derived from a seeded hash. */
export function createImageParticleWaveFactors(
  maxCount: number,
  jitter = IMAGE_PARTICLE_WAVE_DEFAULTS.frequencyJitter,
  seed = IMAGE_PARTICLE_WAVE_SEED,
): ImageParticleWaveFactors {
  const frequencyX = new Float32Array(maxCount);
  const frequencyY = new Float32Array(maxCount);

  for (let i = 0; i < maxCount; i++) {
    frequencyX[i] = 1 + (pseudoRandom01(i, 1, seed) * 2 - 1) * jitter;
    frequencyY[i] = 1 + (pseudoRandom01(i, 2, seed) * 2 - 1) * jitter;
  }

  return { frequencyX, frequencyY };
}

/** Write per-particle xy wave offsets from independent sin waves on target positions. */
export function computeImageParticleWaveOffsets(
  offsets: Float32Array,
  targetPositions: Float32Array,
  alphas: Float32Array,
  factors: ImageParticleWaveFactors,
  time: number,
  params: ImageParticleWaveParams,
) {
  const waveTime = time * params.timeScale;

  for (let i = 0; i < alphas.length; i++) {
    const index = i * 3;

    if (alphas[i] < 0.001) {
      offsets[index] = 0;
      offsets[index + 1] = 0;
      offsets[index + 2] = 0;
      continue;
    }

    const x = targetPositions[index];
    const y = targetPositions[index + 1];

    offsets[index] =
      Math.sin(
        waveTime * params.frequencyX * factors.frequencyX[i] +
          x * params.phaseScaleX,
      ) * params.amplitudeX;
    offsets[index + 1] =
      Math.sin(
        waveTime * params.frequencyY * factors.frequencyY[i] +
          y * params.phaseScaleY,
      ) * params.amplitudeY;
    offsets[index + 2] = 0;
  }
}

export function addPositionOffsets(
  out: Float32Array,
  base: Float32Array,
  offsets: Float32Array,
) {
  for (let i = 0; i < out.length; i++) {
    out[i] = base[i] + offsets[i];
  }
}
