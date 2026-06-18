import * as THREE from "three";

export type GeometryTransform = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
};

const _matrix = new THREE.Matrix4();
const _position = new THREE.Vector3();
const _quaternion = new THREE.Quaternion();
const _scale = new THREE.Vector3(1, 1, 1);
const _euler = new THREE.Euler();

/** Apply position / rotation / scale to every vertex in a geometry clone. */
export function applyGeometryTransform(
  geometry: THREE.BufferGeometry,
  {
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = [1, 1, 1],
  }: GeometryTransform = {},
): THREE.BufferGeometry {
  const transformed = geometry.clone();

  _euler.set(rotation[0], rotation[1], rotation[2], "XYZ");
  _position.set(position[0], position[1], position[2]);
  _scale.set(scale[0], scale[1], scale[2]);
  _matrix.compose(_position, _quaternion.setFromEuler(_euler), _scale);
  transformed.applyMatrix4(_matrix);
  transformed.computeBoundingBox();

  return transformed;
}
