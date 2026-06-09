"use client";

import { useState } from "react";
import { LabNumericControls } from "@/app/lab/lab-numeric-controls";
import { LabPageLayout } from "@/app/lab/lab-page-layout";
import {
	WEBGL_RIPPLE_DEFAULTS,
	WebGLRippleCanvas,
} from "@/components/webgl/webgl-ripple-canvas";
import type { LabNumericControlDef } from "@/lib/lab/controls";

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
] as const satisfies readonly LabNumericControlDef[];

type ControlKey = (typeof CONTROLS)[number]["key"];

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
		<LabPageLayout
			title="Ripple"
			description="Move the pointer to send halftone ripples across the canvas."
			sidebar={
				<LabNumericControls
					controls={CONTROLS}
					values={values}
					onValueChange={(key, value) =>
						setValues((current) => ({ ...current, [key]: value }))
					}
				/>
			}
		>
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
		</LabPageLayout>
	);
}
