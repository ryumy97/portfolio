"use client";

import { Button } from "@/components/ui/button";
import { Grid } from "@/components/ui/grid";
import { WebGLRippleCanvas } from "@/components/webgl/webgl-ripple-canvas";
import Link from "next/link";

export default function Home() {
	return (
		<div className="relative w-full h-full">
			<WebGLRippleCanvas className="fixed inset-0 h-full w-full" />
			<Grid className="fixed inset-0 h-full w-full">
				<div className="col-start-4 col-end-8 flex items-center justify-center">
					<h1 className="relative text-foreground text-[10vw] font-heading font-bold transition-all duration-300 group">
						Ripple
					</h1>
				</div>
			</Grid>
			<Grid className="absolute top-0 left-0" asChild>
				<header className="col-span-full p-2">
					<Button
						variant="nav"
						size={"nav"}
						className="col-start-1 justify-start"
						asChild
					>
						<Link href="/canvas">Back</Link>
					</Button>
				</header>
			</Grid>
		</div>
	);
}
