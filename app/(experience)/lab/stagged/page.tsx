"use client";

import { Button } from "@/components/ui/button";
import { Grid } from "@/components/ui/grid";
import { Canvas } from "@react-three/fiber";
import Link from "next/link";
import { useRef, useState } from "react";
import { StaggedScene } from "./scene";

export default function Home() {
	const ref = useRef<HTMLDivElement>(null);

	return (
		<div className="relative w-full h-full" ref={ref}>
			<Grid className="fixed inset-0 h-full w-full pointer-events-none">
				<div className="col-start-4 col-end-8 flex flex-col items-center justify-center gap-4 pointer-events-auto">
					<h1 className="relative text-foreground text-[10vw] font-heading font-bold transition-all duration-300 group bg-white">
						Staggered
					</h1>
				</div>
			</Grid>

			<div className="fixed inset-0 h-full w-full">
				<Canvas eventSource={ref.current ?? undefined} frameloop="demand">
					<StaggedScene pixelSize={24} maskStagger={0.1} granularity={12} />
				</Canvas>
			</div>
			<Grid className="absolute top-0 left-0" asChild>
				<header className="col-span-full p-2">
					<Button
						variant="nav"
						size={"nav"}
						className="col-start-1 justify-start"
						asChild
					>
						<Link href="/lab">Back</Link>
					</Button>
				</header>
			</Grid>
		</div>
	);
}
