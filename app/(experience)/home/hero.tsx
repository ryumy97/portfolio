"use client";

import { PerspectiveCamera } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { EffectComposer, Pixelation } from "@react-three/postprocessing";
import type Lenis from "lenis";
import { useLenis } from "lenis/react";
import {
	animate,
	clamp,
	delay,
	motion,
	useAnimationFrame,
	useMotionValue,
	useMotionValueEvent,
	useSpring,
} from "motion/react";
import type { PixelationEffect } from "postprocessing";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type * as THREE from "three";
import { Stagger } from "@/components/three/postprocessing/stagger";
import { SCREEN, useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { useIntroStore } from "@/stores/intro";
import { useScrollEvent } from "../../../components/smooth-scroll";
import type { StaggerEffect } from "../../../components/three/postprocessing/stagger-effect";
import Rodin from "../../../components/three/rodin";
import { SubGrid } from "../../../components/ui/grid";

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

const ScrollingPhrase = () => {
	const state = useIntroStore((store) => store.state);
	const scroll = useLenis();

	const containerRef = useRef<HTMLDivElement>(null);
	const lineRef = useRef<HTMLParagraphElement>(null);

	const [linesPerBlock, setLinesPerBlock] = useState(6);
	const [animationComplete, setAnimationComplete] = useState(state === "end");

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
			className="col-start-3 col-end-10 md:col-start-2 md:col-end-8 h-full overflow-hidden pointer-events-none"
			initial={{ y: "100%" }}
			animate={{ y: state !== "start" ? 0 : "100%" }}
			transition={{
				delay: 0.5,
				duration: 1,
				ease: "circOut",
			}}
		>
			<motion.div
				className="flex flex-col text-[15vw] md:text-[7vw] font-heading font-bold leading-[0.8em] tracking-[-0.03em]"
				style={{ y }}
			>
				{lineKeys.map((key, index, _arr) => (
					<p
						key={key}
						ref={index === 0 ? lineRef : undefined}
						className="pb-[0.15em] flex flex-col gap-1 md:block"
						lang="en"
					>
						<span>
							Cogito
							<span
								className={cn(
									index === linesPerBlock - 1 ? "text-primary" : "",
								)}
							>
								,
							</span>{" "}
						</span>
						<span>
							ergo sum
							<span
								className={cn(
									index === linesPerBlock - 2 ? "text-primary" : "",
								)}
							>
								.
							</span>
						</span>
					</p>
				))}
			</motion.div>
		</motion.div>
	);
};

const Hero = () => {
	const ref = useRef<HTMLDivElement>(null);

	return (
		<SubGrid
			className="relative h-[calc(100svh-24px)] md:aspect-video overflow-hidden"
			ref={ref}
		>
			<ScrollingPhrase />
			<div className="absolute top-0 left-0 right-0 h-full z-10 pointer-events-none">
				<Canvas eventSource={ref.current ?? undefined} frameloop="demand">
					<RodinScene />
				</Canvas>
			</div>
		</SubGrid>
	);
};

export default Hero;
