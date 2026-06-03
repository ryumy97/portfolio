"use client";

import { patchObjectForOozeClip } from "@/lib/three/ooze-clip";
import type { OozeDebugState } from "@/lib/three/ooze-debug";
import { PerspectiveCamera } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import type * as THREE from "three";
import { Vector3 } from "three";
import { OozeSurface } from "./clip-surface";
import { Eye } from "./eye";
import { Hand } from "./hand";
import { Head } from "./head";
import { Phone } from "./phone";

const CAMERA_POSITION = new Vector3(0, 3.8, 1.85);

const START = {
	headY: -0.42,
	eyeY: -0.25,
	handY: -0.34,
	phoneY: -0.3,
};

const POSITION_DESKTOP = {
	headX: -1,
	headZ: -0.8,
	eyeX: 1,
	eyeZ: -0.03,
	handX: -0.4,
	handZ: 0.5,
	phoneX: 0.7,
	phoneZ: 0.8,
};

type OozeDebugSceneProps = {
	debugRef: React.RefObject<OozeDebugState>;
};

const WARM_AMBIENT_COLOR = "#80d0ff";
const WARM_KEY_COLOR = "#ffffff";

export function OozeDebugScene({ debugRef }: OozeDebugSceneProps) {
	const headRef = useRef<THREE.Group>(null);
	const eyeRef = useRef<THREE.Group>(null);
	const handRef = useRef<THREE.Group>(null);
	const phoneRef = useRef<THREE.Group>(null);

	const headLightRef = useRef<THREE.PointLight>(null);
	const eyeLightRef = useRef<THREE.PointLight>(null);
	const handLightRef = useRef<THREE.PointLight>(null);
	const phoneLightRef = useRef<THREE.PointLight>(null);

	const oozeUniformsRef = useRef<
		{ uOozeY: { value: number }; uTime: { value: number } }[]
	>([]);

	const oozeYRef = useRef(0);
	const cameraRef = useRef<THREE.PerspectiveCamera>(null);
	const lookTarget = useMemo(() => new Vector3(), []);

	const three = useThree();

	useLayoutEffect(() => {
		const uniforms = [
			...(headRef.current ? patchObjectForOozeClip(headRef.current) : []),
			...(eyeRef.current ? patchObjectForOozeClip(eyeRef.current) : []),
			...(handRef.current ? patchObjectForOozeClip(handRef.current) : []),
			...(phoneRef.current ? patchObjectForOozeClip(phoneRef.current) : []),
		];

		for (const uniform of uniforms) {
			uniform.uOozeY.value = -0.3;
		}
		oozeUniformsRef.current = uniforms;

		const camera = cameraRef.current;
		if (camera) {
			camera.lookAt(lookTarget);
		}
	}, [lookTarget]);

	useFrame((state) => {
		const debug = debugRef.current;
		if (!debug) return;

		debug.oozeY = oozeYRef.current;

		for (const uniforms of oozeUniformsRef.current) {
			uniforms.uTime.value = state.clock.elapsedTime;
		}
	});

	return (
		<>
			<group
				ref={headRef}
				scale={1.2}
				position={[POSITION_DESKTOP.headX, START.headY, POSITION_DESKTOP.headZ]}
				rotation={[(-Math.PI / 2) * 0.4, 1, 0]}
			>
				<Head />
				<pointLight
					ref={headLightRef}
					position={[-0.3, START.headY + 1.7, 0.5]}
					color={"#ff0000"}
					intensity={0}
					decay={8}
				/>
			</group>
			<group
				ref={eyeRef}
				scale={0.45}
				position={[POSITION_DESKTOP.eyeX, START.eyeY, POSITION_DESKTOP.eyeZ]}
				rotation={[(-Math.PI / 2) * 0.5, 0, -0.5]}
			>
				<Eye />
				<pointLight
					ref={eyeLightRef}
					position={[-0.3, START.eyeY + 1.7, 0.5]}
					color={"#ff0000"}
					intensity={0}
					decay={8}
				/>
			</group>
			<group
				ref={handRef}
				position={[POSITION_DESKTOP.handX, START.handY, POSITION_DESKTOP.handZ]}
				rotation={[(-Math.PI / 2) * 1.4, 0.5, -0.8]}
			>
				<Hand />
				<pointLight
					ref={handLightRef}
					position={[0.2, START.handY + 0.5, 0.6]}
					color={"#ff0000"}
					intensity={0}
					decay={8}
				/>
			</group>

			<group
				ref={phoneRef}
				position={[
					POSITION_DESKTOP.phoneX,
					START.phoneY,
					POSITION_DESKTOP.phoneZ,
				]}
				rotation={[(-Math.PI / 2) * 0.6, 0, -0.8]}
			>
				<Phone />
				<pointLight
					ref={phoneLightRef}
					position={[-0.5, 0.1, 0.7]}
					color={"#ff0000"}
					intensity={0}
					decay={8}
				/>
			</group>

			<OozeSurface oozeYRef={oozeYRef} />

			<ambientLight color={WARM_AMBIENT_COLOR} intensity={8} />
			<directionalLight
				position={[0, 1, 0]}
				intensity={4}
				color={WARM_KEY_COLOR}
			/>

			<PerspectiveCamera
				ref={cameraRef}
				fov={32}
				position={CAMERA_POSITION.toArray()}
				makeDefault
			/>
		</>
	);
}
