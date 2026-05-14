"use client";

// About page
// CV
// In Ha Ryu.
//

import { PageTunnelIn } from "@/components/page-tunnel";
import SmoothScroll from "@/components/smooth-scroll";
import { WebGLRippleCanvas } from "@/components/webgl/webgl-ripple-canvas";
import { useIntroStore } from "@/stores/intro";
import { Canvas } from "@react-three/fiber";
import { cubicBezier, motion } from "motion/react";
import Link from "next/link";

export default function Page2() {
	const { state } = useIntroStore();

	return (
		<PageTunnelIn>
			<motion.div
				key="page2"
				className="absolute inset-0 bg-background h-screen w-full overflow-hidden"
				initial={
					state === "end"
						? {
								y: "100%",
								borderTopLeftRadius: "5vw",
								borderTopRightRadius: "5vw",
							}
						: { y: 0, borderTopLeftRadius: "0vw", borderTopRightRadius: "0vw" }
				}
				animate={{
					y: 0,
					borderTopLeftRadius: "0vw",
					borderTopRightRadius: "0vw",
					transition: {
						delay: 0.2,
						duration: 0.8,
						ease: cubicBezier(0.3, 0, 0, 1),
					},
				}}
				exit={{
					y: "0%",
					borderTopLeftRadius: "5vw",
					borderTopRightRadius: "5vw",
					scale: 0.9,
					opacity: 0.9,
					transition: {
						duration: 0.8,
						ease: cubicBezier(0.3, 0, 0, 1),
					},
				}}
			>
				<WebGLRippleCanvas className="fixed inset-0 h-full w-full" />
				<SmoothScroll horizontal>
					<main className="flex min-h-screen w-max items-center gap-4 px-8">
						<div className="h-96 w-lg shrink-0 bg-red-500"></div>
						<div className="h-96 w-lg shrink-0 bg-red-500"></div>
						<div className="h-96 w-lg shrink-0 bg-red-500"></div>
						<div className="h-96 w-lg shrink-0 bg-red-500"></div>
						<div className="h-96 w-lg shrink-0 bg-red-500"></div>
						<div className="h-96 w-lg shrink-0 bg-red-500"></div>
						<div className="h-96 w-lg shrink-0 bg-red-500"></div>
						<div className="h-96 w-lg shrink-0 bg-red-500"></div>
						<div className="h-96 w-lg shrink-0 bg-red-500"></div>
						<div className="h-96 w-lg shrink-0 bg-red-500"></div>
						<div className="h-96 w-lg shrink-0 bg-red-500"></div>
						<Link href="/">Home</Link>
					</main>
					<Canvas className="fixed inset-0"></Canvas>
				</SmoothScroll>
			</motion.div>
		</PageTunnelIn>
	);
}
