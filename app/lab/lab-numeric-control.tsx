"use client";

import { Slider } from "@/components/ui/slider";
import { LabControlLabel } from "@/components/ui/typography";
import { clampControlValue } from "@/lib/lab/controls";

type LabNumericControlProps = {
	label: string;
	value: number;
	min: number;
	max: number;
	step: number;
	onChange: (value: number) => void;
};

export function LabNumericControl({
	label,
	value,
	min,
	max,
	step,
	onChange,
}: LabNumericControlProps) {
	return (
		<div className="flex flex-col gap-1">
			<div className="flex items-center justify-between gap-2">
				<LabControlLabel>{label}</LabControlLabel>
				<input
					type="number"
					min={min}
					max={max}
					step={step}
					value={value}
					onChange={(event) => {
						const next = Number(event.target.value);
						if (Number.isNaN(next)) return;
						onChange(clampControlValue(next, min, max, step));
					}}
					className="h-6 w-16 shrink-0 rounded border border-border bg-background px-1.5 text-right text-xs text-foreground tabular-nums outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
				/>
			</div>
			<Slider
				value={[value]}
				onValueChange={([next]) => onChange(next)}
				min={min}
				max={max}
				step={step}
			/>
		</div>
	);
}
