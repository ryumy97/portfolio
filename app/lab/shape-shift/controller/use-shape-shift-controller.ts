"use client";

import type { LabNumericControlDef } from "@/lib/lab/controls";
import {
	animate,
	cubicBezier,
	useMotionValue,
	type MotionValue,
} from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { SHAPE_SHIFT_DEFAULTS } from "../model/shapes";
import {
	PARTICLE_MOTION_DEFAULTS,
	type ParticleMotionParams,
} from "../model/particles";

export const SHAPE_SHIFT_CONTROLS = [
	{ key: "count", label: "Particles", min: 1000, max: 8000, step: 100 },
	{ key: "size", label: "Size", min: 0.01, max: 0.08, step: 0.001 },
] as const satisfies readonly LabNumericControlDef[];

export const SHAPE_SHIFT_MOTION_CONTROLS = [
	{
		key: "fieldInfluence",
		label: "Field influence",
		min: 0,
		max: 2,
		step: 0.05,
	},
	{
		key: "fieldStrength",
		label: "Field strength",
		min: 0,
		max: 3,
		step: 0.1,
	},
	{
		key: "fieldFrequency",
		label: "Field frequency",
		min: 0.2,
		max: 2,
		step: 0.05,
	},
	{
		key: "fieldTimeScale",
		label: "Field time scale",
		min: 0.1,
		max: 1.5,
		step: 0.05,
	},
	{
		key: "acceleration",
		label: "Acceleration",
		min: 1,
		max: 30,
		step: 0.5,
	},
	{ key: "damping", label: "Damping", min: 0.3, max: 0.99, step: 0.01 },
	{ key: "maxSpeed", label: "Max speed", min: 0.05, max: 1, step: 0.01 },
] as const satisfies readonly LabNumericControlDef<
	keyof ParticleMotionParams
>[];

type ControlKey = (typeof SHAPE_SHIFT_CONTROLS)[number]["key"];

export type ShapeShiftControlValues = Record<ControlKey, number>;

export type ShapeShiftController = {
	eventSource: HTMLDivElement | null;
	setEventSource: (node: HTMLDivElement | null) => void;
	shape: MotionValue<number>;
	values: ShapeShiftControlValues;
	motion: ParticleMotionParams;
	color: string;
	setControlValue: (key: ControlKey, value: number) => void;
	setMotionValue: (key: keyof ParticleMotionParams, value: number) => void;
	setColor: (color: string) => void;
};

const SHAPE_MORPH_DURATION_S = 1;
const SHAPE_HOLD_MS = 2000;
const SHAPE_EASE = cubicBezier(0.3, 0, 0.3, 1);

export function useShapeShiftController(): ShapeShiftController {
	const [eventSource, setEventSource] = useState<HTMLDivElement | null>(null);
	const [values, setValues] = useState<ShapeShiftControlValues>({
		count: SHAPE_SHIFT_DEFAULTS.count,
		size: SHAPE_SHIFT_DEFAULTS.size,
	});
	const [motion, setMotion] = useState<ParticleMotionParams>(
		PARTICLE_MOTION_DEFAULTS,
	);
	const [color, setColor] = useState<string>(SHAPE_SHIFT_DEFAULTS.color);
	const shape = useMotionValue<number>(SHAPE_SHIFT_DEFAULTS.shape);

	useEffect(() => {
		let shapeIndex = 0;

		const interval = setInterval(() => {
			shapeIndex += 1;
			animate(shape, shapeIndex, {
				duration: SHAPE_MORPH_DURATION_S,
				ease: SHAPE_EASE,
			});
		}, SHAPE_HOLD_MS);

		return () => clearInterval(interval);
	}, [shape]);

	const setControlValue = useCallback((key: ControlKey, value: number) => {
		setValues((current) => ({ ...current, [key]: value }));
	}, []);

	const setMotionValue = useCallback(
		(key: keyof ParticleMotionParams, value: number) => {
			setMotion((current) => ({ ...current, [key]: value }));
		},
		[],
	);

	return {
		eventSource,
		setEventSource,
		shape,
		values,
		motion,
		color,
		setControlValue,
		setMotionValue,
		setColor,
	};
}
