import * as THREE from "three";

export const IMAGE_PARTICLES_VERTEX_SHADER = /* glsl */ `
attribute float particleAlpha;
attribute vec3 color;

uniform float size;
uniform float scale;

varying vec3 vColor;
varying float vParticleAlpha;

void main() {
	vColor = color;
	vParticleAlpha = particleAlpha;

	vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
	gl_PointSize = size * (scale / -mvPosition.z);
	gl_Position = projectionMatrix * mvPosition;
}
`;

export const IMAGE_PARTICLES_FRAGMENT_SHADER = /* glsl */ `
uniform sampler2D alphaMap;

varying vec3 vColor;
varying float vParticleAlpha;

void main() {
	float shapeAlpha = texture2D(alphaMap, gl_PointCoord).r;
	float alpha = shapeAlpha * vParticleAlpha;

	if (alpha < 0.001) {
		discard;
	}

	gl_FragColor = vec4(vColor, alpha);
}
`;

export function createImageParticlesMaterial(
	alphaMap: THREE.Texture,
	size: number,
	scale: number,
) {
	return new THREE.ShaderMaterial({
		uniforms: {
			alphaMap: { value: alphaMap },
			size: { value: size },
			scale: { value: scale },
		},
		vertexShader: IMAGE_PARTICLES_VERTEX_SHADER,
		fragmentShader: IMAGE_PARTICLES_FRAGMENT_SHADER,
		transparent: true,
		depthWrite: false,
		depthTest: true,
		blending: THREE.NormalBlending,
	});
}
