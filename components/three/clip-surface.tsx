"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { OozeDebugState } from "@/lib/three/ooze-debug";

type OozeSurfaceProps = {
	oozeYRef: React.RefObject<number>;
	debugRef?: React.RefObject<OozeDebugState | null>;
};

export function OozeSurface({ oozeYRef, debugRef }: OozeSurfaceProps) {
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

	const segments = debugRef?.current?.segments ?? 48;
	const planeSize = debugRef?.current?.planeSize ?? 12;

	useEffect(() => {
		const mesh = meshRef.current;
		if (!mesh) return;
		mesh.geometry.dispose();
		mesh.geometry = new THREE.PlaneGeometry(
			planeSize,
			planeSize,
			segments,
			segments,
		);
	}, [planeSize, segments]);

	useFrame((state) => {
		const mesh = meshRef.current;
		const mat = materialRef.current;
		if (!mesh || !mat) return;

		const debug = debugRef?.current;
		const time = state.clock.elapsedTime * (debug?.speed ?? 1);
		const oozeY = debug?.oozeY ?? oozeYRef.current ?? 0;

		const wave1 = debug?.wave1 ?? 0.028;
		const wave2 = debug?.wave2 ?? 0.02;
		const wave3 = debug?.wave3 ?? 0.015;

		mat.color.set(debug?.color ?? "#f06058");
		mat.opacity = debug?.opacity ?? 0.92;
		mat.transmission = debug?.transmission ?? 0.35;
		mat.wireframe = debug?.wireframe ?? false;

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
		mesh.position.y = oozeY;
		oozeYRef.current = oozeY;
	});

	return (
		<mesh
			ref={meshRef}
			rotation={[-Math.PI / 2, 0, 0]}
			renderOrder={2}
			raycast={() => null}
		>
			<planeGeometry args={[planeSize, planeSize, segments, segments]} />
			<primitive object={material} attach="material" />
		</mesh>
	);
}

export function OozePool({ oozeYRef, debugRef }: OozeSurfaceProps) {
	const meshRef = useRef<THREE.Mesh>(null);

	useFrame(() => {
		const mesh = meshRef.current;
		if (!mesh) return;

		const oozeY = debugRef?.current?.oozeY ?? oozeYRef.current ?? 0;
		const depth = Math.max(oozeY + 2.8, 0.2);

		mesh.position.y = oozeY * 0.5 - depth * 0.5;
		mesh.scale.y = depth;

		const color = debugRef?.current?.color ?? "#e8544c";
		const mat = mesh.material as THREE.MeshPhysicalMaterial;
		mat.color.set(color);
	});

	return (
		<mesh ref={meshRef} renderOrder={0}>
			<boxGeometry args={[14, 1, 8]} />
			<meshPhysicalMaterial
				color="#e8544c"
				roughness={0.45}
				metalness={0.02}
				transmission={0.08}
				thickness={1.2}
			/>
		</mesh>
	);
}
