"use client";

import { Button } from "@/components/ui/button";
import { Grid } from "@/components/ui/grid";
import { Slider } from "@/components/ui/slider";
import {
	WEBGL_RIPPLE_DEFAULTS,
	WebGLRippleCanvas,
} from "@/components/webgl/webgl-ripple-canvas";
import Link from "next/link";
import { useState } from "react";

const CONTROLS = [
	{ key: "pixelSize", label: "Pixel size", min: 10, max: 100, step: 1 },
	{ key: "radius", label: "Radius", min: 0, max: 1, step: 0.01 },
	{ key: "expandRate", label: "Expand rate", min: 0.1, max: 1, step: 0.01 },
	{ key: "fadeRate", label: "Fade rate", min: 8, max: 20, step: 0.1 },
	{ key: "waveFrequency", label: "Wave frequency", min: 10, max: 80, step: 1 },
	{ key: "maxRipples", label: "Max ripples", min: 1, max: 24, step: 1 },
	{
		key: "velocityScale",
		label: "Velocity scale",
		min: 100,
		max: 3000,
		step: 50,
	},
	{ key: "maxVelocity", label: "Max velocity", min: 0.1, max: 2, step: 0.01 },
	{
		key: "driftStrength",
		label: "Drift strength",
		min: 0,
		max: 1,
		step: 0.01,
	},
	{
		key: "pointerThrottleMs",
		label: "Pointer throttle",
		min: 0,
		max: 50,
		step: 1,
	},
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
		pixelSize: WEBGL_RIPPLE_DEFAULTS.pixelSize,
		radius: WEBGL_RIPPLE_DEFAULTS.radius,
		expandRate: WEBGL_RIPPLE_DEFAULTS.expandRate,
		fadeRate: WEBGL_RIPPLE_DEFAULTS.fadeRate,
		waveFrequency: WEBGL_RIPPLE_DEFAULTS.waveFrequency,
		maxRipples: WEBGL_RIPPLE_DEFAULTS.maxRipples,
		velocityScale: WEBGL_RIPPLE_DEFAULTS.velocityScale,
		maxVelocity: WEBGL_RIPPLE_DEFAULTS.maxVelocity,
		driftStrength: WEBGL_RIPPLE_DEFAULTS.driftStrength,
		pointerThrottleMs: WEBGL_RIPPLE_DEFAULTS.pointerThrottleMs,
	});

	return (
		<div className="relative w-full h-full">
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
					<WebGLRippleCanvas
						className="absolute inset-0 h-full w-full"
						pixelSize={values.pixelSize}
						radius={values.radius}
						expandRate={values.expandRate}
						fadeRate={values.fadeRate}
						waveFrequency={values.waveFrequency}
						maxRipples={values.maxRipples}
						velocityScale={values.velocityScale}
						maxVelocity={values.maxVelocity}
						driftStrength={values.driftStrength}
						pointerThrottleMs={values.pointerThrottleMs}
					/>
					<h1 className="relative text-foreground text-[10vw] font-heading font-bold transition-all duration-300 group">
						Ripple
					</h1>
				</div>
			</Grid>
		</div>
	);
}
