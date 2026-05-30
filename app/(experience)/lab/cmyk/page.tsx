"use client";

import { PageTunnelIn } from "@/components/page-tunnel";
import { PointerEventHandler } from "@/components/pointer";
import { Button } from "@/components/ui/button";
import { Grid } from "@/components/ui/grid";
import { Slider } from "@/components/ui/slider";
import {
	WEBGL_CMYK_DEFAULTS,
	WebGLCmykCanvas,
} from "@/components/webgl/webgl-cmyk-canvas";
import Link from "next/link";
import { useState } from "react";
import image from "../neighbor/neighbor1.png";

const CONTROLS = [
	{ key: "pixelSize", label: "Pixel size", min: 2, max: 32, step: 1 },
	{ key: "dotSize", label: "Dot size", min: 0.1, max: 1, step: 0.01 },
	{ key: "cyanStrength", label: "Cyan strength", min: 0, max: 2, step: 0.01 },
	{
		key: "magentaStrength",
		label: "Magenta strength",
		min: 0,
		max: 2,
		step: 0.01,
	},
	{
		key: "yellowStrength",
		label: "Yellow strength",
		min: 0,
		max: 2,
		step: 0.01,
	},
	{ key: "blackStrength", label: "Black strength", min: 0, max: 2, step: 0.01 },
	{ key: "angleC", label: "Cyan angle", min: 0, max: 90, step: 1 },
	{ key: "angleM", label: "Magenta angle", min: 0, max: 90, step: 1 },
	{ key: "angleY", label: "Yellow angle", min: 0, max: 90, step: 1 },
	{ key: "angleK", label: "Black angle", min: 0, max: 90, step: 1 },
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
		pixelSize: WEBGL_CMYK_DEFAULTS.pixelSize,
		dotSize: WEBGL_CMYK_DEFAULTS.dotSize,
		cyanStrength: WEBGL_CMYK_DEFAULTS.cyanStrength,
		magentaStrength: WEBGL_CMYK_DEFAULTS.magentaStrength,
		yellowStrength: WEBGL_CMYK_DEFAULTS.yellowStrength,
		blackStrength: WEBGL_CMYK_DEFAULTS.blackStrength,
		angleC: WEBGL_CMYK_DEFAULTS.angleC,
		angleM: WEBGL_CMYK_DEFAULTS.angleM,
		angleY: WEBGL_CMYK_DEFAULTS.angleY,
		angleK: WEBGL_CMYK_DEFAULTS.angleK,
	});

	return (
		<PageTunnelIn>
			<Grid className="fixed inset-0 h-full w-full">
				<div className="col-start-1 col-end-3 border-r relative pt-10 pl-2 overflow-y-auto">
					<div className="col-start-1 relative">
						<PointerEventHandler asChild type="underline">
							<Button variant="ghost" size={"nav"} asChild>
								<Link href="/lab">Back</Link>
							</Button>
						</PointerEventHandler>
					</div>
					<div className="pt-4 pr-2 pb-8 flex flex-col gap-4">
						<h1 className="relative text-foreground text-[28px] leading-none font-heading font-bold transition-all duration-300 group">
							CMYK
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
					<WebGLCmykCanvas
						className="absolute inset-0 h-full w-full"
						image={image}
						pixelSize={values.pixelSize}
						dotSize={values.dotSize}
						cyanStrength={values.cyanStrength}
						magentaStrength={values.magentaStrength}
						yellowStrength={values.yellowStrength}
						blackStrength={values.blackStrength}
						angleC={values.angleC}
						angleM={values.angleM}
						angleY={values.angleY}
						angleK={values.angleK}
					/>
				</div>
			</Grid>
		</PageTunnelIn>
	);
}
