import * as THREE from "three";

/** Clone, center, and uniformly scale geometry to fit a target bounding size. */
export function fitGeometryToBox(
	geometry: THREE.BufferGeometry,
	targetSize = 2,
): THREE.BufferGeometry {
	const fitted = geometry.clone();
	fitted.computeBoundingBox();

	const box = fitted.boundingBox;
	if (!box) return fitted;

	const center = box.getCenter(new THREE.Vector3());
	const size = box.getSize(new THREE.Vector3());
	const maxDim = Math.max(size.x, size.y, size.z) || 1;
	const scale = targetSize / maxDim;

	const position = fitted.attributes.position as THREE.BufferAttribute;
	for (let i = 0; i < position.count; i++) {
		position.setXYZ(
			i,
			(position.getX(i) - center.x) * scale,
			(position.getY(i) - center.y) * scale,
			(position.getZ(i) - center.z) * scale,
		);
	}

	position.needsUpdate = true;
	fitted.computeBoundingBox();
	return fitted;
}
