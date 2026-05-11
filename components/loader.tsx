"use client";

import { useIntroStore } from "@/stores/intro";
import { useEffect } from "react";

const LoaderRender = () => {
	const progress = useIntroStore((store) => store.progress);
	const state = useIntroStore((store) => store.state);

	useEffect(() => {
		if (state === "transitioning") {
			useIntroStore.getState().setState("end");

			return;
		}
	}, [state]);

	return (
		<div className="fixed inset-0 bg-black z-50 flex items-center justify-center overflow-hidden">
			{progress}%
			<div className="absolute inset-0">
				<canvas className="w-full h-full" />
			</div>
		</div>
	);
};

const Loader = () => {
	const state = useIntroStore((store) => store.state);

	return (
		// <AnimatePresence>{state !== "end" && <LoaderRender />}</AnimatePresence>
		<LoaderRender />
	);
};

export default Loader;
