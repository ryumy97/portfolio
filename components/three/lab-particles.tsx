"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { type RefObject, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const COUNT = 2800;
const SPREAD = { x: 1.2, y: 0.8, z: 0.6 };

const CYLINDER_LINE = {
  radius: 0.2,
  height: 10,
  radialSegments: 48,
  heightSegments: 32,
  openEnded: true,
} as const;

type LabParticlesProps = {
  count?: number;
  color?: string;
  size?: number;
  /** 0 = cylinder surface, 1 = scattered. */
  progressRef?: RefObject<number>;
  inViewRef?: RefObject<boolean>;
  invalidateRef?: RefObject<(() => void) | null>;
  /** Snap particles to cylinder surface every frame (ignore progress). */
  debugCylinderOnly?: boolean;
};

function createLineCylinderGeometry() {
  const { radius, height, radialSegments, heightSegments, openEnded } =
    CYLINDER_LINE;

  return new THREE.CylinderGeometry(
    radius,
    radius,
    height,
    radialSegments,
    heightSegments,
    openEnded,
  );
}

const _va = new THREE.Vector3();
const _vb = new THREE.Vector3();
const _vc = new THREE.Vector3();
const _point = new THREE.Vector3();

/**
 * Deterministic points on the cylinder mesh lateral surface (barycentric on wall triangles).
 */
function buildLinePositionsOnCylinderSurface(
  count: number,
  cylinderGeometry: THREE.CylinderGeometry,
): Float32Array {
  const index = cylinderGeometry.index;
  const positionAttr = cylinderGeometry.attributes.position;

  if (!index) {
    return buildLinePositionsParametric(count, cylinderGeometry.parameters);
  }

  const positions = new Float32Array(count * 3);
  const triangleCount = index.count / 3;

  for (let i = 0; i < count; i++) {
    const tri = i % triangleCount;
    const i0 = index.getX(tri * 3);
    const i1 = index.getX(tri * 3 + 1);
    const i2 = index.getX(tri * 3 + 2);

    _va.fromBufferAttribute(positionAttr, i0);
    _vb.fromBufferAttribute(positionAttr, i1);
    _vc.fromBufferAttribute(positionAttr, i2);

    let u = (i * 0.618033988749895) % 1;
    let v = (i * 0.381966011250105) % 1;
    if (u + v > 1) {
      u = 1 - u;
      v = 1 - v;
    }
    const w = 1 - u - v;

    _point
      .set(0, 0, 0)
      .addScaledVector(_va, u)
      .addScaledVector(_vb, v)
      .addScaledVector(_vc, w);

    const i3 = i * 3;
    positions[i3] = _point.x;
    positions[i3 + 1] = _point.y;
    positions[i3 + 2] = _point.z;
  }

  return positions;
}

/** Fallback: same parametric shell as THREE.CylinderGeometry. */
function buildLinePositionsParametric(
  count: number,
  params: THREE.CylinderGeometry["parameters"],
): Float32Array {
  const radius = (params.radiusTop + params.radiusBottom) * 0.5;
  const { height } = params;
  const halfH = height * 0.5;
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const u = (i * 0.618033988749895) % 1;
    const v = (i + 0.5) / count;
    const theta = u * Math.PI * 2;

    positions[i3] = radius * Math.sin(theta);
    positions[i3 + 1] = halfH - v * height;
    positions[i3 + 2] = radius * Math.cos(theta);
  }

  return positions;
}

function buildScatterPositions(count: number): Float32Array {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * SPREAD.x;
    positions[i3 + 1] = (Math.random() - 0.5) * SPREAD.y;
    positions[i3 + 2] = (Math.random() - 0.5) * SPREAD.z;
  }

  return positions;
}

function buildVelocities(count: number): Float32Array {
  const velocities = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    velocities[i3] = (Math.random() - 0.5) * 0.9;
    velocities[i3 + 1] = (Math.random() - 0.5) * 0.6;
    velocities[i3 + 2] = (Math.random() - 0.5) * 0.5;
  }

  return velocities;
}

