"use client";

import { LabNumericControl } from "@/app/lab/lab-numeric-control";
import type { LabNumericControlDef } from "@/lib/lab/controls";

type LabNumericControlsProps<T extends string> = {
	controls: readonly LabNumericControlDef<T>[];
	values: Record<T, number>;
	onValueChange: (key: T, value: number) => void;
};

export function LabNumericControls<T extends string>({
	controls,
	values,
	onValueChange,
}: LabNumericControlsProps<T>) {
	return (
		<>
			{controls.map(({ key, label, min, max, step }) => (
				<LabNumericControl
					key={key}
					label={label}
					value={values[key]}
					min={min}
					max={max}
					step={step}
					onChange={(value) => onValueChange(key, value)}
				/>
			))}
		</>
	);
}
