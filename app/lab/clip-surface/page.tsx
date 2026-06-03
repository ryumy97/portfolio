"use client";

import { Canvas } from "@react-three/fiber";
import Link from "next/link";
import { useState } from "react";
import { PageTunnelIn } from "@/components/page-tunnel";
import { PointerEventHandler } from "@/components/pointer";
import {
	CLIP_SURFACE_SCENE_DEFAULTS,
	ClipSurfaceScene,
} from "@/components/three/clip-surface-scene";
import { Button } from "@/components/ui/button";
import { Grid } from "@/components/ui/grid";
import { Slider } from "@/components/ui/slider";
import type { ClipDebugState } from "@/lib/three/clip-debug";

const NUMERIC_CONTROLS = [
	{ key: "clipY", label: "Clip Y", min: -2, max: 2, step: 0.01 },
	{ key: "wave1", label: "Wave 1", min: 0, max: 0.1, step: 0.001 },
	{ key: "wave2", label: "Wave 2", min: 0, max: 0.1, step: 0.001 },
	{ key: "wave3", label: "Wave 3", min: 0, max: 0.1, step: 0.001 },
	{ key: "speed", label: "Speed", min: 0, max: 3, step: 0.01 },
] as const satisfies ReadonlyArray<{
	key: keyof ClipDebugState;
	label: string;
	min: number;
	max: number;
	step: number;
}>;

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

export default function Page() {
	const [values, setValues] = useState({
		clipY: CLIP_SURFACE_SCENE_DEFAULTS.clipY,
		wave1: CLIP_SURFACE_SCENE_DEFAULTS.wave1,
		wave2: CLIP_SURFACE_SCENE_DEFAULTS.wave2,
		wave3: CLIP_SURFACE_SCENE_DEFAULTS.wave3,
		speed: CLIP_SURFACE_SCENE_DEFAULTS.speed,
		color: CLIP_SURFACE_SCENE_DEFAULTS.color,
	});

	return (
		<PageTunnelIn>
			<Grid className="fixed inset-0 h-full w-full">
				<div className="col-start-1 col-end-3 z-10 border-r relative pt-10 pl-2 overflow-y-auto bg-background/90">
					<PointerEventHandler asChild type="underline">
						<Button variant="ghost" size="nav" asChild>
							<Link href="/lab">Back</Link>
						</Button>
					</PointerEventHandler>
					<div className="pt-4 pr-2 pb-8 flex flex-col gap-4">
						<h1 className="text-[28px] leading-none font-heading font-bold">
							Clip surface
						</h1>
						{NUMERIC_CONTROLS.map(({ key, label, min, max, step }) => (
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
						<div className="flex flex-col gap-1">
							<span className="text-xs text-muted-foreground">Color</span>
							<input
								type="color"
								value={values.color}
								onChange={(event) =>
									setValues((current) => ({
										...current,
										color: event.target.value,
									}))
								}
								className="h-8 w-full cursor-pointer rounded border border-border bg-background"
							/>
						</div>
					</div>
				</div>
				<div className="col-start-3 col-end-11 h-full">
					<Canvas frameloop="always">
						<ClipSurfaceScene {...values} />
					</Canvas>
				</div>
			</Grid>
		</PageTunnelIn>
	);
}
