"use client";

import { LabControlGroupLabel } from "@/components/ui/typography";
import type { LabNumericControlDef } from "@/lib/lab/controls";
import { LabNumericControls } from "./lab-numeric-controls";

type LabControlsGroupProps<T extends string> = {
	label: string;
	controls: readonly LabNumericControlDef<T>[];
	values: Record<T, number>;
	onValueChange: (key: T, value: number) => void;
};

export function LabControlsGroup<T extends string>({
	label,
	controls,
	values,
	onValueChange,
}: LabControlsGroupProps<T>) {
	return (
		<section className="flex flex-col gap-3">
			<LabControlGroupLabel>{label}</LabControlGroupLabel>
			<div className="flex flex-col gap-4">
				<LabNumericControls
					controls={controls}
					values={values}
					onValueChange={onValueChange}
				/>
			</div>
		</section>
	);
}
