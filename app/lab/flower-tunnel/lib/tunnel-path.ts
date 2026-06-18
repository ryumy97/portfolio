import * as THREE from "three";

const _position = new THREE.Vector3();
const _tangent = new THREE.Vector3();
const _normal = new THREE.Vector3();
const _binormal = new THREE.Vector3();
const _offset = new THREE.Vector3();
const _worldUp = new THREE.Vector3(0, 1, 0);
const _altUp = new THREE.Vector3(1, 0, 0);
const _handleA = new THREE.Vector3();
const _handleB = new THREE.Vector3();
const _chord = new THREE.Vector3();

/** Anchor points the path passes through. Handles are derived for C1 continuity. */
const PATH_ANCHORS: THREE.Vector3[] = [
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(6, 2, -4),
  new THREE.Vector3(10, 0, 0),
  new THREE.Vector3(6, -2, 4),
  new THREE.Vector3(0, 0, 8),
  new THREE.Vector3(-6, 2, 4),
  new THREE.Vector3(-10, 0, 0),
  new THREE.Vector3(-6, -2, -4),
];

/** Handle length as a fraction of the chord to the next anchor. Lower = gentler bends. */
const BEZIER_TENSION = 0.22;

export type TunnelCurve = THREE.CurvePath<THREE.Vector3>;

function smoothBezierHandles(
  prev: THREE.Vector3,
  start: THREE.Vector3,
  end: THREE.Vector3,
  next: THREE.Vector3,
  tension: number,
  cp1: THREE.Vector3,
  cp2: THREE.Vector3,
) {
  _chord.subVectors(end, start);
  const chordLength = _chord.length();
  if (chordLength < 1e-6) {
    cp1.copy(start);
    cp2.copy(end);
    return;
  }

  const handleScale = chordLength * tension;

  _handleA.subVectors(end, prev).normalize().multiplyScalar(handleScale);
  _handleB.subVectors(next, start).normalize().multiplyScalar(handleScale);

  cp1.copy(start).add(_handleA);
  cp2.copy(end).sub(_handleB);
}

function buildClosedBezierPath(
  anchors: readonly THREE.Vector3[],
  tension: number,
): TunnelCurve {
  const path = new THREE.CurvePath<THREE.Vector3>();
  const count = anchors.length;
  const cp1 = new THREE.Vector3();
  const cp2 = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    const start = anchors[i];
    const end = anchors[(i + 1) % count];
    const prev = anchors[(i - 1 + count) % count];
    const next = anchors[(i + 2) % count];

    smoothBezierHandles(prev, start, end, next, tension, cp1, cp2);

    path.add(new THREE.CubicBezierCurve3(start, cp1.clone(), cp2.clone(), end));
  }

  return path;
}

export function createTunnelCurve(): TunnelCurve {
  return buildClosedBezierPath(PATH_ANCHORS, BEZIER_TENSION);
}

export function getTunnelFrame(
  curve: TunnelCurve,
  t: number,
  position = _position,
  tangent = _tangent,
  normal = _normal,
  binormal = _binormal,
) {
  const clamped = ((t % 1) + 1) % 1;
  curve.getPointAt(clamped, position);
  curve.getTangentAt(clamped, tangent).normalize();

  const up = Math.abs(tangent.y) > 0.92 ? _altUp : _worldUp;

  binormal.crossVectors(tangent, up).normalize();
  normal.crossVectors(binormal, tangent).normalize();

  return { position, tangent, normal, binormal };
}

export function sampleTunnelWallPosition(
  curve: TunnelCurve,
  pathT: number,
  angle: number,
  radius: number,
  out = _offset,
) {
  const { position, normal, binormal } = getTunnelFrame(curve, pathT);

  out
    .copy(position)
    .addScaledVector(normal, Math.cos(angle) * radius)
    .addScaledVector(binormal, Math.sin(angle) * radius);

  return out;
}
