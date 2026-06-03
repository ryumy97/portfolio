"use client";

import { PerspectiveCamera } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import {
	cubicBezier,
	transform,
	useMotionValue,
	useMotionValueEvent,
	useSpring,
} from "motion/react";
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
} from "react";
import type * as THREE from "three";
import { Vector3 } from "three";
import { SCREEN, useMediaQuery } from "@/hooks/use-media-query";
import { patchObjectForOozeClip } from "@/lib/three/ooze-clip";
import { usePartHoverStore } from "@/stores/part-hover";
import { useScrollEvent } from "../smooth-scroll";
import { OozeSurface } from "./clip-surface";
import { Eye } from "./eye";
import { Hand } from "./hand";
import { Head } from "./head";
import { Phone } from "./phone";

const WARM_AMBIENT_COLOR = "#80d0ff";
const WARM_KEY_COLOR = "#ffffff";

const CAMERA_POSITION = new Vector3(0, 3.8, 1.85);

const START = {
	headY: -1,
	eyeY: -1,
	handY: -1,
	phoneY: -1,
};
const END = {
	headY: -0.42,
	eyeY: -0.25,
	handY: -0.34,
	phoneY: -0.3,
};

const POSITION_MOBILE = {
	headX: -0.6,
	headZ: -0.8,
	eyeX: 0.4,
	eyeZ: -0.3,
	handX: -0.4,
	handZ: 0.5,
	phoneX: 0.7,
	phoneZ: 0.8,
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

type MainSceneProps = {
	sectionRef: React.RefObject<HTMLElement | null>;
};

const MainScene = ({ sectionRef }: MainSceneProps) => {
	const isDesktop = useMediaQuery(SCREEN.md);

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

	const reveal = useMotionValue(0);
	const oozeYRef = useRef(0);
	const cameraRef = useRef<THREE.PerspectiveCamera>(null);
	const lookTarget = useMemo(() => new Vector3(), []);

	const three = useThree();

	const headLightIntensity = useSpring(0, {
		stiffness: 600,
		damping: 50,
	});
	const eyeLightIntensity = useSpring(0, {
		stiffness: 600,
		damping: 50,
	});
	const handLightIntensity = useSpring(0, {
		stiffness: 600,
		damping: 50,
	});
	const phoneLightIntensity = useSpring(0, {
		stiffness: 600,
		damping: 50,
	});

	useMotionValueEvent(headLightIntensity, "change", (value) => {
		if (headLightRef.current) {
			headLightRef.current.intensity = value;
		}
		three.invalidate();
	});
	useMotionValueEvent(eyeLightIntensity, "change", (value) => {
		if (eyeLightRef.current) {
			eyeLightRef.current.intensity = value;
		}
		three.invalidate();
	});
	useMotionValueEvent(handLightIntensity, "change", (value) => {
		if (handLightRef.current) {
			handLightRef.current.intensity = value;
		}
		three.invalidate();
	});
	useMotionValueEvent(phoneLightIntensity, "change", (value) => {
		if (phoneLightRef.current) {
			phoneLightRef.current.intensity = value;
		}
		three.invalidate();
	});

	useEffect(() => {
		const unsubscribe = usePartHoverStore.subscribe((state) => {
			headLightIntensity.set(state.head ? 1 : 0);
			eyeLightIntensity.set(state.eye ? 1 : 0);
			handLightIntensity.set(state.hand ? 1 : 0);
			phoneLightIntensity.set(state.phone ? 1 : 0);
		});
		return () => unsubscribe();
	}, [
		headLightIntensity,
		eyeLightIntensity,
		handLightIntensity,
		phoneLightIntensity,
	]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: invalidate when isDesktop changes
	useEffect(() => {
		three.invalidate();
	}, [isDesktop, three.invalidate]);

	const updateReveal = useCallback(() => {
		const el = sectionRef.current;
		if (!el) return;

		const rect = el.getBoundingClientRect();

		const progressValue = transform(
			window.innerHeight - rect.top,
			[0, rect.height + window.innerHeight],
			[0, 1],
			{
				clamp: true,
			},
		);

		if (progressValue === 0 || progressValue === 1) return;

		reveal.set(progressValue);

		if (headRef.current) {
			headRef.current.position.y = transform(
				progressValue,
				[0.15, 0.4],
				[START.headY, END.headY],
				{
					clamp: true,
					ease: cubicBezier(0.3, 0, 0, 1),
				},
			);
		}
		if (eyeRef.current) {
			eyeRef.current.position.y = transform(
				progressValue,
				[0.25, 0.5],
				[START.eyeY, END.eyeY],
				{
					clamp: true,
					ease: cubicBezier(0.3, 0, 0, 1),
				},
			);
		}
		if (handRef.current) {
			handRef.current.position.y = transform(
				progressValue,
				[0.35, 0.6],
				[START.handY, END.handY],
				{
					clamp: true,
					ease: cubicBezier(0.3, 0, 0, 1),
				},
			);
		}

		if (phoneRef.current) {
			phoneRef.current.position.y = transform(
				progressValue,
				[0.45, 0.6],
				[START.phoneY, END.phoneY],
				{
					clamp: true,
					ease: cubicBezier(0.3, 0, 0, 1),
				},
			);
		}

		for (const uniforms of oozeUniformsRef.current) {
			uniforms.uTime.value = progressValue * 20;
		}

		three.invalidate();
	}, [reveal, sectionRef, three.invalidate]);

	useScrollEvent(updateReveal);

	useLayoutEffect(() => {
		updateReveal();

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
	}, [updateReveal, lookTarget]);

	return (
		<>
			<group
				ref={headRef}
				scale={1.2}
				position={[
					isDesktop ? POSITION_DESKTOP.headX : POSITION_MOBILE.headX,
					START.headY,
					isDesktop ? POSITION_DESKTOP.headZ : POSITION_MOBILE.headZ,
				]}
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
				position={[
					isDesktop ? POSITION_DESKTOP.eyeX : POSITION_MOBILE.eyeX,
					START.eyeY,
					isDesktop ? POSITION_DESKTOP.eyeZ : POSITION_MOBILE.eyeZ,
				]}
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
				position={[
					isDesktop ? POSITION_DESKTOP.handX : POSITION_MOBILE.handX,
					START.handY,
					isDesktop ? POSITION_DESKTOP.handZ : POSITION_MOBILE.handZ,
				]}
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
					isDesktop ? POSITION_DESKTOP.phoneX : POSITION_MOBILE.phoneX,
					START.phoneY,
					isDesktop ? POSITION_DESKTOP.phoneZ : POSITION_MOBILE.phoneZ,
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
};

export default MainScene;
