"use client";

import Header from "@/components/header";
import Hero from "@/components/hero";
// Home page for navigation between pages
// What is Blogs?
// What is Projects?
// What is Gallery?
// What is About?

import About from "@/components/about";
import { PageTunnelIn } from "@/components/page-tunnel";
import SmoothScroll from "@/components/smooth-scroll";
import { Grid, SubGrid } from "@/components/ui/grid";
import { useIntroStore } from "@/stores/intro";

export default function Home() {
	const { state } = useIntroStore();

	return (
		<PageTunnelIn>
			{/* <WebGLRippleCanvas className="fixed inset-0 h-full w-full" /> */}
			<SmoothScroll>
				<Grid>
					<Header />
					<SubGrid asChild>
						<main className="px-2">
							<Hero />
							<About />
							<div className="col-span-full h-screen w-full bg-red-500"></div>
							<div className="col-span-full h-screen w-full bg-red-500"></div>
							<div className="col-span-full h-screen w-full bg-red-500"></div>
						</main>
					</SubGrid>
				</Grid>
			</SmoothScroll>
		</PageTunnelIn>
	);
}
