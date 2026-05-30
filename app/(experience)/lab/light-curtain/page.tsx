"use client";

import { PageTunnelIn } from "@/components/page-tunnel";
import { PointerEventHandler } from "@/components/pointer";
import { Button } from "@/components/ui/button";
import { Grid } from "@/components/ui/grid";
import { Slider } from "@/components/ui/slider";
import { Canvas } from "@react-three/fiber";
import Link from "next/link";
import { useRef, useState } from "react";
import { LIGHT_CURTAIN_SCENE_DEFAULTS, LightCurtainScene } from "./scene";

const CONTROLS = [
	{ key: "distortion", label: "Distortion", min: 0, max: 2, step: 0.001 },
	{ key: "fill", label: "Fill", min: 0, max: 1, step: 0.01 },
	{ key: "lightX", label: "Light X", min: -2, max: 2, step: 0.01 },
	{ key: "lightY", label: "Light Y", min: -2, max: 2, step: 0.01 },
	{ key: "lightZ", label: "Light Z", min: -2, max: 2, step: 0.01 },
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
	const eventSourceRef = useRef<HTMLDivElement>(null);
	const [values, setValues] = useState<Record<ControlKey, number>>({
		distortion: LIGHT_CURTAIN_SCENE_DEFAULTS.distortion,
		fill: LIGHT_CURTAIN_SCENE_DEFAULTS.fill,
		lightX: LIGHT_CURTAIN_SCENE_DEFAULTS.lightX,
		lightY: LIGHT_CURTAIN_SCENE_DEFAULTS.lightY,
		lightZ: LIGHT_CURTAIN_SCENE_DEFAULTS.lightZ,
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
							Light curtain
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
				<div
					ref={eventSourceRef}
					className="col-start-3 col-end-11 relative h-full"
				>
					<Canvas
						className="absolute inset-0 h-full w-full"
						eventSource={eventSourceRef.current ?? undefined}
						frameloop="always"
					>
						<color attach="background" args={["#ffffff"]} />
						<LightCurtainScene
							distortion={values.distortion}
							fill={values.fill}
							lightX={values.lightX}
							lightY={values.lightY}
							lightZ={values.lightZ}
						/>
					</Canvas>
				</div>
			</Grid>
		</PageTunnelIn>
	);
}
