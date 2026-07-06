import { transform } from "motion";
import * as THREE from "three";
import { sampleGeometrySurface } from "@/lib/three/sample-geometry-surface";

export const SPHERE_VORTEX_DEFAULTS = {
  count: 50,
  radius: 1.5,
  angularSpeed: 1.4,
  particleSize: 0.035,
  lineWidth: 0.004,
  axisTilt: 0.35,
  particleColor: "#f75d5d",
  lineColor: "#f75d5d",
} as const;

export const SPHERE_VORTEX_BACKGROUND = "#f9f8f5";

export type SphereVortexConfig = {
  count: number;
  radius: number;
  angularSpeed: number;
  particleSize: number;
  lineWidth: number;
  axisTilt: number;
  particleColor: string;
  lineColor: string;
};

const _sphereGeometry = new THREE.SphereGeometry(1, 64, 48);
const _rotationAxis = new THREE.Vector3();

/** Nudge particles slightly outside the occluder shell to avoid surface z-fighting. */
export const PARTICLE_SHELL_OFFSET = 0.004;

export const TAIL_ARC_ANGLE = Math.PI * 2;
export const TAIL_SEGMENTS = 48;
export const ORBIT_TUBE_MIN_SCALE = 0.12;

export function sampleSphereSurface(
  count: number,
  radius: number,
): Float32Array {
  const positions = sampleGeometrySurface(count, _sphereGeometry);
  const shellRadius = radius * (1 + PARTICLE_SHELL_OFFSET);

  for (let i = 0; i < positions.length; i++) {
    positions[i] *= shellRadius;
  }

  return positions;
}

/** Per-particle multipliers sampled around 1 so the global speed slider still scales all orbits. */
export function sampleAngularSpeedFactors(
  count: number,
  spread = 0.6,
): Float32Array {
  const factors = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    factors[i] = 1 + spread * (Math.random() * 2 - 1);
  }
  return factors;
}

export function rotateAroundAxis(
  point: THREE.Vector3,
  axis: THREE.Vector3,
  angle: number,
  target: THREE.Vector3,
): THREE.Vector3 {
  const axial = axis.dot(point);
  _center.copy(axis).multiplyScalar(axial);
  _radial.copy(point).sub(_center);

  const orbitRadius = _radial.length();
  if (orbitRadius < 1e-6) {
    return target.copy(point);
  }

  _tangentU.copy(_radial).divideScalar(orbitRadius);
  _tangentV.crossVectors(axis, _tangentU).normalize();

  return target
    .copy(_center)
    .addScaledVector(_tangentU, Math.cos(angle) * orbitRadius)
    .addScaledVector(_tangentV, Math.sin(angle) * orbitRadius);
}

export type ParticleTailVertexRange = {
  start: number;
  count: number;
};

export type TrajectoryTailBuildResult = {
  geometry: THREE.BufferGeometry;
  initialPositions: Float32Array;
  particleVertexRanges: Array<ParticleTailVertexRange | null>;
};

export function advanceOrbitingParticles({
  particlePositions,
  initialParticlePositions,
  tailPositions,
  initialTailPositions,
  particleVertexRanges,
  angles,
  angularSpeedFactors,
  angularSpeed,
  axis,
  delta,
}: {
  particlePositions: Float32Array;
  initialParticlePositions: Float32Array;
  tailPositions: Float32Array | null;
  initialTailPositions: Float32Array | null;
  particleVertexRanges: Array<ParticleTailVertexRange | null>;
  angles: Float32Array;
  angularSpeedFactors: Float32Array;
  angularSpeed: number;
  axis: THREE.Vector3;
  delta: number;
}) {
  const particleCount = initialParticlePositions.length / 3;

  for (let i = 0; i < particleCount; i++) {
    angles[i] += angularSpeedFactors[i] * angularSpeed * delta;

    const i3 = i * 3;
    _particle.set(
      initialParticlePositions[i3],
      initialParticlePositions[i3 + 1],
      initialParticlePositions[i3 + 2],
    );
    rotateAroundAxis(_particle, axis, angles[i], _particle);
    particlePositions[i3] = _particle.x;
    particlePositions[i3 + 1] = _particle.y;
    particlePositions[i3 + 2] = _particle.z;

    if (!tailPositions || !initialTailPositions) continue;

    const range = particleVertexRanges[i];
    if (!range) continue;

    for (let vertex = 0; vertex < range.count; vertex++) {
      const vertexIndex = range.start + vertex;
      const v3 = vertexIndex * 3;
      _left.set(
        initialTailPositions[v3],
        initialTailPositions[v3 + 1],
        initialTailPositions[v3 + 2],
      );
      rotateAroundAxis(_left, axis, angles[i], _left);
      tailPositions[v3] = _left.x;
      tailPositions[v3 + 1] = _left.y;
      tailPositions[v3 + 2] = _left.z;
    }
  }
}

export function getRotationAxis(
  tilt: number,
  target = _rotationAxis,
): THREE.Vector3 {
  return target.set(Math.sin(tilt), Math.cos(tilt), 0).normalize();
}

