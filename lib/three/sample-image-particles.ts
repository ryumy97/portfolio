export type ImageParticleSample = {
  positions: Float32Array;
  colors: Float32Array;
  count: number;
};

/** Reference raster size used to convert `step` into normalized UV spacing. */
export const IMAGE_PARTICLE_REFERENCE_SIZE = 512;
export const IMAGE_PARTICLE_SHUFFLE_SEED = 42;

export type SampleImageParticlesOptions = {
  /** Grid spacing relative to {@link IMAGE_PARTICLE_REFERENCE_SIZE}. */
  step?: number;
  /** Pixels below this alpha value are skipped. */
  alphaThreshold?: number;
  /** Shuffle particle order after sampling while keeping position/color pairs. */
  shuffle?: boolean;
  /** Seed for deterministic shuffle order. */
  shuffleSeed?: number;
};

function createSeededRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates order where `order[dest]` is the source index moved to `dest`. */
export function createParticleIndexOrder(
  count: number,
  seed: number,
): number[] {
  const order = Array.from({ length: count }, (_, index) => index);
  if (count <= 1) return order;

  const random = createSeededRandom(seed);

  for (let index = count - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = order[index];
    order[index] = order[swapIndex];
    order[swapIndex] = current;
  }

  return order;
}

/** Reorder particles so each destination keeps its position and color together. */
export function shuffleImageParticleSample(
  sample: ImageParticleSample,
  order: number[],
): ImageParticleSample {
  const { count } = sample;
  if (count <= 1) return sample;

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let dest = 0; dest < count; dest++) {
    const src = order[dest];
    const dest3 = dest * 3;
    const src3 = src * 3;

    positions[dest3] = sample.positions[src3];
    positions[dest3 + 1] = sample.positions[src3 + 1];
    positions[dest3 + 2] = sample.positions[src3 + 2];
    colors[dest3] = sample.colors[src3];
    colors[dest3 + 1] = sample.colors[src3 + 1];
    colors[dest3 + 2] = sample.colors[src3 + 2];
  }

  return { positions, colors, count };
}

/** Map a global shuffle into a sample while keeping shared ordering across counts. */
export function createProjectedParticleOrder(
  globalOrder: number[],
  count: number,
): number[] {
  const rank = new Map(globalOrder.map((source, index) => [source, index]));

  return Array.from({ length: count }, (_, source) => source).sort(
    (a, b) => (rank.get(a) ?? 0) - (rank.get(b) ?? 0),
  );
}

function getImageDimensions(image: CanvasImageSource): {
  width: number;
  height: number;
} {
  if (image instanceof HTMLImageElement) {
    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
    };
  }

  if (image instanceof HTMLVideoElement) {
    return {
      width: image.videoWidth,
      height: image.videoHeight,
    };
  }

  if (image instanceof ImageBitmap) {
    return {
      width: image.width,
      height: image.height,
    };
  }

  if (image instanceof HTMLCanvasElement || image instanceof OffscreenCanvas) {
    return {
      width: image.width,
      height: image.height,
    };
  }

  if (image instanceof SVGImageElement) {
    return {
      width: image.width.baseVal.value,
      height: image.height.baseVal.value,
    };
  }

  throw new Error("Unsupported image source for particle sampling.");
}

/** Sample an image into particle positions and per-vertex colors on a regular grid. */
export function sampleImageParticles(
  image: CanvasImageSource,
  {
    step = 4,
    alphaThreshold = 16,
    shuffle = true,
    shuffleSeed = IMAGE_PARTICLE_SHUFFLE_SEED,
  }: SampleImageParticlesOptions = {},
): ImageParticleSample {
  const { width, height } = getImageDimensions(image);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return {
      positions: new Float32Array(0),
      colors: new Float32Array(0),
      count: 0,
    };
  }

  context.drawImage(image, 0, 0, width, height);
  const { data } = context.getImageData(0, 0, width, height);

  const positions: number[] = [];
  const colors: number[] = [];
  const uvStep = step / IMAGE_PARTICLE_REFERENCE_SIZE;
  const maxDimension = Math.max(width, height);
  const worldWidth = (width / maxDimension) * 2;
  const worldHeight = (height / maxDimension) * 2;

  for (let v = uvStep * 0.5; v < 1; v += uvStep) {
    for (let u = uvStep * 0.5; u < 1; u += uvStep) {
      const x = Math.min(width - 1, Math.floor(u * width));
      const y = Math.min(height - 1, Math.floor(v * height));
      const index = (y * width + x) * 4;
      const alpha = data[index + 3];
      if (alpha < alphaThreshold) continue;

      positions.push((u - 0.5) * worldWidth, -((v - 0.5) * worldHeight), 0);
      colors.push(
        data[index] / 255,
        data[index + 1] / 255,
        data[index + 2] / 255,
      );
    }
  }

  const sample = {
    positions: new Float32Array(positions),
    colors: new Float32Array(colors),
    count: positions.length / 3,
  };

  if (!shuffle || sample.count <= 1) {
    return sample;
  }

  const order = createParticleIndexOrder(sample.count, shuffleSeed);
  return shuffleImageParticleSample(sample, order);
}
