"use client";

import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { EffectComposer, Pixelation } from "@react-three/postprocessing";
import { memo } from "react";
import { Stagger } from "@/components/three/postprocessing/stagger";
import Rodin from "@/components/three/model/rodin";

const START = {
	position: [-3.1, 0, 3.711369133013187] as [number, number, number],
	rotation: [
		0.033795526933088786, -0.4861118293834242, 0.01579368944690987,
	] as [number, number, number],
};

export const STAGGED_SCENE_DEFAULTS = {
	pixelSize: 24,
	maskStagger: 0.1,
	granularity: 12,
} as const;

export type StaggedSceneProps = {
	pixelSize?: number;
	maskStagger?: number;
	granularity?: number;
};

const StaggedSceneShell = memo(function StaggedSceneShell() {
	return (
		<>
			<Rodin position={[0, -1, 0]} />
			<ambientLight intensity={0.1} />
			<directionalLight position={[1, 1, 1]} intensity={2} />
			<PerspectiveCamera
				fov={28.5}
				position={START.position}
				rotation={START.rotation}
				makeDefault
			/>
			<OrbitControls makeDefault />
		</>
	);
});

export function StaggedScene({
	pixelSize = STAGGED_SCENE_DEFAULTS.pixelSize,
	maskStagger = STAGGED_SCENE_DEFAULTS.maskStagger,
	granularity = STAGGED_SCENE_DEFAULTS.granularity,
}: StaggedSceneProps) {
	return (
		<>
			<StaggedSceneShell />
			<EffectComposer>
				<Stagger pixelSize={pixelSize} maskStagger={maskStagger} />
				<Pixelation granularity={granularity} />
			</EffectComposer>
		</>
	);
}