/** Colatitude from the rotation axis: 0 at the pole, π/2 at the equator. */
export function getParticleColatitude(
  particle: THREE.Vector3,
  axis: THREE.Vector3,
): number {
  const shellRadius = particle.length();
  if (shellRadius < 1e-6) return 0;

  const cosColatitude = THREE.MathUtils.clamp(
    Math.abs(particle.dot(axis)) / shellRadius,
    -1,
    1,
  );
  return Math.acos(cosColatitude);
}

/** Tail width grows with angular distance from the rotation axis. */
export function getTailHalfWidth(
  colatitude: number,
  lineWidth: number,
): number {
  const angleFactor = Math.sin(colatitude);
  const widthScale =
    ORBIT_TUBE_MIN_SCALE + (1 - ORBIT_TUBE_MIN_SCALE) * angleFactor;
  return lineWidth * widthScale;
}

/**
 * Trajectory width: full behind the particle (visited), fading to 0 ahead (future path).
 * Angle 0 is the particle; negative angles trail along the rotation orbit.
 */
export function getTrailWidthScale(angle: number): number {
  return transform(angle, [0, -Math.PI * 2], [1, 0]);
}

const _particle = new THREE.Vector3();
const _center = new THREE.Vector3();
const _radial = new THREE.Vector3();
const _tangentU = new THREE.Vector3();
const _tangentV = new THREE.Vector3();
const _arcCenter = new THREE.Vector3();
const _arcAhead = new THREE.Vector3();
const _normal = new THREE.Vector3();
const _tangent = new THREE.Vector3();
const _side = new THREE.Vector3();
const _left = new THREE.Vector3();
const _right = new THREE.Vector3();

function getOrbitSurfacePoint(
  angle: number,
  shellRadius: number,
  target: THREE.Vector3,
) {
  return target
    .copy(_center)
    .addScaledVector(_tangentU, Math.cos(angle) * _radial.length())
    .addScaledVector(_tangentV, Math.sin(angle) * _radial.length())
    .normalize()
    .multiplyScalar(shellRadius);
}

/** Surface ribbon tails trailing behind each particle along its orbit. */
export function buildTrajectoryTailGeometry(
  particlePositions: Float32Array,
  lineWidth: number,
): TrajectoryTailBuildResult | null {
  const axis = getRotationAxis(SPHERE_VORTEX_DEFAULTS.axisTilt);
  const particleCount = particlePositions.length / 3;
  if (particleCount === 0) return null;

  const positions: number[] = [];
  const indices: number[] = [];
  const particleVertexRanges: Array<ParticleTailVertexRange | null> =
    Array.from({ length: particleCount }, () => null);
  let vertexBase = 0;

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    _particle.set(
      particlePositions[i3],
      particlePositions[i3 + 1],
      particlePositions[i3 + 2],
    );

    const shellRadius = _particle.length();
    const axial = _particle.dot(axis);
    _center.copy(axis).multiplyScalar(axial);
    _radial.copy(_particle).sub(_center);

    const orbitRadius = _radial.length();
    if (orbitRadius < 1e-4) continue;

    const tailVertexStart = vertexBase;
    _tangentU.copy(_radial).divideScalar(orbitRadius);
    _tangentV.crossVectors(axis, _tangentU).normalize();

    const maxHalfWidth = getTailHalfWidth(
      getParticleColatitude(_particle, axis),
      lineWidth,
    );

    for (let segment = 0; segment < TAIL_SEGMENTS; segment++) {
      const angle = (-TAIL_ARC_ANGLE * segment) / TAIL_SEGMENTS;
      const halfWidth = maxHalfWidth * getTrailWidthScale(angle);

      getOrbitSurfacePoint(angle, shellRadius, _arcCenter);

      getOrbitSurfacePoint(angle - 0.01, shellRadius, _arcAhead);
      _tangent.subVectors(_arcCenter, _arcAhead).normalize();

      _normal.copy(_arcCenter).normalize();
      _side.crossVectors(_tangent, _normal).normalize();

      _left
        .copy(_arcCenter)
        .addScaledVector(_side, halfWidth)
        .normalize()
        .multiplyScalar(shellRadius);
      _right
        .copy(_arcCenter)
        .addScaledVector(_side, -halfWidth)
        .normalize()
        .multiplyScalar(shellRadius);

      positions.push(_left.x, _left.y, _left.z);
      positions.push(_right.x, _right.y, _right.z);
    }

    for (let segment = 0; segment < TAIL_SEGMENTS - 1; segment++) {
      const next = (segment + 1) % TAIL_SEGMENTS;
      const row = vertexBase + segment * 2;
      const nextRow = vertexBase + next * 2;
      indices.push(row, row + 1, nextRow);
      indices.push(row + 1, nextRow + 1, nextRow);
    }

    particleVertexRanges[i] = {
      start: tailVertexStart,
      count: TAIL_SEGMENTS * 2,
    };
    vertexBase += TAIL_SEGMENTS * 2;
  }

  if (positions.length === 0) return null;

  const initialPositions = new Float32Array(positions);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(initialPositions.slice(), 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return { geometry, initialPositions, particleVertexRanges };
}
