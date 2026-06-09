"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { MotionValue } from "motion/react";
import {
	computeShapeTargetPositions,
	integrateParticlePositions,
	type ParticleMotionParams,
} from "../model/particles";

export type ShapeShiftParticlesViewProps = {
	shapePositions: Float32Array[];
	shape: MotionValue<number>;
	color: string;
	size: number;
	motion: ParticleMotionParams;
};

export function ShapeShiftParticlesView({
	shapePositions,
	shape,
	color,
	size,
	motion,
}: ShapeShiftParticlesViewProps) {
	const pointsRef = useRef<THREE.Points>(null);
	const targetPositionsRef = useRef<Float32Array | null>(null);
	const vectorPositionsRef = useRef<Float32Array | null>(null);
	const motionRef = useRef(motion);
	motionRef.current = motion;

	const geometry = useMemo(() => {
		const buffer = new THREE.BufferGeometry();
		buffer.setAttribute(
			"position",
			new THREE.BufferAttribute(shapePositions[0].slice(), 3),
		);

		const length = shapePositions[0].length;
		targetPositionsRef.current = new Float32Array(length);
		vectorPositionsRef.current = new Float32Array(length);

		computeShapeTargetPositions(targetPositionsRef.current, shapePositions, 0);

		return buffer;
	}, [shapePositions]);

	useEffect(() => {
		return () => geometry.dispose();
	}, [geometry]);

	useFrame((state, delta) => {
		const points = pointsRef.current;
		const targetPositions = targetPositionsRef.current;
		const vectorPositions = vectorPositionsRef.current;
		if (!points || !targetPositions || !vectorPositions) return;

		computeShapeTargetPositions(targetPositions, shapePositions, shape.get());

		const positionAttr = points.geometry.attributes.position;
		const displayPositions = positionAttr.array as Float32Array;

		integrateParticlePositions(
			displayPositions,
			vectorPositions,
			targetPositions,
			delta,
			state.clock.elapsedTime,
			motionRef.current,
		);

		positionAttr.needsUpdate = true;
	});

	return (
		<points ref={pointsRef} geometry={geometry} frustumCulled={false}>
			<pointsMaterial
				color={color}
				size={size}
				sizeAttenuation
				depthWrite={false}
				blending={THREE.NormalBlending}
			/>
		</points>
	);
}
