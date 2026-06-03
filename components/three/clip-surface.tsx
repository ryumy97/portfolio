"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { ClipDebugState } from "@/lib/three/clip-debug";

const PLANE_SIZE = 12;
const PLANE_SEGMENTS = 96;

type ClipSurfaceProps = {
	clipYRef: React.RefObject<number>;
	debugRef?: React.RefObject<ClipDebugState | null>;
};

export function ClipSurface({ clipYRef, debugRef }: ClipSurfaceProps) {
	const meshRef = useRef<THREE.Mesh>(null);
	const materialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);

	const material = useMemo(() => {
		const mat = new THREE.MeshPhysicalMaterial({
			color: new THREE.Color("#f06058"),
			emissive: new THREE.Color("#3a1210"),
			emissiveIntensity: 0.08,
			roughness: 0.18,
			metalness: 0.05,
			transmission: 0.35,
			thickness: 0.6,
			ior: 1.35,
			clearcoat: 0.85,
			clearcoatRoughness: 0.12,
			transparent: true,
			opacity: 0.92,
			depthWrite: false,
		});
		materialRef.current = mat;
		return mat;
	}, []);

	useLayoutEffect(() => {
		const mesh = meshRef.current;
		if (!mesh) return;

		const geometry = new THREE.PlaneGeometry(
			PLANE_SIZE,
			PLANE_SIZE,
			PLANE_SEGMENTS,
			PLANE_SEGMENTS,
		);
		mesh.geometry.dispose();
		mesh.geometry = geometry;

		return () => {
			geometry.dispose();
		};
	}, []);

	useFrame((state) => {
		const mesh = meshRef.current;
		const mat = materialRef.current;
		if (!mesh || !mat) return;

		const debug = debugRef?.current;
		const time = state.clock.elapsedTime * (debug?.speed ?? 1);
		const y = debug?.clipY ?? clipYRef.current ?? 0;

		const wave1 = debug?.wave1 ?? 0.028;
		const wave2 = debug?.wave2 ?? 0.02;
		const wave3 = debug?.wave3 ?? 0.015;

		mat.color.set(debug?.color ?? "#f06058");

		const geometry = mesh.geometry as THREE.PlaneGeometry;
		const position = geometry.attributes.position as THREE.BufferAttribute;

		for (let i = 0; i < position.count; i++) {
			const x = position.getX(i);
			const z = position.getZ(i);
			const wave =
				Math.sin(x * 5 + time * 0.9) * wave1 +
				Math.sin(z * 4 + time * 0.7) * wave2 +
				Math.sin((x + z) * 3 + time * 1.1) * wave3;
			position.setY(i, wave);
		}

		position.needsUpdate = true;
		geometry.computeVertexNormals();
		mesh.position.y = y;
		clipYRef.current = y;
	});

	return (
		<mesh
			ref={meshRef}
			rotation={[-Math.PI / 2, 0, 0]}
			renderOrder={2}
			raycast={() => null}
		>
			<primitive object={material} attach="material" />
		</mesh>
	);
}
