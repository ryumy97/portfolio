export type ImageParticlePointer = {
  x: number;
  y: number;
  active: boolean;
};

export type ImageParticlePointerParams = {
  radius: number;
  strength: number;
  stiffness: number;
  /** Per-frame velocity retention at 60fps, mapped across frame rates. */
  damping: number;
  maxSpeed: number;
};

export const IMAGE_PARTICLE_POINTER_DEFAULTS: ImageParticlePointerParams = {
  radius: 0.4,
  strength: 10,
  stiffness: 5,
  damping: 0.1,
  maxSpeed: 20,
};

const MAX_DELTA = 1 / 24;

/** Spring toward targets with pointer repulsion. */
export function integrateImageParticlePositions(
  display: Float32Array,
  velocity: Float32Array,
  target: Float32Array,
  alphas: Float32Array,
  pointer: ImageParticlePointer,
  delta: number,
  params: ImageParticlePointerParams,
) {
  const dt = Math.min(delta, MAX_DELTA);
  const accel = params.stiffness * dt;
  const forceScale = params.strength * dt;
  const damp = params.damping ** (dt * 60);
  const radiusSq = params.radius * params.radius;
  const maxSpeedSq = params.maxSpeed * params.maxSpeed;

  for (let i = 0; i < alphas.length; i++) {
    if (alphas[i] < 0.001) continue;

    const index = i * 3;
    const x = display[index];
    const y = display[index + 1];
    const z = display[index + 2];

    velocity[index] += (target[index] - x) * accel;
    velocity[index + 1] += (target[index + 1] - y) * accel;
    velocity[index + 2] += (target[index + 2] - z) * accel;

    if (pointer.active) {
      const dx = x - pointer.x;
      const dy = y - pointer.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < radiusSq && distSq > 1e-6) {
        const dist = Math.sqrt(distSq);
        const falloff = 1 - dist / params.radius;
        const push = forceScale * falloff * falloff;
        velocity[index] += (dx / dist) * push;
        velocity[index + 1] += (dy / dist) * push;
      }
    }

    velocity[index] *= damp;
    velocity[index + 1] *= damp;
    velocity[index + 2] *= damp;

    const speedSq =
      velocity[index] * velocity[index] +
      velocity[index + 1] * velocity[index + 1] +
      velocity[index + 2] * velocity[index + 2];

    if (speedSq > maxSpeedSq) {
      const scale = params.maxSpeed / Math.sqrt(speedSq);
      velocity[index] *= scale;
      velocity[index + 1] *= scale;
      velocity[index + 2] *= scale;
    }

    display[index] += velocity[index];
    display[index + 1] += velocity[index + 1];
    display[index + 2] += velocity[index + 2];
  }
}

export function dampImageParticleVelocities(
  velocity: Float32Array,
  factor: number,
) {
  for (let i = 0; i < velocity.length; i++) {
    velocity[i] *= factor;
  }
}
