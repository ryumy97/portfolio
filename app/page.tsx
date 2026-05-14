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
						? { x: "-10%", y: "120%", rotate: 10 }
						: { x: 0, y: 0, rotate: 0 }
				}
				animate={{ x: 0, y: 0, rotate: 0 }}
				exit={{ x: "35%", y: "120%", rotate: -10 }}
				transition={{ duration: 0.8, ease: cubicBezier(0.3, 0, 0, 1) }}
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
