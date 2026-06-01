"use client";

import "@/components/three/rodin";
import { useProgress } from "@react-three/drei";
import { animate } from "motion";
import { cubicBezier, useMotionValue } from "motion/react";
import { useEffect } from "react";
import { WebGLGradientCanvas } from "@/components/webgl/webgl-gradient-canvas";
import { cn } from "@/lib/utils";
import { useIntroStore } from "@/stores/intro";

export const ForceLoad = () => {
	useIntroStore.getState().setState("end");

	return null;
};

const Loader = () => {
	const { progress, total } = useProgress();

	console.log(progress, total);

	const state = useIntroStore((store) => store.state);

	const progressMotion = useMotionValue(0);

	useEffect(() => {
		useIntroStore.getState().setProgress(progress);
		if (progress === 100) {
			useIntroStore.getState().setState("transitioning");
		}
	}, [progress]);

	useEffect(() => {
		if (state === "transitioning") {
			animate(progressMotion, 1, {
				duration: 2,
				ease: cubicBezier(0.3, 0, 0, 1),
				onComplete() {
					useIntroStore.getState().setState("end");
				},
			});

			return;
		}
	}, [state, progressMotion]);

	if (state === "end") return null;

	return (
		<div
			className={cn(
				"fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black",
				{
					"bg-transparent pointer-events-none": state !== "start",
				},
			)}
		>
			<WebGLGradientCanvas
				className="absolute inset-0 h-full w-full"
				progress={progressMotion}
			/>
			{state !== "transitioning" && (
				<span className="relative z-10 text-sm font-medium text-background tabular-nums drop-shadow-md">
					{progress}%
				</span>
			)}
		</div>
	);
};

export default Loader;
