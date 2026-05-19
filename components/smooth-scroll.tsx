"use client";

import { useIntroStore } from "@/stores/intro";
import type { ScrollCallback } from "lenis";
import { Lenis as LenisComponent, type LenisRef, useLenis } from "lenis/react";
import { cancelFrame, frame } from "motion";
import { useEffect, useRef } from "react";

type Props = {
	horizontal?: boolean;
	onScroll?: ScrollCallback;
	children: React.ReactNode;
};

function SmoothScrollController({
	onScroll,
	children,
}: Pick<Props, "onScroll" | "children">) {
	const state = useIntroStore((store) => store.state);
	const lenis = useLenis(onScroll, onScroll ? [onScroll] : []);

	useEffect(() => {
		if (state === "end") {
			lenis?.start();
		} else {
			lenis?.stop();
		}
	}, [state, lenis]);

	return children;
}

const SmoothScroll = ({ horizontal = false, onScroll, children }: Props) => {
	const lenisRef = useRef<LenisRef | null>(null);

	useEffect(() => {
		function update(data: { timestamp: number }) {
			const time = data.timestamp;
			lenisRef.current?.lenis?.raf(time);
		}

		frame.update(update, true);

		return () => cancelFrame(update);
	}, []);

	return (
		<LenisComponent
			ref={lenisRef}
			className="h-screen w-screen overflow-scroll relative"
			options={
				horizontal
					? {
							autoRaf: false,
							orientation: "horizontal",
							gestureOrientation: "both",
							smoothWheel: true,
						}
					: {
							autoRaf: false,
							orientation: "vertical",
							smoothWheel: true,
						}
			}
		>
			<SmoothScrollController onScroll={onScroll}>
				{children}
			</SmoothScrollController>
		</LenisComponent>
	);
};

export function useScrollEvent(callback: ScrollCallback) {
	const lenis = useLenis();

	useEffect(() => {
		lenis?.on("scroll", callback);

		return () => {
			lenis?.off("scroll", callback);
		};
	}, [lenis, callback]);
}

export default SmoothScroll;
