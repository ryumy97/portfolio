"use client";

import About from "@/components/about";
import Header from "@/components/header";
// Home page for navigation between pages
// What is Blogs?
// What is Projects?
// What is Gallery?
// What is About?

import { PageTunnelIn } from "@/components/page-tunnel";
import SmoothScroll from "@/components/smooth-scroll";
import { Grid, SubGrid } from "@/components/ui/grid";
import { WebGLRippleCanvas } from "@/components/webgl/webgl-ripple-canvas";
import { useIntroStore } from "@/stores/intro";
import { cubicBezier, motion } from "motion/react";

export default function Home() {
	const { state } = useIntroStore();

	return (
		<PageTunnelIn>
			<motion.div
				key="home"
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
				<SmoothScroll>
					<Grid>
						<Header />
						<SubGrid asChild>
							<main className="px-2">
								<About />
								<div className="col-span-full h-screen w-full bg-red-500"></div>
								<div className="col-span-full h-screen w-full bg-red-500"></div>
								<div className="col-span-full h-screen w-full bg-red-500"></div>
								<div className="col-span-full h-screen w-full bg-red-500"></div>
							</main>
						</SubGrid>
					</Grid>
				</SmoothScroll>
			</motion.div>
		</PageTunnelIn>
	);
}
