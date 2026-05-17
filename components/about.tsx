"use client";

import { useIntroStore } from "@/stores/intro";
import { PerspectiveCamera } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useLenis } from "lenis/react";
import { useMotionValueEvent, useSpring } from "motion/react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import Rodin from "./three/rodin";
import { SubGrid } from "./ui/grid";
import { PointerEventHandler } from "./pointer";

const START = {
	position: [-0.57, 1.8, 1],
	rotation: [-0.11, -0.1, -0],
};

const TRANSITIONING = {
	position: [-3.1, 0.7843018140005457, 3.711369133013187],
	rotation: [0.033795526933088786, -0.4861118293834242, 0.01579368944690987],
};

const RodinScene = () => {
	const state = useIntroStore((store) => store.state);
	const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
	const meshRef = useRef<THREE.Mesh | null>(null);

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

	const lenis = useLenis();

	lenis?.on("scroll", (event) => {
		if (!meshRef.current) return;

		let progress = event.actualScroll / window.innerHeight;
		if (progress > 1) {
			progress = 1;
		}
		if (progress < 0) {
			progress = 0;
		}
		meshRef.current.position.y = progress;
		meshRef.current.rotation.y = progress;
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
			<Rodin ref={meshRef} />
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

const About = () => {
	return (
		<SubGrid className="relative h-[calc(100vh-33px)]">
			<div className="col-start-3 items-center col-end-7 flex">
				<PointerEventHandler asChild>
					<Link href="/about">
						<h1 className="text-[10vw] font-bold">About</h1>
					</Link>
				</PointerEventHandler>
			</div>
			<div className="absolute top-[-33px] left-0 w-full h-screen z-10 pointer-events-none">
				<Canvas frameloop="demand" style={{ pointerEvents: "none" }}>
					<RodinScene />
				</Canvas>
			</div>
		</SubGrid>
	);
};

export default About;
