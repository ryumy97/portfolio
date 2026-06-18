import * as THREE from "three";
import { CLIP_DEBUG_DEFAULTS } from "./clip-debug";

const patchedMaterials = new WeakSet<THREE.Material>();

type ClipUniforms = {
  uClipY: { value: number };
  uTime: { value: number };
  uWave1: { value: number };
  uWave2: { value: number };
  uWave3: { value: number };
};

export function patchMaterialForClip(material: THREE.Material) {
  if (patchedMaterials.has(material)) {
    return (material.userData.clipUniforms as ClipUniforms | undefined) ?? null;
  }
  patchedMaterials.add(material);

  const uniforms: ClipUniforms = {
    uClipY: { value: 1.5 },
    uTime: { value: 0 },
    uWave1: { value: CLIP_DEBUG_DEFAULTS.wave1 },
    uWave2: { value: CLIP_DEBUG_DEFAULTS.wave2 },
    uWave3: { value: CLIP_DEBUG_DEFAULTS.wave3 },
  };
  material.userData.clipUniforms = uniforms;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uClipY = uniforms.uClipY;
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uWave1 = uniforms.uWave1;
    shader.uniforms.uWave2 = uniforms.uWave2;
    shader.uniforms.uWave3 = uniforms.uWave3;

    shader.vertexShader = shader.vertexShader.replace(
      "#include <worldpos_vertex>",
      /* glsl */ `
				#include <worldpos_vertex>
				vClipWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
			`,
    );

    shader.vertexShader = `varying vec3 vClipWorldPos;\n${shader.vertexShader}`;

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <clipping_planes_fragment>",
      /* glsl */ `
				#include <clipping_planes_fragment>
				float clipWave =
					sin(vClipWorldPos.x * 5.0 + uTime * 0.9) * uWave1 +
					sin(vClipWorldPos.z * 4.0 + uTime * 0.7) * uWave2 +
					sin((vClipWorldPos.x + vClipWorldPos.z) * 3.0 + uTime * 1.1) * uWave3;
				float clipSurface = uClipY + clipWave;
				float belowClip = clipSurface - vClipWorldPos.y;
				if (belowClip > 0.0) discard;
				float meniscus = smoothstep(-0.08, 0.0, belowClip);
				diffuseColor.rgb *= mix(0.82, 1.0, meniscus);
			`,
    );

    shader.fragmentShader = `varying vec3 vClipWorldPos;\nuniform float uClipY;\nuniform float uTime;\nuniform float uWave1;\nuniform float uWave2;\nuniform float uWave3;\n${shader.fragmentShader}`;
  };

  return uniforms;
}

export function patchObjectForClip(root: THREE.Object3D) {
  const uniforms: ClipUniforms[] = [];

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];

    for (const material of materials) {
      const materialUniforms = patchMaterialForClip(material);
      if (materialUniforms) uniforms.push(materialUniforms);
    }
  });

  return uniforms;
}

export type { ClipUniforms };
