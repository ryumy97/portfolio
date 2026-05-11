"use client";

import { useIntroStore } from "@/stores/intro";
import { Lenis as LenisComponent, useLenis } from "lenis/react";
import { useEffect } from "react";

type Props = {
	horizontal?: boolean;
	children: React.ReactNode;
};

const SmoothScroll = ({ horizontal = false, children }: Props) => {
	// const scrollRef = useRef<Lenis | null>(null);
	const state = useIntroStore((store) => store.state);

	const lenis = useLenis();

	useEffect(() => {
		if (state === "end") {
			lenis?.start();
		} else {
			lenis?.stop();
		}
	}, [state, lenis]);

	return (
		<LenisComponent
			className="h-screen w-screen overflow-scroll"
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
			{children}
		</LenisComponent>
	);
};

export default SmoothScroll;
