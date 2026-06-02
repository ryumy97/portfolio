"use client";

import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import type { OozeDebugState } from "@/lib/three/ooze-debug";
import type * as THREE from "three";
import { Vector3 } from "three";
import { patchObjectForOozeClip } from "@/lib/three/ooze-clip";
import { Eye } from "./eye";
import { Hand } from "./hand";
import { Head } from "./head";
import { OozePool, OozeSurface } from "./ooze-surface";

const CAMERA_POSITION = new Vector3(0, 3.8, 1.85);

type OozeDebugSceneProps = {
	debugRef: React.RefObject<OozeDebugState>;
};

function OozeDebugHelpers({
	debugRef,
}: {
	debugRef: React.RefObject<OozeDebugState>;
}) {
	const groupRef = useRef<THREE.Group>(null);
	const gridRef = useRef<THREE.GridHelper>(null);

	useFrame(() => {
		const debug = debugRef.current;
		const group = groupRef.current;
		if (!group || !debug) return;

		group.visible = debug.showHelpers;
		group.position.y = debug.oozeY;

		if (gridRef.current) {
			gridRef.current.scale.setScalar(debug.planeSize / 12);
		}
	});

	return (
		<group ref={groupRef}>
			<gridHelper ref={gridRef} args={[12, 24, "#888", "#ccc"]} />
			<axesHelper args={[2]} />
		</group>
	);
}

export function OozeDebugScene({ debugRef }: OozeDebugSceneProps) {
	const headRef = useRef<THREE.Group>(null);
	const eyeRef = useRef<THREE.Group>(null);
	const handRef = useRef<THREE.Group>(null);
	const oozeUniformsRef = useRef<
		{ uOozeY: { value: number }; uTime: { value: number } }[]
	>([]);
	const cameraRef = useRef<THREE.PerspectiveCamera>(null);
	const lookTarget = useMemo(() => new Vector3(), []);
	const oozeYRef = useRef(0);

	const three = useThree();

	useLayoutEffect(() => {
		const uniforms = [
			...(headRef.current ? patchObjectForOozeClip(headRef.current) : []),
			...(eyeRef.current ? patchObjectForOozeClip(eyeRef.current) : []),
			...(handRef.current ? patchObjectForOozeClip(handRef.current) : []),
		];
		oozeUniformsRef.current = uniforms;

		const camera = cameraRef.current;
		if (camera) {
			camera.position.copy(CAMERA_POSITION);
			camera.lookAt(lookTarget.set(0, 0, 0));
		}
	}, [lookTarget]);

	useFrame((state) => {
		const debug = debugRef.current;
		if (!debug) return;

		oozeYRef.current = debug.oozeY;

		for (const uniforms of oozeUniformsRef.current) {
			uniforms.uOozeY.value = debug.clipY;
			uniforms.uTime.value = state.clock.elapsedTime * debug.speed;
		}

		const camera = cameraRef.current;
		if (camera) {
			lookTarget.set(0, debug.oozeY * 0.35, 0);
			camera.position.copy(CAMERA_POSITION);
			camera.lookAt(lookTarget);
		}

		three.invalidate();
	});

	return (
		<>
			<group
				ref={headRef}
				scale={1.2}
				position={[-1, -0.42, -0.8]}
				rotation={[(-Math.PI / 2) * 0.4, 1, 0]}
			>
				<Head />
			</group>
			<group
				ref={eyeRef}
				scale={0.45}
				position={[1, -0.25, -0.03]}
				rotation={[(-Math.PI / 2) * 0.5, 0, -0.5]}
			>
				<Eye />
			</group>
			<group
				ref={handRef}
				position={[1, -0.9, 0.13]}
				rotation={[(-Math.PI / 2) * 0.5, -0.9, 0]}
			>
				<Hand />
			</group>

			<OozeSurface oozeYRef={oozeYRef} debugRef={debugRef} />
			<OozePool oozeYRef={oozeYRef} debugRef={debugRef} />

			<OozeDebugHelpers debugRef={debugRef} />

			<ambientLight color="#80d0ff" intensity={6} />
			<directionalLight position={[0, 1, 0]} intensity={8} color="#ffffff" />

			<OrbitControls makeDefault target={[0, 0, 0]} />
			<PerspectiveCamera
				ref={cameraRef}
				fov={32}
				position={CAMERA_POSITION.toArray()}
				makeDefault
			/>
		</>
	);
}
