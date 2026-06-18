import * as THREE from "three";

const _va = new THREE.Vector3();
const _vb = new THREE.Vector3();
const _vc = new THREE.Vector3();
const _ab = new THREE.Vector3();
const _ac = new THREE.Vector3();
const _point = new THREE.Vector3();

type TriangleSampler = {
  positionAttr: THREE.BufferAttribute;
  index: THREE.BufferAttribute;
  cumulativeAreas: Float32Array;
  totalArea: number;
};

function triangleArea(
  positionAttr: THREE.BufferAttribute,
  i0: number,
  i1: number,
  i2: number,
): number {
  _va.fromBufferAttribute(positionAttr, i0);
  _vb.fromBufferAttribute(positionAttr, i1);
  _vc.fromBufferAttribute(positionAttr, i2);

  _ab.subVectors(_vb, _va);
  _ac.subVectors(_vc, _va);
  return _ab.cross(_ac).length() * 0.5;
}

function buildTriangleSampler(
  geometry: THREE.BufferGeometry,
): TriangleSampler | null {
  const index = geometry.index;
  const positionAttr = geometry.attributes.position as THREE.BufferAttribute;

  if (!index || index.count < 3) return null;

  const triangleCount = Math.floor(index.count / 3);
  const cumulativeAreas = new Float32Array(triangleCount);
  let totalArea = 0;

  for (let tri = 0; tri < triangleCount; tri++) {
    const area = triangleArea(
      positionAttr,
      index.getX(tri * 3),
      index.getX(tri * 3 + 1),
      index.getX(tri * 3 + 2),
    );
    totalArea += area;
    cumulativeAreas[tri] = totalArea;
  }

  if (totalArea <= 0) return null;

  return { positionAttr, index, cumulativeAreas, totalArea };
}

function randomBarycentric(): [number, number, number] {
  let u = Math.random();
  let v = Math.random();
  if (u + v > 1) {
    u = 1 - u;
    v = 1 - v;
  }
  return [u, v, 1 - u - v];
}

function pickTriangleIndex(sampler: TriangleSampler): number {
  const target = Math.random() * sampler.totalArea;
  const { cumulativeAreas } = sampler;

  let lo = 0;
  let hi = cumulativeAreas.length - 1;

  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cumulativeAreas[mid] < target) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }

  return lo;
}

function samplePointOnTriangle(
  positionAttr: THREE.BufferAttribute,
  i0: number,
  i1: number,
  i2: number,
): THREE.Vector3 {
  const [u, v, w] = randomBarycentric();

  _va.fromBufferAttribute(positionAttr, i0);
  _vb.fromBufferAttribute(positionAttr, i1);
  _vc.fromBufferAttribute(positionAttr, i2);

  return _point
    .set(0, 0, 0)
    .addScaledVector(_va, u)
    .addScaledVector(_vb, v)
    .addScaledVector(_vc, w);
}

/** Random surface points weighted by triangle area. */
export function sampleGeometrySurface(
  count: number,
  geometry: THREE.BufferGeometry,
): Float32Array {
  const sampler = buildTriangleSampler(geometry);
  const positions = new Float32Array(count * 3);

  if (!sampler) {
    return sampleGeometryVerticesRandom(count, geometry);
  }

  for (let i = 0; i < count; i++) {
    const tri = pickTriangleIndex(sampler);
    const { index, positionAttr } = sampler;
    const point = samplePointOnTriangle(
      positionAttr,
      index.getX(tri * 3),
      index.getX(tri * 3 + 1),
      index.getX(tri * 3 + 2),
    );

    const i3 = i * 3;
    positions[i3] = point.x;
    positions[i3 + 1] = point.y;
    positions[i3 + 2] = point.z;
  }

  return positions;
}

function sampleGeometryVerticesRandom(
  count: number,
  geometry: THREE.BufferGeometry,
): Float32Array {
  const positionAttr = geometry.attributes.position as THREE.BufferAttribute;
  const positions = new Float32Array(count * 3);
  const vertexCount = positionAttr.count;

  if (vertexCount === 0) return positions;

  for (let i = 0; i < count; i++) {
    const vertex = Math.floor(Math.random() * vertexCount);
    const i3 = i * 3;
    positions[i3] = positionAttr.getX(vertex);
    positions[i3 + 1] = positionAttr.getY(vertex);
    positions[i3 + 2] = positionAttr.getZ(vertex);
  }

  return positions;
}

export function lerpPositionSets(
  out: Float32Array,
  from: Float32Array,
  to: Float32Array,
  t: number,
) {
  const blend = THREE.MathUtils.clamp(t, 0, 1);

  for (let i = 0; i < out.length; i++) {
    out[i] = from[i] + (to[i] - from[i]) * blend;
  }
}
