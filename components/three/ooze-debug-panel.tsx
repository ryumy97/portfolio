"use client";

import { Slider } from "@/components/ui/slider";
import {
	createOozeDebugState,
	type OozeDebugState,
} from "@/lib/three/ooze-debug";

const CONTROLS = [
	{ key: "oozeY", label: "Surface Y", min: -2, max: 2.5, step: 0.01 },
	{ key: "clipY", label: "Clip Y", min: -2, max: 2.5, step: 0.01 },
	{ key: "wave1", label: "Wave 1", min: 0, max: 0.12, step: 0.001 },
	{ key: "wave2", label: "Wave 2", min: 0, max: 0.12, step: 0.001 },
	{ key: "wave3", label: "Wave 3", min: 0, max: 0.12, step: 0.001 },
	{ key: "speed", label: "Speed", min: 0, max: 3, step: 0.01 },
	{ key: "planeSize", label: "Plane size", min: 4, max: 24, step: 0.5 },
	{ key: "segments", label: "Segments", min: 8, max: 192, step: 1 },
	{ key: "opacity", label: "Opacity", min: 0.1, max: 1, step: 0.01 },
	{
		key: "transmission",
		label: "Transmission",
		min: 0,
		max: 1,
		step: 0.01,
	},
] as const satisfies ReadonlyArray<{
	key: keyof OozeDebugState;
	label: string;
	min: number;
	max: number;
	step: number;
}>;

type OozeDebugPanelProps = {
	values: OozeDebugState;
	onChange: (values: OozeDebugState) => void;
};

export function OozeDebugPanel({ values, onChange }: OozeDebugPanelProps) {
	const setValue = <K extends keyof OozeDebugState>(
		key: K,
		value: OozeDebugState[K],
	) => {
		onChange({ ...values, [key]: value });
	};

	return (
		<div className="flex flex-col gap-4 text-xs">
			<div className="flex items-center justify-between gap-2">
				<span className="font-medium text-foreground">Ooze surface</span>
				<button
					type="button"
					className="text-muted-foreground underline"
					onClick={() => onChange(createOozeDebugState())}
				>
					Reset
				</button>
			</div>

			{CONTROLS.map(({ key, label, min, max, step }) => (
				<div key={key} className="flex flex-col gap-1">
					<div className="flex items-center justify-between gap-2 text-muted-foreground">
						<span>{label}</span>
						<input
							type="number"
							min={min}
							max={max}
							step={step}
							value={values[key] as number}
							onChange={(event) => {
								const next = Number(event.target.value);
								if (Number.isNaN(next)) return;
								setValue(key, Math.min(max, Math.max(min, next)) as never);
							}}
							className="w-16 bg-transparent text-right tabular-nums"
						/>
					</div>
					<Slider
						min={min}
						max={max}
						step={step}
						value={[values[key] as number]}
						onValueChange={([next]) => setValue(key, next as never)}
					/>
				</div>
			))}

			<label className="flex items-center gap-2 text-muted-foreground">
				<input
					type="color"
					value={values.color}
					onChange={(event) => setValue("color", event.target.value)}
				/>
				Color
			</label>

			<label className="flex items-center gap-2">
				<input
					type="checkbox"
					checked={values.wireframe}
					onChange={(event) => setValue("wireframe", event.target.checked)}
				/>
				Wireframe
			</label>
			<label className="flex items-center gap-2">
				<input
					type="checkbox"
					checked={values.showPool}
					onChange={(event) => setValue("showPool", event.target.checked)}
				/>
				Show pool
			</label>
			<label className="flex items-center gap-2">
				<input
					type="checkbox"
					checked={values.showHelpers}
					onChange={(event) => setValue("showHelpers", event.target.checked)}
				/>
				Show helpers
			</label>
		</div>
	);
}
