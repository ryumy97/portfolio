"use client";

import { cubicBezier, motion } from "motion/react";
import tunnel from "./ui/tunnel";
import { useIntroStore } from "@/stores/intro";
import { usePathname } from "next/navigation";

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
								y: "100%",
							}
						: { y: 0 }
				}
				animate={{
					y: 0,
					transition: {
						delay: 0.2,
						duration: 0.8,
						ease: cubicBezier(0.3, 0, 0, 1),
					},
				}}
				exit={{
					y: "10%",
					opacity: 0.9,
					transition: {
						duration: 0.8,
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
	return <PageTunnel.OutAnimatePresence mode="popLayout" />;
};
