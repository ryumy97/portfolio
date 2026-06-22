import type { Blob } from "./blob";
import type { Particle } from "./particle";

export type ParticleRef = {
  particle: Particle;
  blob: Blob;
  index: number;
};

export function collectParticleRefs(blobs: Blob[]): ParticleRef[] {
  return blobs.flatMap((blob) =>
    blob.particles.map((particle, index) => ({
      particle,
      blob,
      index,
    })),
  );
}

function areRingNeighbors(a: ParticleRef, b: ParticleRef) {
  if (a.blob !== b.blob) return false;

  const count = a.blob.particles.length;
  const diff = Math.abs(a.index - b.index);
  return Math.min(diff, count - diff) <= 1;
}

function resolvePair(a: Particle, b: Particle) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distSq = dx * dx + dy * dy;
  const minDist = a.radius + b.radius;
  if (distSq >= minDist * minDist) return;

  const dist = Math.max(distSq ** 0.5, 1e-6);
  const penetration = minDist - dist;
  const nx = dx / dist;
  const ny = dy / dist;
  const half = penetration * 0.5;

  a.x -= nx * half;
  a.y -= ny * half;
  b.x += nx * half;
  b.y += ny * half;
}

export function resolveParticleCollisions(refs: ParticleRef[], passes = 4) {
  for (let pass = passes; pass--; ) {
    for (let i = 0; i < refs.length; i++) {
      for (let j = i + 1; j < refs.length; j++) {
        const a = refs[i];
        const b = refs[j];
        if (!a || !b || areRingNeighbors(a, b)) continue;
        resolvePair(a.particle, b.particle);
      }
    }
  }
}
