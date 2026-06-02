"use client";

import { PerspectiveCamera } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useMotionValueEvent, useSpring } from "motion/react";
import { useEffect, useMemo, useRef } from "react";
import type * as THREE from "three";
import { SCREEN, useMediaQuery } from "@/hooks/use-media-query";
import { useIntroStore } from "@/stores/intro";
import { Head } from "./head";

const START = {
	ambientLight: 0,
	pointLight: [-0.2, 0.8, 0.4, 0],
	position: [0, 0.1, 0],
	rotation: [0.1, 0, 0],
};

const TRANSITIONING_DEKSTOP = {
	ambientLight: 0.7,
	pointLight: [0.1, -0.4, 0.8, 3],
	position: [0, 0, 0],
	rotation: [0, 0, 0],
};

const TRANSITIONING_MOBILE = {
	ambientLight: 0.7,
	pointLight: [0.1, -0.4, 0.8, 3],
	position: [0, 0, 0],
	rotation: [0, 0, 0],
};

const WARM_AMBIENT_COLOR = "#fff8ec";
const WARM_KEY_COLOR = "#fff2d6";

const HeadScene = () => {
	const state = useIntroStore((store) => store.state);

	const meshRef = useRef<THREE.Mesh | null>(null);
	const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
	const pointLightRef = useRef<THREE.PointLight | null>(null);
	const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

	const three = useThree();

	const ambientLight = useSpring(START.ambientLight, {
		stiffness: 100,
		damping: 50,
	});
	const pointLightX = useSpring(START.pointLight[0], {
		stiffness: 100,
		damping: 50,
	});
	const pointLightY = useSpring(START.pointLight[1], {
		stiffness: 100,
		damping: 50,
	});
	const pointLightZ = useSpring(START.pointLight[2], {
		stiffness: 100,
		damping: 50,
	});
	const pointLightIntensity = useSpring(START.pointLight[3], {
		stiffness: 100,
		damping: 50,
	});

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

	useMotionValueEvent(positionX, "change", (value) => {
		if (meshRef.current) {
			meshRef.current.position.x = value;
		}
		three.invalidate();
	});
	useMotionValueEvent(positionY, "change", (value) => {
		if (meshRef.current) {
			meshRef.current.position.y = value;
		}
		three.invalidate();
	});
	useMotionValueEvent(positionZ, "change", (value) => {
		if (meshRef.current) {
			meshRef.current.position.z = value;
		}
		three.invalidate();
	});
	useMotionValueEvent(rotationX, "change", (value) => {
		if (meshRef.current) {
			meshRef.current.rotation.x = value;
		}
		three.invalidate();
	});
	useMotionValueEvent(rotationY, "change", (value) => {
		if (meshRef.current) {
			meshRef.current.rotation.y = value;
		}
		three.invalidate();
	});
	useMotionValueEvent(rotationZ, "change", (value) => {
		if (meshRef.current) {
			meshRef.current.rotation.z = value;
		}
		three.invalidate();
	});
	useMotionValueEvent(ambientLight, "change", (value) => {
		if (ambientLightRef.current) {
			ambientLightRef.current.intensity = value;
		}
		three.invalidate();
	});
	useMotionValueEvent(pointLightX, "change", (value) => {
		if (pointLightRef.current) {
			pointLightRef.current.position.x = value;
		}
		three.invalidate();
	});
	useMotionValueEvent(pointLightY, "change", (value) => {
		if (pointLightRef.current) {
			pointLightRef.current.position.y = value;
		}
		three.invalidate();
	});
	useMotionValueEvent(pointLightZ, "change", (value) => {
		if (pointLightRef.current) {
			pointLightRef.current.position.z = value;
		}
		three.invalidate();
	});
	useMotionValueEvent(pointLightIntensity, "change", (value) => {
		if (pointLightRef.current) {
			pointLightRef.current.intensity = value;
		}
		three.invalidate();
	});

	const isDesktop = useMediaQuery(SCREEN.md);

	const transitioning = useMemo(() => {
		return isDesktop ? TRANSITIONING_DEKSTOP : TRANSITIONING_MOBILE;
	}, [isDesktop]);

	useEffect(() => {
		if (state === "start") {
			ambientLight.jump(START.ambientLight);
			pointLightX.jump(START.pointLight[0]);
			pointLightY.jump(START.pointLight[1]);
			pointLightZ.jump(START.pointLight[2]);
			pointLightIntensity.jump(START.pointLight[3]);
			positionX.jump(START.position[0]);
			positionY.jump(START.position[1]);
			positionZ.jump(START.position[2]);
			rotationX.jump(START.rotation[0]);
			rotationY.jump(START.rotation[1]);
			rotationZ.jump(START.rotation[2]);
		} else {
			ambientLight.set(transitioning.ambientLight);
			pointLightX.set(transitioning.pointLight[0]);
			pointLightY.set(transitioning.pointLight[1]);
			pointLightZ.set(transitioning.pointLight[2]);
			pointLightIntensity.set(transitioning.pointLight[3]);
			positionX.set(transitioning.position[0]);
			positionY.set(transitioning.position[1]);
			positionZ.set(transitioning.position[2]);
			rotationX.set(transitioning.rotation[0]);
			rotationY.set(transitioning.rotation[1]);
			rotationZ.set(transitioning.rotation[2]);

			const handlePointerMove = (event: PointerEvent) => {
				pointLightX.set((event.clientX / window.innerWidth - 0.5) * 1.5);
				pointLightY.set(-(event.clientY / window.innerHeight - 0.5) * 1.5);

				rotationY.set((event.clientX / window.innerWidth - 0.5) * 0.2);
				rotationX.set((event.clientY / window.innerHeight - 0.5) * 0.2);

				three.invalidate();
			};

			window.addEventListener("pointermove", handlePointerMove);

			return () => {
				window.removeEventListener("pointermove", handlePointerMove);
			};
		}
	}, [
		state,
		ambientLight,
		pointLightX,
		pointLightY,
		pointLightZ,
		pointLightIntensity,
		transitioning,
		three.invalidate,
		positionX,
		positionY,
		positionZ,
		rotationX,
		rotationY,
		rotationZ,
	]);

	return (
		<>
			<Head ref={meshRef} />
			<ambientLight
				color={WARM_AMBIENT_COLOR}
				intensity={START.ambientLight}
				ref={ambientLightRef}
			/>
			<pointLight
				color={WARM_KEY_COLOR}
				position={START.pointLight as [number, number, number]}
				intensity={START.pointLight[3]}
				ref={pointLightRef}
			/>
			<PerspectiveCamera
				ref={cameraRef}
				fov={28.5}
				position={[0, 0, 3.5]}
				rotation={[0, 0, 0]}
				makeDefault
			/>
		</>
	);
};

export default HeadScene;
