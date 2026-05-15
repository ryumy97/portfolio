"use client";

import { useIntroStore } from "@/stores/intro";
import type { ScrollCallback } from "lenis";
import { Lenis as LenisComponent, useLenis } from "lenis/react";
import { useEffect } from "react";

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
	return (
		<LenisComponent
			className="h-screen w-screen overflow-scroll relative"
			options={
				horizontal
					? {
							orientation: "horizontal",
							gestureOrientation: "both",
							smoothWheel: true,
						}
					: {
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

export default SmoothScroll;
