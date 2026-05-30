"use client";

import { cubicBezier, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useIntroStore } from "@/stores/intro";
import tunnel from "./ui/tunnel";

const PageTunnel = tunnel();

export const PageTunnelIn = ({ children }: { children: React.ReactNode }) => {
	const { state } = useIntroStore();

	const pathname = usePathname();

	return (
		<PageTunnel.In>
			<motion.div
				key={pathname}
				className="absolute inset-0 bg-background h-screen w-full overflow-hidden origin-bottom"
				initial={
					state === "end"
						? {
								opacity: 0,
							}
						: { opacity: 1 }
				}
				animate={{
					opacity: 1,
					transition: {
						delay: pathname === "/" ? 0.3 : 0,
						duration: 0.8,
						ease: cubicBezier(0.3, 0, 0, 1),
					},
				}}
				exit={{
					opacity: 0,
					transition: {
						duration: 0.3,
						ease: cubicBezier(0.3, 0, 0, 1),
					},
				}}
			>
				{children}
			</motion.div>
		</PageTunnel.In>
	);
};

export const PageTunnelOut = () => {
	return <PageTunnel.OutAnimatePresence mode="wait" />;
};