function integrateScatter(
  scatterPositions: Float32Array,
  velocities: Float32Array,
  count: number,
  delta: number,
  progress: number,
) {
  const half = {
    x: SPREAD.x * 0.5,
    y: SPREAD.y * 0.5,
    z: SPREAD.z * 0.5,
  };
  const motionScale = delta * progress;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    scatterPositions[i3] += velocities[i3] * motionScale;
    scatterPositions[i3 + 1] += velocities[i3 + 1] * motionScale;
    scatterPositions[i3 + 2] += velocities[i3 + 2] * motionScale;

    if (scatterPositions[i3] > half.x || scatterPositions[i3] < -half.x) {
      velocities[i3] *= -1;
      scatterPositions[i3] = THREE.MathUtils.clamp(
        scatterPositions[i3],
        -half.x,
        half.x,
      );
    }
    if (
      scatterPositions[i3 + 1] > half.y ||
      scatterPositions[i3 + 1] < -half.y
    ) {
      velocities[i3 + 1] *= -1;
      scatterPositions[i3 + 1] = THREE.MathUtils.clamp(
        scatterPositions[i3 + 1],
        -half.y,
        half.y,
      );
    }
    if (
      scatterPositions[i3 + 2] > half.z ||
      scatterPositions[i3 + 2] < -half.z
    ) {
      velocities[i3 + 2] *= -1;
      scatterPositions[i3 + 2] = THREE.MathUtils.clamp(
        scatterPositions[i3 + 2],
        -half.z,
        half.z,
      );
    }
  }
}

function lerpPositions(
  out: Float32Array,
  linePositions: Float32Array,
  scatterPositions: Float32Array,
  progress: number,
) {
  const t = THREE.MathUtils.clamp(progress, 0, 1);

  for (let i = 0; i < out.length; i++) {
    out[i] = linePositions[i] + (scatterPositions[i] - linePositions[i]) * t;
  }
}

export function LabParticles({
  count = COUNT,
  color = "#f75d5d",
  size = 0.04,
  progressRef: progressRefProp,
  inViewRef,
  invalidateRef,
  debugCylinderOnly = false,
}: LabParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const lineMeshRef = useRef<THREE.Mesh>(null);
  const fallbackProgressRef = useRef(0);
  const progressRef = progressRefProp ?? fallbackProgressRef;
  const invalidate = useThree((state) => state.invalidate);

  const lineCylinderGeometry = useMemo(() => createLineCylinderGeometry(), []);

  useEffect(() => {
    return () => lineCylinderGeometry.dispose();
  }, [lineCylinderGeometry]);

  useEffect(() => {
    if (!invalidateRef) return;
    invalidateRef.current = invalidate;
    return () => {
      invalidateRef.current = null;
    };
  }, [invalidate, invalidateRef]);

  const { geometry, linePositions, scatterPositions, velocities } =
    useMemo(() => {
      const linePositions = buildLinePositionsOnCylinderSurface(
        count,
        lineCylinderGeometry,
      );
      const scatterPositions = buildScatterPositions(count);
      const velocities = buildVelocities(count);
      const displayPositions = new Float32Array(count * 3);
      displayPositions.set(linePositions);

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(displayPositions, 3),
      );

      return {
        geometry,
        linePositions,
        scatterPositions,
        velocities,
      };
    }, [count, lineCylinderGeometry]);

  useFrame((_, delta) => {
    if (inViewRef && !inViewRef.current) return;

    const points = pointsRef.current;
    if (!points) return;

    const progress = THREE.MathUtils.clamp(progressRef.current ?? 0, 0, 1);
    const positionAttr = points.geometry.attributes.position;
    const displayPositions = positionAttr.array as Float32Array;

    const lineMesh = lineMeshRef.current;
    if (lineMesh) {
      lineMesh.visible = false;
    }

    if (debugCylinderOnly) {
      displayPositions.set(linePositions);
      positionAttr.needsUpdate = true;
      return;
    }

    if (progress > 0) {
      integrateScatter(scatterPositions, velocities, count, delta, progress);
    }

    lerpPositions(displayPositions, linePositions, scatterPositions, progress);

    positionAttr.needsUpdate = true;

    if (progress > 0) {
      invalidate();
    }
  });

  return (
    <group>
      <mesh ref={lineMeshRef} geometry={lineCylinderGeometry}>
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
        <pointsMaterial
          color={color}
          size={size}
          sizeAttenuation
          opacity={1}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </points>
    </group>
  );
}
