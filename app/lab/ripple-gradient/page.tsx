"use client";

import { useState } from "react";
import { LabNumericControls } from "@/app/lab/lab-numeric-controls";
import { LabPageLayout } from "@/app/lab/lab-page-layout";
import {
	WEBGL_RIPPLE_GRADIENT_DEFAULTS,
	WebGLRippleGradientCanvas,
} from "@/components/webgl/webgl-ripple-gradient-canvas";
import type { LabNumericControlDef } from "@/lib/lab/controls";

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
] as const satisfies readonly LabNumericControlDef[];

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
		<LabPageLayout
			title="Ripple Gradient"
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
		</LabPageLayout>
	);
}
