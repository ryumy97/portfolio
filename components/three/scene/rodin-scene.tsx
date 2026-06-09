"use client";

import { PerspectiveCamera } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { EffectComposer, Pixelation } from "@react-three/postprocessing";
import type Lenis from "lenis";
import {
	animate,
	clamp,
	useMotionValue,
	useMotionValueEvent,
	useSpring,
} from "motion/react";
import type { PixelationEffect } from "postprocessing";
import { useEffect, useMemo, useRef, useState } from "react";
import type * as THREE from "three";
import { SCREEN, useMediaQuery } from "@/hooks/use-media-query";
import { useIntroStore } from "@/stores/intro";
import { useScrollEvent } from "../../smooth-scroll";
import Rodin from "../model/rodin";
import { Stagger } from "../postprocessing/stagger";
import type { StaggerEffect } from "../postprocessing/stagger-effect";

const START = {
	position: [-0.57, 1.8, 1],
	rotation: [-0.11, -0.1, -0],
};

const TRANSITIONING_DEKSTOP = {
	position: [-3.1, 0.7843018140005457, 3.711369133013187],
	rotation: [0.033795526933088786, -0.4861118293834242, 0.01579368944690987],
};

const TRANSITIONING_MOBILE = {
	position: [-3, 1, 4.6],
	rotation: [0.033795526933088786, -0.4861118293834242, 0.01579368944690987],
};

const RodinScene = () => {
	const state = useIntroStore((store) => store.state);
	const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
	const meshRef = useRef<THREE.Mesh | null>(null);

	const staggerRef = useRef<StaggerEffect | null>(null);
	const pixelationRef = useRef<PixelationEffect | null>(null);

	const [pixelated, setPixelated] = useState(false);

	const three = useThree();

	const positionX = useSpring(START.position[0], {
		stiffness: 100,
		damping: 50,
	});
	const positionY = useSpring(START.position[1], {
		stiffness: 100,
		damping: 50,
	});
	const positionZ = useSpring(START.position[2], {
		stiffness: 100,
		damping: 50,
	});
	const rotationX = useSpring(START.rotation[0], {
		stiffness: 100,
		damping: 50,
	});
	const rotationY = useSpring(START.rotation[1], {
		stiffness: 100,
		damping: 50,
	});
	const rotationZ = useSpring(START.rotation[2], {
		stiffness: 100,
		damping: 50,
	});

	const pixelSize = useMotionValue(24);
	const maskStagger = useMotionValue(0.1);
	const granularity = useMotionValue(12);
	const prefScroll = useMotionValue(0);

	useMotionValueEvent(positionX, "change", (value) => {
		three.camera.position.x = value;
		three.invalidate();
	});
	useMotionValueEvent(positionY, "change", (value) => {
		three.camera.position.y = value;
		three.invalidate();
	});
	useMotionValueEvent(positionZ, "change", (value) => {
		three.camera.position.z = value;
		three.invalidate();
	});
	useMotionValueEvent(rotationX, "change", (value) => {
		three.camera.rotation.x = value;
		three.invalidate();
	});
	useMotionValueEvent(rotationY, "change", (value) => {
		three.camera.rotation.y = value;
		three.invalidate();
	});
	useMotionValueEvent(rotationZ, "change", (value) => {
		three.camera.rotation.z = value;
		three.invalidate();
	});

	useScrollEvent((event: Lenis) => {
		if (!meshRef.current) return;
		const progress = clamp(0, 1, event.actualScroll / window.innerHeight);

		if (prefScroll.get() === progress) {
			return;
		}

		prefScroll.set(progress);

		meshRef.current.position.y = progress;
		meshRef.current.rotation.y = progress;
		three.invalidate();
	});

	const isDesktop = useMediaQuery(SCREEN.md);

	const transitioning = useMemo(() => {
		return isDesktop ? TRANSITIONING_DEKSTOP : TRANSITIONING_MOBILE;
	}, [isDesktop]);

	useEffect(() => {
		if (state === "start") {
			positionX.jump(START.position[0]);
			positionY.jump(START.position[1]);
			positionZ.jump(START.position[2]);
			rotationX.jump(START.rotation[0]);
			rotationY.jump(START.rotation[1]);
			rotationZ.jump(START.rotation[2]);
		} else {
			positionX.set(transitioning.position[0]);
			positionY.set(transitioning.position[1]);
			positionZ.set(transitioning.position[2]);
			rotationX.set(transitioning.rotation[0]);
			rotationY.set(transitioning.rotation[1]);
			rotationZ.set(transitioning.rotation[2]);
		}
	}, [
		state,
		positionX,
		positionY,
		positionZ,
		rotationX,
		rotationY,
		rotationZ,
		transitioning,
	]);

	useMotionValueEvent(pixelSize, "change", (value) => {
		staggerRef.current?.setPixelSize(value);
		three.invalidate();
	});
	useMotionValueEvent(maskStagger, "change", (value) => {
		staggerRef.current?.setMaskStagger(value);
		three.invalidate();
	});
	useMotionValueEvent(granularity, "change", (value) => {
		if (!pixelationRef.current) return;

		pixelationRef.current.granularity = value;
		three.invalidate();
	});

	useEffect(() => {
		if (pixelated) {
			animate(pixelSize, 24, {
				duration: 0.5,
				ease: "linear",
			});
			animate(maskStagger, 0, {
				duration: 0.5,
				ease: "linear",
			});
			animate(granularity, 6, {
				duration: 0.5,
				ease: "linear",
			});
		} else {
			animate(pixelSize, 24, {
				duration: 0.5,
				ease: "linear",
			});
			animate(maskStagger, 0.1, {
				duration: 0.5,
				ease: "linear",
			});
			animate(granularity, 12, {
				duration: 0.5,
				ease: "linear",
			});
		}
	}, [pixelated, granularity, maskStagger, pixelSize]);

	return (
		<>
			<Rodin
				ref={meshRef}
				onClick={() => {
					setPixelated((prev) => !prev);
				}}
				onPointerEnter={() => {
					setPixelated(true);
				}}
				onPointerLeave={() => {
					setPixelated(false);
				}}
			/>
			<ambientLight intensity={0.1} />
			<directionalLight position={[1, 1, 1]} intensity={2} />
			<PerspectiveCamera
				ref={cameraRef}
				fov={28.5}
				position={transitioning.position as [number, number, number]}
				rotation={transitioning.rotation as [number, number, number]}
				makeDefault
			/>
			<EffectComposer>
				<Stagger pixelSize={24} maskStagger={0.1} ref={staggerRef} />
				<Pixelation granularity={12} ref={pixelationRef} />
			</EffectComposer>
		</>
	);
};

export default RodinScene;
