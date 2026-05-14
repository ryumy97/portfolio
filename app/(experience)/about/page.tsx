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
import Link from "next/link";

export default function Page2() {
	const { state } = useIntroStore();

	return (
		<PageTunnelIn>
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
		</PageTunnelIn>
	);
}
