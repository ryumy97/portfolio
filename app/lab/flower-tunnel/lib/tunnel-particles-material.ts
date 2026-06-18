import * as THREE from "three";
import {
  TUNNEL_DISTANCE_FAR,
  TUNNEL_DISTANCE_NEAR,
  TUNNEL_TEXTURE_BRIGHTNESS,
  TUNNEL_TEXTURE_GLOW,
  TUNNEL_TEXTURES_PER_SET,
} from "./tunnel-colors";

const GLSL_DISTANCE_NEAR = `${TUNNEL_DISTANCE_NEAR}`;
const GLSL_DISTANCE_FAR = `${TUNNEL_DISTANCE_FAR}.0`;
const GLSL_DISTANCE_RANGE = `(${TUNNEL_DISTANCE_FAR}.0 - ${TUNNEL_DISTANCE_NEAR})`;
const GLSL_TEXTURES_PER_SET = `${TUNNEL_TEXTURES_PER_SET}.0`;
const GLSL_TEXTURES_LAST_BAND = `${TUNNEL_TEXTURES_PER_SET - 1}.0`;
const GLSL_TEXTURE_BRIGHTNESS = `${TUNNEL_TEXTURE_BRIGHTNESS}`;
const GLSL_TEXTURE_GLOW = `${TUNNEL_TEXTURE_GLOW}`;

export const TUNNEL_PARTICLES_VERTEX_SHADER = /* glsl */ `
attribute float particleType;
attribute float rotation;

uniform float size;
uniform float scale;

varying float vParticleType;
varying float vRotation;
varying float vCameraDistance;

void main() {
	vParticleType = particleType;
	vRotation = rotation;

	vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
	vCameraDistance = length(mvPosition.xyz);
	gl_PointSize = size * (scale / -mvPosition.z);
	gl_Position = projectionMatrix * mvPosition;
}
`;

export const TUNNEL_PARTICLES_FRAGMENT_SHADER = /* glsl */ `
uniform sampler2D textureAtlas;

varying float vParticleType;
varying float vRotation;
varying float vCameraDistance;

vec2 rotateCoord(vec2 coord, float angle) {
	float s = sin(angle);
	float c = cos(angle);
	coord -= 0.5;
	return vec2(c * coord.x - s * coord.y, s * coord.x + c * coord.y) + 0.5;
}

void main() {
	float distNorm = clamp(
		(vCameraDistance - ${GLSL_DISTANCE_NEAR}) / ${GLSL_DISTANCE_RANGE},
		0.0,
		0.999
	);
	float distanceBand = min(
		${GLSL_TEXTURES_LAST_BAND},
		floor(distNorm * ${GLSL_TEXTURES_PER_SET})
	);

	float cellSize = 1.0 / ${GLSL_TEXTURES_PER_SET};
	float u0 = vParticleType * cellSize;
	float v0 = distanceBand * cellSize;
	vec2 spriteCoord = rotateCoord(
		vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y),
		vRotation
	);
	vec2 atlasUV = vec2(u0, v0) + spriteCoord * cellSize;

	vec4 tex = texture2D(textureAtlas, atlasUV);
	float distanceFade = 1.0 - smoothstep(${GLSL_DISTANCE_NEAR}, ${GLSL_DISTANCE_FAR}, vCameraDistance);
	float alpha = tex.a * distanceFade;

	if (alpha < 0.03) {
		discard;
	}

	vec3 color = tex.rgb * ${GLSL_TEXTURE_BRIGHTNESS} + tex.rgb * ${GLSL_TEXTURE_GLOW};

	gl_FragColor = vec4(min(color, vec3(1.0)), alpha);
	#include <colorspace_fragment>
}
`;

export function createTunnelParticlesMaterial(
  textureAtlas: THREE.Texture,
  size: number,
  scale: number,
) {
  return new THREE.ShaderMaterial({
    uniforms: {
      textureAtlas: { value: textureAtlas },
      size: { value: size },
      scale: { value: scale },
    },
    vertexShader: TUNNEL_PARTICLES_VERTEX_SHADER,
    fragmentShader: TUNNEL_PARTICLES_FRAGMENT_SHADER,
    toneMapped: false,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending,
  });
}
