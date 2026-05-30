"use client";

import { PageTunnelIn } from "@/components/page-tunnel";
import { Button } from "@/components/ui/button";
import { Grid } from "@/components/ui/grid";
import { Slider } from "@/components/ui/slider";
import {
	WEBGL_PIXELATION_DEFAULTS,
	WebGLPixelationCanvas,
} from "@/components/webgl/webgl-pixelation-canvas";
import Link from "next/link";
import { useState } from "react";
import image from "../neighbor/neighbor1.png";

const CONTROLS = [
	{ key: "pixelSize", label: "Pixel size", min: 8, max: 128, step: 1 },
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
	const [values, setValues] = useState<Record<ControlKey, number>>({
		pixelSize: WEBGL_PIXELATION_DEFAULTS.pixelSize,
		radius: WEBGL_PIXELATION_DEFAULTS.radius,
	});

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
							Pixelation
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
					</div>
				</div>
				<div className="col-start-3 col-end-11 flex flex-col items-center justify-center relative">
					<WebGLPixelationCanvas
						className="absolute inset-0 h-full w-full"
						image={image}
						pixelSize={values.pixelSize}
						radius={values.radius}
					/>
				</div>
			</Grid>
		</PageTunnelIn>
	);
}
