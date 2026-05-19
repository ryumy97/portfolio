"use client";

import { Button } from "@/components/ui/button";
import { Grid } from "@/components/ui/grid";
import { Slider } from "@/components/ui/slider";
import { WebGLPixelationCanvas } from "@/components/webgl/webgl-pixelation-canvas";
import { useMotionValue } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import image from "../neighbor/neighbor1.png";

export default function Home() {
	const [pixelSizeValue, setPixelSizeValue] = useState(64);
	const [radiusValue, setRadiusValue] = useState(1);

	const pixelSize = useMotionValue(pixelSizeValue);
	const radius = useMotionValue(radiusValue);

	useEffect(() => {
		pixelSize.set(pixelSizeValue);
		radius.set(radiusValue);
	}, [pixelSizeValue, radiusValue, pixelSize, radius]);

	return (
		<div className="relative w-full h-full">
			<WebGLPixelationCanvas
				className="fixed inset-0 h-full w-full"
				radius={radius}
				pixelSize={pixelSize}
				image={image}
			/>
			<Grid className="fixed inset-0 h-full w-full">
				<div className="col-start-4 col-end-8 flex flex-col items-center justify-center">
					<h1 className="relative text-foreground text-[10vw] font-heading font-bold transition-all duration-300 group bg-white">
						Pixelation
					</h1>
					<div className="bg-white w-full h-20 flex flex-col items-center justify-center gap-4 p-4">
						<Slider
							value={[pixelSizeValue]}
							onValueChange={(value) => setPixelSizeValue(value[0])}
							min={8}
							max={128}
							step={1}
						/>
						<Slider
							value={[radiusValue]}
							onValueChange={(value) => setRadiusValue(value[0])}
							min={0}
							max={1}
							step={0.01}
						/>
					</div>
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
