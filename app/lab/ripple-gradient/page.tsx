"use client";

import Link from "next/link";
import { useState } from "react";
import { PageTunnelIn } from "@/components/page-tunnel";
import { PointerEventHandler } from "@/components/pointer";
import { Button } from "@/components/ui/button";
import { Grid } from "@/components/ui/grid";
import { Slider } from "@/components/ui/slider";
import {
	WEBGL_RIPPLE_GRADIENT_DEFAULTS,
	WebGLRippleGradientCanvas,
} from "@/components/webgl/webgl-ripple-gradient-canvas";

const CONTROLS = [
	{
		key: "noiseIntensity",
		label: "Noise intensity",
		min: 0,
		max: 0.2,
		step: 0.001,
	},
	{ key: "noiseStyle", label: "Noise style", min: 0, max: 2, step: 0.01 },
	{ key: "ripple", label: "Ripple", min: 0, max: 2, step: 0.01 },
	{ key: "depth", label: "Depth", min: 0, max: 2, step: 0.01 },
	{ key: "speed", label: "Speed", min: 0, max: 2, step: 0.01 },
	{ key: "thickness", label: "Thickness", min: 0.2, max: 2.5, step: 0.01 },
	{ key: "speedField", label: "Speed field", min: 0, max: 1.8, step: 0.01 },
	{ key: "rippleCount", label: "Ripple count", min: 1, max: 4, step: 0.01 },
	{ key: "chromatic", label: "Chromatic", min: 0, max: 1.5, step: 0.01 },
	{ key: "nestedMode", label: "Nested mode", min: 0, max: 1, step: 0.01 },
	{ key: "glassRadius", label: "Glass radius", min: 0, max: 120, step: 1 },
] as const;

type ControlKey = (typeof CONTROLS)[number]["key"];

export default function RippleGradientPage() {
	const [values, setValues] = useState<Record<ControlKey, number>>({
		noiseIntensity: WEBGL_RIPPLE_GRADIENT_DEFAULTS.noiseIntensity,
		noiseStyle: WEBGL_RIPPLE_GRADIENT_DEFAULTS.noiseStyle,
		ripple: WEBGL_RIPPLE_GRADIENT_DEFAULTS.ripple,
		depth: WEBGL_RIPPLE_GRADIENT_DEFAULTS.depth,
		speed: WEBGL_RIPPLE_GRADIENT_DEFAULTS.speed,
		thickness: WEBGL_RIPPLE_GRADIENT_DEFAULTS.thickness,
		speedField: WEBGL_RIPPLE_GRADIENT_DEFAULTS.speedField,
		rippleCount: WEBGL_RIPPLE_GRADIENT_DEFAULTS.rippleCount,
		chromatic: WEBGL_RIPPLE_GRADIENT_DEFAULTS.chromatic,
		nestedMode: WEBGL_RIPPLE_GRADIENT_DEFAULTS.nestedMode,
		glassRadius: WEBGL_RIPPLE_GRADIENT_DEFAULTS.glassRadius,
	});

	return (
		<PageTunnelIn>
			<Grid className="fixed inset-0 h-full w-full">
				<div className="col-start-1 col-end-3 border-r relative pt-10 pl-2 overflow-y-auto">
					<PointerEventHandler asChild type="underline">
						<Button variant="ghost" size={"nav"} asChild>
							<Link href="/lab">Back</Link>
						</Button>
					</PointerEventHandler>
					<div className="pt-4 pr-2 pb-8 flex flex-col gap-4">
						<h1 className="relative text-foreground text-[28px] leading-none font-heading font-bold transition-all duration-300 group">
							Ripple Gradient
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
												[key]: Math.min(max, Math.max(min, next)),
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
					<WebGLRippleGradientCanvas
						className="absolute inset-0 h-full w-full"
						noiseIntensity={values.noiseIntensity}
						noiseStyle={values.noiseStyle}
						ripple={values.ripple}
						depth={values.depth}
						speed={values.speed}
						thickness={values.thickness}
						speedField={values.speedField}
						rippleCount={values.rippleCount}
						chromatic={values.chromatic}
						nestedMode={values.nestedMode}
						glassRadius={values.glassRadius}
					/>
				</div>
			</Grid>
		</PageTunnelIn>
	);
}
