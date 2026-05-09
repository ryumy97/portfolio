"use client";

import { Lenis } from "lenis/react";

type Props = {
	horizontal?: boolean;
	children: React.ReactNode;
};

const SmoothScroll = ({ horizontal = false, children }: Props) => {
	return (
		<Lenis
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
		</Lenis>
	);
};

export default SmoothScroll;
