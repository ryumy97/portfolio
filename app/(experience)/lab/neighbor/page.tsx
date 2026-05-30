"use client";

import { PageTunnelIn } from "@/components/page-tunnel";
import { Button } from "@/components/ui/button";
import { Grid } from "@/components/ui/grid";
import { Slider } from "@/components/ui/slider";
import {
	WEBGL_NEIGHBOR_DEFAULTS,
	WebGLNeighborCanvas,
} from "@/components/webgl/webgl-neighbor-canvas";
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

const CONTROLS = [
	{ key: "pixelSize", label: "Pixel size", min: 4, max: 80, step: 1 },
	{ key: "radius", label: "Radius", min: 0, max: 1, step: 0.01 },
] as const;

type ControlKey = (typeof CONTROLS)[number]["key"];

function clampControlValue(
	value: number,
	min: number,
	max: number,
	step: number,
) {
	const clamped = Math.min(max, Math.max(min, value));
	const decimals = step.toString().split(".")[1]?.length ?? 0;
	return Number(clamped.toFixed(decimals));
}

export default function Home() {
	const progress = useMotionValue(0);
	const [progressState, setProgressState] = useState(0);
	const [values, setValues] = useState<Record<ControlKey, number>>({
		pixelSize: WEBGL_NEIGHBOR_DEFAULTS.pixelSize,
		radius: WEBGL_NEIGHBOR_DEFAULTS.radius,
	});

	useEffect(() => {
		animate(progress, progressState / (NEIGHBOR_IMAGES.length - 1), {
			duration: 1,
			ease: "easeInOut",
		});
	}, [progressState, progress]);

	return (
		<PageTunnelIn>
			<Grid className="fixed inset-0 h-full w-full">
				<div className="col-start-1 col-end-3 border-r relative pt-10 pl-2">
					<Button
						variant="nav"
						size={"nav"}
						className="col-start-1 justify-start"
						asChild
					>
						<Link href="/lab">Back</Link>
					</Button>
					<div className="pt-4 pr-2 flex flex-col gap-4">
						<h1 className="relative text-foreground text-[28px] leading-none font-heading font-bold transition-all duration-300 group">
							Neighbor
						</h1>

						{CONTROLS.map(({ key, label, min, max, step }) => (
							<div key={key} className="flex flex-col gap-1">
								<div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
									<span>{label}</span>
									<input
										type="number"
										min={min}
										max={max}
										step={step}
										value={values[key]}
										onChange={(event) => {
											const next = Number(event.target.value);
											if (Number.isNaN(next)) return;
											setValues((current) => ({
												...current,
												[key]: clampControlValue(next, min, max, step),
											}));
										}}
										className="h-6 w-16 shrink-0 rounded border border-border bg-background px-1.5 text-right text-xs text-foreground tabular-nums outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
									/>
								</div>
								<Slider
									value={[values[key]]}
									onValueChange={([next]) =>
										setValues((current) => ({ ...current, [key]: next }))
									}
									min={min}
									max={max}
									step={step}
								/>
							</div>
						))}
						<div className="flex items-center justify-between gap-2 pt-2">
							<span className="text-xs text-muted-foreground">Image</span>
							<div className="flex items-center gap-1">
								<Button
									variant="outline"
									size="icon"
									className="h-7 w-7"
									onClick={() => setProgressState((current) => current - 1)}
									disabled={progressState <= 0}
								>
									<ArrowLeft className="h-3.5 w-3.5" />
								</Button>
								<span className="min-w-8 text-center text-xs tabular-nums text-muted-foreground">
									{progressState + 1}/{NEIGHBOR_IMAGES.length}
								</span>
								<Button
									variant="outline"
									size="icon"
									className="h-7 w-7"
									onClick={() => setProgressState((current) => current + 1)}
									disabled={progressState >= NEIGHBOR_IMAGES.length - 1}
								>
									<ArrowRight className="h-3.5 w-3.5" />
								</Button>
							</div>
						</div>
					</div>
				</div>
				<div className="col-start-3 col-end-11 flex flex-col items-center justify-center relative">
					<WebGLNeighborCanvas
						className="absolute inset-0 h-full w-full"
						images={NEIGHBOR_IMAGES}
						progress={progress}
						pixelSize={values.pixelSize}
						radius={values.radius}
					/>
				</div>
			</Grid>
		</PageTunnelIn>
	);
}
