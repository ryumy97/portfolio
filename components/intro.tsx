"use client";

import { useIntroStore } from "@/stores/intro";
import { PerspectiveCamera } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useMotionValueEvent, useSpring } from "motion/react";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import Rodin from "./three/rodin";
import { SubGrid } from "./ui/grid";

const START = {
	position: [-1.57, 1.48, 2],
	rotation: [-0.11, -0.4, -0],
};

const TRANSITIONING = {
	position: [-2.962625911328263, 0.7843018140005457, 3.711369133013187],
	rotation: [0.033795526933088786, -0.4861118293834242, 0.01579368944690987],
};

const RodinScene = () => {
	const state = useIntroStore((store) => store.state);
	const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

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

	useEffect(() => {
		if (state === "start") {
			positionX.jump(START.position[0]);
			positionY.jump(START.position[1]);
			positionZ.jump(START.position[2]);
			rotationX.jump(START.rotation[0]);
			rotationY.jump(START.rotation[1]);
			rotationZ.jump(START.rotation[2]);
		} else if (state === "transitioning") {
			positionX.set(TRANSITIONING.position[0]);
			positionY.set(TRANSITIONING.position[1]);
			positionZ.set(TRANSITIONING.position[2]);
			rotationX.set(TRANSITIONING.rotation[0]);
			rotationY.set(TRANSITIONING.rotation[1]);
			rotationZ.set(TRANSITIONING.rotation[2]);
		}
	}, [state, positionX, positionY, positionZ, rotationX, rotationY, rotationZ]);

	return (
		<>
			<Rodin />
			<ambientLight intensity={0.1} />
			<directionalLight position={[1, 1, 1]} intensity={2} />
			<PerspectiveCamera
				ref={cameraRef}
				fov={28.5}
				position={TRANSITIONING.position as [number, number, number]}
				rotation={TRANSITIONING.rotation as [number, number, number]}
				makeDefault
			/>
		</>
	);
};

const Intro = () => {
	return (
		<SubGrid className="relative h-[calc(100vh-33px)]">
			<h1>Intro</h1>
			<div className="absolute top-[-33px] left-0 w-full h-screen z-10">
				<Canvas frameloop="demand">
					<RodinScene />
				</Canvas>
			</div>
		</SubGrid>
	);
};

export default Intro;
