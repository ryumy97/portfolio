"use client";

import { Button } from "@/components/ui/button";
import { Grid } from "@/components/ui/grid";
import { WebGLNeighborCanvas } from "@/components/webgl/webgl-neighbor-canvas";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { animate } from "motion";
import { useMotionValue } from "motion/react";
import type { StaticImageData } from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import image1 from "./neighbor1.png";
import image2 from "./neighbor2.png";
import image3 from "./neighbor3.png";

const NEIGHBOR_IMAGES: StaticImageData[] = [image1, image2, image3];

export default function Home() {
	const progress = useMotionValue(0);
	const [progressState, setProgressState] = useState(0);

	useEffect(() => {
		animate(progress, progressState / (NEIGHBOR_IMAGES.length - 1), {
			duration: 1,
			ease: "easeInOut",
		});
	}, [progressState, progress]);

	return (
		<div className="relative w-full h-full">
			<main className="flex min-h-screen w-max items-center gap-4 px-8">
				<div className="flex items-center justify-center w-screen">
					<div className="bg-white p-4 flex flex-col items-center justify-center relative">
						<h1 className="relative text-foreground text-[10vw] font-heading font-bold transition-all duration-300 group">
							Neighbor
							<div className="absolute bottom-[8%] left-0 bg-foreground w-0 group-hover:w-full transition-all duration-300 h-1" />
						</h1>
						<WebGLNeighborCanvas
							className="relative w-full aspect-video border-8 border-white"
							images={NEIGHBOR_IMAGES}
							progress={progress}
						/>
						<div className="w-full flex items-center justify-between">
							<Button
								onClick={() => {
									setProgressState(progressState - 1);
								}}
								disabled={progressState <= 0}
							>
								<ArrowLeft />
							</Button>
							<Button
								onClick={() => {
									setProgressState(progressState + 1);
								}}
								disabled={progressState >= NEIGHBOR_IMAGES.length - 1}
							>
								<ArrowRight />
							</Button>
						</div>
					</div>
				</div>
			</main>
			<Grid className="absolute top-0 left-0" asChild>
				<header className="col-span-full p-2">
					<Button
						variant="nav"
						size={"text"}
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
