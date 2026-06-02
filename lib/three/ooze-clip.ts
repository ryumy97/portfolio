import * as THREE from "three";

const patchedMaterials = new WeakSet<THREE.Material>();

type OozeUniforms = {
	uOozeY: { value: number };
	uTime: { value: number };
};

export function patchMaterialForOozeClip(material: THREE.Material) {
	if (patchedMaterials.has(material)) {
		return (material.userData.oozeUniforms as OozeUniforms | undefined) ?? null;
	}
	patchedMaterials.add(material);

	const uniforms: OozeUniforms = {
		uOozeY: { value: 1.5 },
		uTime: { value: 0 },
	};
	material.userData.oozeUniforms = uniforms;

	material.onBeforeCompile = (shader) => {
		shader.uniforms.uOozeY = uniforms.uOozeY;
		shader.uniforms.uTime = uniforms.uTime;

		shader.vertexShader = shader.vertexShader.replace(
			"#include <worldpos_vertex>",
			/* glsl */ `
				#include <worldpos_vertex>
				vOozeWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
			`,
		);

		shader.vertexShader = `varying vec3 vOozeWorldPos;\n${shader.vertexShader}`;

		shader.fragmentShader = shader.fragmentShader.replace(
			"#include <clipping_planes_fragment>",
			/* glsl */ `
				#include <clipping_planes_fragment>
				float oozeWave =
					sin(vOozeWorldPos.x * 5.0 + uTime * 0.9) * 0.028 +
					sin(vOozeWorldPos.z * 4.0 + uTime * 0.7) * 0.02 +
					sin((vOozeWorldPos.x + vOozeWorldPos.z) * 3.0 + uTime * 1.1) * 0.015;
				float oozeSurface = uOozeY + oozeWave;
				float belowOoze = oozeSurface - vOozeWorldPos.y;
				if (belowOoze > 0.0) discard;
				float meniscus = smoothstep(-0.08, 0.0, belowOoze);
				diffuseColor.rgb *= mix(0.82, 1.0, meniscus);
			`,
		);

		shader.fragmentShader = `varying vec3 vOozeWorldPos;\nuniform float uOozeY;\nuniform float uTime;\n${shader.fragmentShader}`;
	};

	return uniforms;
}

export function patchObjectForOozeClip(root: THREE.Object3D) {
	const uniforms: OozeUniforms[] = [];

	root.traverse((child) => {
		if (!(child instanceof THREE.Mesh)) return;

		const materials = Array.isArray(child.material)
			? child.material
			: [child.material];

		for (const material of materials) {
			const materialUniforms = patchMaterialForOozeClip(material);
			if (materialUniforms) uniforms.push(materialUniforms);
		}
	});

	return uniforms;
}

export type { OozeUniforms };
