"use client";

import { useIntroStore } from "@/stores/intro";
import { useProgress } from "@react-three/drei";
import { useEffect } from "react";

export function Preloader() {
	const { progress } = useProgress();

	useEffect(() => {
		console.log(progress);
		useIntroStore.getState().setProgress(progress);
		if (progress === 100) {
			useIntroStore.getState().setState("transitioning");
		}
	}, [progress]);

	return null;
}
