export type LabNumericControlDef<T extends string = string> = {
	key: T;
	label: string;
	min: number;
	max: number;
	step: number;
};

export function clampControlValue(
	value: number,
	min: number,
	max: number,
	step: number,
) {
	const clamped = Math.min(max, Math.max(min, value));
	const decimals = step.toString().split(".")[1]?.length ?? 0;
	return Number(clamped.toFixed(decimals));
}
