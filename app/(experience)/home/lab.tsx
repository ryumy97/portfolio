"use client";

import { LabParticles } from "@/components/three/lab-particles";
import { useScrollEvent } from "@/components/smooth-scroll";
import { SubGrid } from "@/components/ui/grid";
import { PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { transform } from "motion/react";
import { useEffect, useRef } from "react";
import { PointerEventHandler } from "@/components/pointer";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { EffectComposer, Pixelation } from "@react-three/postprocessing";

const Lab = () => {
	const containerRef = useRef<HTMLDivElement>(null);
	const progressRef = useRef(0);
	const inViewRef = useRef(false);
	const invalidateRef = useRef<(() => void) | null>(null);

	useEffect(() => {
		const element = containerRef.current;
		if (!element) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				inViewRef.current = entry.isIntersecting;
				if (entry.isIntersecting) {
					invalidateRef.current?.();
				}
			},
			{ threshold: 0 },
		);

		observer.observe(element);
		return () => observer.disconnect();
	}, []);

	useScrollEvent(() => {
		if (!inViewRef.current) return;

		const rect = containerRef.current?.getBoundingClientRect();
		if (!rect) return;

		const next = transform(
			window.innerHeight - rect.top,
			[0, rect.height + window.innerHeight],
			[0, 0.5],
			{ clamp: true },
		);

		if (progressRef.current === next) return;

		progressRef.current = next;
		invalidateRef.current?.();
	});

	return (
		<SubGrid
			ref={containerRef}
			className="col-span-full h-svh md:aspect-video w-full relative"
		>
			<div className="row-start-1 col-start-1"></div>
			<div className="col-start-2 row-start-2 col-span-2 md:row-start-2 relative z-10">
				<PointerEventHandler asChild type="underline">
					<Link
						href="/lab"
						className="text-[min(max(5vw,16px),24px)] flex items-center justify-start gap-2 max-md:underline"
					>
						Lab
						<ArrowRightIcon
							className="w-[min(max(5vw,16px),24px)]"
							strokeWidth={1.5}
						/>
					</Link>
				</PointerEventHandler>
			</div>
			<div className="row-start-3 col-start-1"></div>

			<div className="absolute inset-0 pointer-events-none">
				<Canvas frameloop="demand">
					<ambientLight intensity={0.1} />
					<directionalLight position={[1, 1, 1]} intensity={2} />
					<PerspectiveCamera
						fov={28.5}
						position={[0, 0, 4]}
						rotation={[0, 0, 1]}
						makeDefault
					/>
					<LabParticles
						progressRef={progressRef}
						inViewRef={inViewRef}
						invalidateRef={invalidateRef}
					/>
					<EffectComposer>
						<Pixelation granularity={8} />
					</EffectComposer>
				</Canvas>
			</div>
		</SubGrid>
	);
};

export default Lab;
