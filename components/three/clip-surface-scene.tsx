"use client";

import { PerspectiveCamera } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import type * as THREE from "three";
import { Vector3 } from "three";
import {
	CLIP_DEBUG_DEFAULTS,
	type ClipDebugState,
} from "@/lib/three/clip-debug";
import { type ClipUniforms, patchObjectForClip } from "@/lib/three/clip-patch";
import { ClipSurface } from "./clip-surface";
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

export const CLIP_SURFACE_SCENE_DEFAULTS = CLIP_DEBUG_DEFAULTS;

export type ClipSurfaceSceneProps = {
	clipY?: number;
	wave1?: number;
	wave2?: number;
	wave3?: number;
	speed?: number;
	color?: string;
};

const WARM_AMBIENT_COLOR = "#80d0ff";
const WARM_KEY_COLOR = "#ffffff";

export function ClipSurfaceScene({
	clipY = CLIP_SURFACE_SCENE_DEFAULTS.clipY,
	wave1 = CLIP_SURFACE_SCENE_DEFAULTS.wave1,
	wave2 = CLIP_SURFACE_SCENE_DEFAULTS.wave2,
	wave3 = CLIP_SURFACE_SCENE_DEFAULTS.wave3,
	speed = CLIP_SURFACE_SCENE_DEFAULTS.speed,
	color = CLIP_SURFACE_SCENE_DEFAULTS.color,
}: ClipSurfaceSceneProps) {
	const headRef = useRef<THREE.Group>(null);
	const eyeRef = useRef<THREE.Group>(null);
	const handRef = useRef<THREE.Group>(null);
	const phoneRef = useRef<THREE.Group>(null);

	const headLightRef = useRef<THREE.PointLight>(null);
	const eyeLightRef = useRef<THREE.PointLight>(null);
	const handLightRef = useRef<THREE.PointLight>(null);
	const phoneLightRef = useRef<THREE.PointLight>(null);

	const clipUniformsRef = useRef<ClipUniforms[]>([]);

	const clipYRef = useRef(clipY);
	const configRef = useRef<ClipDebugState>(CLIP_SURFACE_SCENE_DEFAULTS);
	const cameraRef = useRef<THREE.PerspectiveCamera>(null);
	const backgroundRef = useRef<THREE.Color>(null);
	const lookTarget = useMemo(() => new Vector3(), []);

	configRef.current = {
		clipY,
		wave1,
		wave2,
		wave3,
		speed,
		color,
	};

	useLayoutEffect(() => {
		const uniforms = [
			...(headRef.current ? patchObjectForClip(headRef.current) : []),
			...(eyeRef.current ? patchObjectForClip(eyeRef.current) : []),
			...(handRef.current ? patchObjectForClip(handRef.current) : []),
			...(phoneRef.current ? patchObjectForClip(phoneRef.current) : []),
		];

		for (const uniform of uniforms) {
			uniform.uClipY.value = clipY;
			uniform.uWave1.value = wave1;
			uniform.uWave2.value = wave2;
			uniform.uWave3.value = wave3;
		}
		clipUniformsRef.current = uniforms;

		const camera = cameraRef.current;
		if (camera) {
			camera.lookAt(lookTarget);
		}
	}, [clipY, lookTarget, wave1, wave2, wave3]);

	useFrame((state) => {
		const elapsed = state.clock.elapsedTime * speed;

		for (const uniforms of clipUniformsRef.current) {
			uniforms.uClipY.value = clipY;
			uniforms.uWave1.value = wave1;
			uniforms.uWave2.value = wave2;
			uniforms.uWave3.value = wave3;
			uniforms.uTime.value = elapsed;
		}

		const background = backgroundRef.current;
		if (background) {
			background.set(color);
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

			<ClipSurface clipYRef={clipYRef} debugRef={configRef} />

			<ambientLight color={WARM_AMBIENT_COLOR} intensity={8} />
			<directionalLight
				position={[0, 1, 0]}
				intensity={4}
				color={WARM_KEY_COLOR}
			/>
			<color attach="background" args={["#f06058"]} ref={backgroundRef} />

			<PerspectiveCamera
				ref={cameraRef}
				fov={32}
				position={CAMERA_POSITION.toArray()}
				makeDefault
			/>
		</>
	);
}
