"use client";

import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { memo } from "react";
import type { MotionValue } from "motion/react";
import type { ParticleMotionParams } from "../model/particles";
import { ShapeShiftParticlesView } from "./shape-shift-particles";

const CAMERA_START = {
	position: [0, 0, 4.2] as [number, number, number],
	rotation: [0, 0, 0] as [number, number, number],
};

const ShapeShiftSceneShell = memo(function ShapeShiftSceneShell() {
	return (
		<>
			<ambientLight intensity={0.35} />
			<directionalLight position={[2, 3, 4]} intensity={1.2} />
			<PerspectiveCamera
				fov={32}
				position={CAMERA_START.position}
				rotation={CAMERA_START.rotation}
				makeDefault
			/>
			<OrbitControls makeDefault />
		</>
	);
});

export type ShapeShiftSceneViewProps = {
	shapePositions: Float32Array[] | null;
	size: number;
	color: string;
	shape: MotionValue<number>;
	motion: ParticleMotionParams;
};

export function ShapeShiftSceneView({
	shapePositions,
	size,
	color,
	shape,
	motion,
}: ShapeShiftSceneViewProps) {
	return (
		<>
			<ShapeShiftSceneShell />
			{shapePositions ? (
				<ShapeShiftParticlesView
					shapePositions={shapePositions}
					shape={shape}
					color={color}
					size={size}
					motion={motion}
				/>
			) : null}
		</>
	);
}
