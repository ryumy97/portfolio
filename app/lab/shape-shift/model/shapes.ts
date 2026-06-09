import type { GeometryTransform } from "@/lib/three/apply-geometry-transform";
import { applyGeometryTransform } from "@/lib/three/apply-geometry-transform";
import { fitGeometryToBox } from "@/lib/three/fit-geometry-to-box";
import { sampleGeometrySurface } from "@/lib/three/sample-geometry-surface";
import * as THREE from "three";

// --- Config ---

export const MODEL_URLS = [
  "/models/head.glb",
  "/models/eye.glb",
  "/models/hand.glb",
  "/models/phone.glb",
] as const;

export const SHAPE_KEYS = ["head", "eye", "hand", "phone"] as const;

export type ShapeKey = (typeof SHAPE_KEYS)[number];

export const SHAPE_NAMES = ["Head", "Eye", "Hand", "Phone"] as const;

export const SHAPE_COUNT = MODEL_URLS.length;

export const SHAPE_SHIFT_DEFAULTS = {
  count: 4000,
  size: 0.035,
  color: "#f75d5d",
  shape: 0,
} as const;

/** Per-shape pose after fitGeometryToBox. Rotation is Euler XYZ in radians. */
export const SHAPE_TRANSFORMS: Record<ShapeKey, GeometryTransform> = {
  head: { position: [0, 0, 0], rotation: [0, 0, 0] },
  eye: { position: [0, 0, 0], rotation: [0, 0, 0] },
  hand: { position: [0, 0, 0], rotation: [-Math.PI / 2, 0, 0] },
  phone: { position: [0, 0, 0], rotation: [0, 0, 0] },
};

const FIT_SIZE = 2;

// --- Geometry ---

export type ShapeNodeSource = {
  key: ShapeKey;
  nodes: Record<string, THREE.Object3D>;
};

function buildShapeGeometry(
  nodes: Record<string, THREE.Object3D>,
  shapeKey: ShapeKey,
): THREE.BufferGeometry | null {
  const mesh = nodes.geometry_0 as THREE.Mesh | undefined;
  const geometry = mesh?.geometry;
  if (!geometry || !(geometry instanceof THREE.BufferGeometry)) return null;

  const fitted = fitGeometryToBox(geometry, FIT_SIZE);
  return applyGeometryTransform(fitted, SHAPE_TRANSFORMS[shapeKey]);
}

export function buildShapePositionSets(
  sources: ShapeNodeSource[],
  count: number,
): Float32Array[] | null {
  const geometries = sources.map(({ nodes, key }) =>
    buildShapeGeometry(nodes, key),
  );

  if (geometries.some((geometry) => !geometry)) return null;

  return geometries.map((geometry) =>
    sampleGeometrySurface(count, geometry as THREE.BufferGeometry),
  );
}

export function createDefaultShapeSources(
  nodesByKey: Record<ShapeKey, Record<string, THREE.Object3D>>,
): ShapeNodeSource[] {
  return SHAPE_KEYS.map((key) => ({ key, nodes: nodesByKey[key] }));
}
