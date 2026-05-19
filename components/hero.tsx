"use client";

import { cn } from "@/lib/utils";
import { useIntroStore } from "@/stores/intro";
import { PerspectiveCamera } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import Lenis from "lenis";
import { useLenis } from "lenis/react";
import {
	delay,
	motion,
	useAnimationFrame,
	useMotionValue,
	useMotionValueEvent,
	useSpring,
} from "motion/react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useScrollEvent } from "./smooth-scroll";
import Rodin from "./three/rodin";
import { SubGrid } from "./ui/grid";

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

	useScrollEvent((event: Lenis) => {
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

const ScrollingPhrase = () => {
	const state = useIntroStore((store) => store.state);
	const scroll = useLenis();

	const containerRef = useRef<HTMLDivElement>(null);
	const lineRef = useRef<HTMLParagraphElement>(null);

	const [linesPerBlock, setLinesPerBlock] = useState(6);
	const [animationComplete, setAnimationComplete] = useState(false);

	const lineCount = linesPerBlock * 2;
	const lineKeys = useMemo(
		() => Array.from({ length: lineCount }, () => crypto.randomUUID()),
		[lineCount],
	);

	const y = useMotionValue(0);
	const offsetY = useMotionValue(0);

	useAnimationFrame(() => {
		if (animationComplete) {
			offsetY.set(offsetY.get() - window.innerHeight * 0.001);
			y.set(
				(offsetY.get() - (scroll?.animatedScroll ?? 0)) %
					(((lineRef.current?.clientHeight ?? 0) * lineCount) / 2),
			);
		}
	});

	useLayoutEffect(() => {
		const container = containerRef.current;
		const line = lineRef.current;
		if (!container || !line) return;

		const measure = () => {
			const containerHeight = container.getBoundingClientRect().height;
			const lineHeight = line.getBoundingClientRect().height;
			if (lineHeight <= 0) return;
			setLinesPerBlock(
				Math.max(2, Math.ceil(containerHeight / lineHeight) + 1),
			);
		};

		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(container);
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		if (state === "start") {
			delay(() => {
				setAnimationComplete(true);
			}, 1500);
		}
	}, [state]);

	return (
		<motion.div
			ref={containerRef}
			className="col-start-2 col-end-8 h-full overflow-hidden"
			initial={{ y: "100%" }}
			animate={{ y: state !== "start" ? 0 : "100%" }}
			transition={{
				delay: 0.5,
				duration: 1,
				ease: "circOut",
			}}
		>
			<motion.div
				className="flex flex-col text-[7vw] font-heading font-bold leading-[0.8em] tracking-[-0.03em]"
				style={{ y }}
			>
				{lineKeys.map((key, index, arr) => (
					<p
						key={key}
						ref={index === 0 ? lineRef : undefined}
						className="pb-[0.15em]"
					>
						Cogito
						<span
							className={cn(index === linesPerBlock - 1 ? "text-primary" : "")}
						>
							,
						</span>{" "}
						ergo sum
						<span
							className={cn(index === linesPerBlock - 2 ? "text-primary" : "")}
						>
							.
						</span>
					</p>
				))}
			</motion.div>
		</motion.div>
	);
};

const Hero = () => {
	return (
		<SubGrid className="relative aspect-video overflow-hidden">
			<ScrollingPhrase />
			<div className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none">
				<Canvas frameloop="demand" style={{ pointerEvents: "none" }}>
					<RodinScene />
				</Canvas>
			</div>
		</SubGrid>
	);
};

export default Hero;
