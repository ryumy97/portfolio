"use client";

import { Canvas } from "@react-three/fiber";
import { useLenis } from "lenis/react";
import {
	delay,
	motion,
	useAnimationFrame,
	useMotionValue,
} from "motion/react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import RodinScene from "@/components/three/rodin-scene";
import { cn } from "@/lib/utils";
import { useIntroStore } from "@/stores/intro";
import { SubGrid } from "../../components/ui/grid";

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
