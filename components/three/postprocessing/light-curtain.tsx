"use client";

import { forwardRef, useLayoutEffect, useMemo } from "react";
import {
	LIGHT_CURTAIN_EFFECT_DEFAULTS,
	LightCurtainEffect,
} from "./light-curtain-effect";

export type LightCurtainProps = {
	distortion?: number;
	lightX?: number;
	lightY?: number;
	lightZ?: number;
	fill?: number;
};

export const LightCurtain = forwardRef<LightCurtainEffect, LightCurtainProps>(
	function LightCurtain(
		{
			distortion = LIGHT_CURTAIN_EFFECT_DEFAULTS.distortion,
			lightX = LIGHT_CURTAIN_EFFECT_DEFAULTS.lightX,
			lightY = LIGHT_CURTAIN_EFFECT_DEFAULTS.lightY,
			lightZ = LIGHT_CURTAIN_EFFECT_DEFAULTS.lightZ,
			fill = LIGHT_CURTAIN_EFFECT_DEFAULTS.fill,
		},
		ref,
	) {
		const effect = useMemo(() => new LightCurtainEffect(), []);

		useLayoutEffect(() => {
			effect.setDistortion(distortion);
			effect.setLightPosition([lightX, lightY, lightZ]);
			effect.setFill(fill);
		}, [effect, distortion, lightX, lightY, lightZ, fill]);

		return <primitive ref={ref} object={effect} dispose={null} />;
	},
);
