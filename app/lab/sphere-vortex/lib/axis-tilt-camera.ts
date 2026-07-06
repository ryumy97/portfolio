import * as THREE from "three";

const BASE_CAMERA_POSITION = new THREE.Vector3(0, 0.573, 6.587);
const LOOK_AT = new THREE.Vector3(0, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const _position = new THREE.Vector3();

export const AXIS_TILT_CAMERA_POSITION: [number, number, number] = [
  BASE_CAMERA_POSITION.x,
  BASE_CAMERA_POSITION.y,
  BASE_CAMERA_POSITION.z,
];

export function applyAxisTiltToCamera(
  camera: THREE.PerspectiveCamera,
  axisTilt: number,
) {
  _position.copy(BASE_CAMERA_POSITION).applyAxisAngle(Y_AXIS, axisTilt);
  camera.position.copy(_position);
  camera.lookAt(LOOK_AT);
}
