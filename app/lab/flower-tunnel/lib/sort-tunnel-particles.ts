import type * as THREE from "three";

export type TunnelParticleSortBuffers = {
  indices: Uint32Array;
  distances: Float32Array;
  positionScratch: Float32Array;
  typeScratch: Float32Array;
  rotationScratch: Float32Array;
};

export function createTunnelParticleSortBuffers(
  count: number,
): TunnelParticleSortBuffers {
  return {
    indices: new Uint32Array(count),
    distances: new Float32Array(count),
    positionScratch: new Float32Array(count * 3),
    typeScratch: new Float32Array(count),
    rotationScratch: new Float32Array(count),
  };
}

export function sortTunnelParticlesBackToFront(
  geometry: THREE.BufferGeometry,
  cameraPosition: THREE.Vector3,
  buffers: TunnelParticleSortBuffers,
) {
  const positionAttr = geometry.getAttribute("position");
  const typeAttr = geometry.getAttribute("particleType");
  const rotationAttr = geometry.getAttribute("rotation");
  const count = positionAttr.count;
  const positions = positionAttr.array as Float32Array;
  const types = typeAttr.array as Float32Array;
  const rotations = rotationAttr.array as Float32Array;

  const { indices, distances, positionScratch, typeScratch, rotationScratch } =
    buffers;

  const cx = cameraPosition.x;
  const cy = cameraPosition.y;
  const cz = cameraPosition.z;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const dx = positions[i3] - cx;
    const dy = positions[i3 + 1] - cy;
    const dz = positions[i3 + 2] - cz;
    distances[i] = dx * dx + dy * dy + dz * dz;
    indices[i] = i;
  }

  indices.sort((a, b) => distances[b] - distances[a]);

  for (let i = 0; i < count; i++) {
    const src = indices[i];
    const dst3 = i * 3;
    const src3 = src * 3;
    positionScratch[dst3] = positions[src3];
    positionScratch[dst3 + 1] = positions[src3 + 1];
    positionScratch[dst3 + 2] = positions[src3 + 2];
    typeScratch[i] = types[src];
    rotationScratch[i] = rotations[src];
  }

  positions.set(positionScratch.subarray(0, count * 3));
  types.set(typeScratch.subarray(0, count));
  rotations.set(rotationScratch.subarray(0, count));

  positionAttr.needsUpdate = true;
  typeAttr.needsUpdate = true;
  rotationAttr.needsUpdate = true;
}
