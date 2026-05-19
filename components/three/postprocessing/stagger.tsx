"use client";

import { forwardRef, useLayoutEffect, useMemo } from "react";
import { StaggerEffect, type StaggerEffectOptions } from "./stagger-effect";

export type StaggerProps = StaggerEffectOptions;

export const Stagger = forwardRef<StaggerEffect, StaggerProps>(function Stagger(
	{ pixelSize = 64, maskStagger = 0.5 },
	ref,
) {
	const effect = useMemo(() => new StaggerEffect(), []);

	useLayoutEffect(() => {
		effect.setPixelSize(pixelSize);
		effect.setMaskStagger(maskStagger);
	}, [effect, pixelSize, maskStagger]);

	return <primitive ref={ref} object={effect} dispose={null} />;
});
