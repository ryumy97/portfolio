"use client";

import { useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { animate, cubicBezier, useMotionValue } from "motion/react";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import dotAlphaMap from "@/app/lab/particle-morphing/assets/dot.png";
import {
	dampImageParticleVelocities,
	IMAGE_PARTICLE_POINTER_DEFAULTS,
	type ImageParticlePointer,
	integrateImageParticlePositions,
} from "@/app/lab/particle-morphing/model/image-particle-pointer";
import {
	createPaddedImageParticleTargets,
	getMaxImageParticleCount,
	IMAGE_PARTICLE_TRANSITION_DURATION_S,
} from "@/app/lab/particle-morphing/model/image-particle-targets";
import {
	computeImageParticleWaveOffsets,
	createImageParticleWaveFactors,
	IMAGE_PARTICLE_WAVE_DEFAULTS,
} from "@/app/lab/particle-morphing/model/image-particle-wave";
import { createImageParticlesMaterial } from "@/app/lab/particle-morphing/view/image-particles-material";
import { lerpPositionSets } from "@/lib/three/sample-geometry-surface";
import type { ImageParticleSample } from "@/lib/three/sample-image-particles";

export type ImageParticlesViewProps = {
	samples: ImageParticleSample[];
	index: number;
	size: number;
};

const _plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const _intersection = new THREE.Vector3();
const POINTER_LERP_SPEED = 16;
const SAMPLE_EASE = cubicBezier(0.3, 0, 0, 1);

type ImageParticleSnapshot = {
	positions: Float32Array;
	colors: Float32Array;
	alphas: Float32Array;
};

export function ImageParticlesView({
	samples,
	index,
	size,
}: ImageParticlesViewProps) {
	const pointsRef = useRef<THREE.Points>(null);
	const alphaMap = useTexture(dotAlphaMap.src);
	const pixelScale = useThree(
		(state) => state.size.height * state.viewport.dpr * 0.5,
	);
	const raycaster = useMemo(() => new THREE.Raycaster(), []);

	const maxCount = useMemo(() => getMaxImageParticleCount(samples), [samples]);

	const waveFactors = useMemo(
		() => createImageParticleWaveFactors(maxCount),
		[maxCount],
	);

	const currentTargets = useMemo(
		() => createPaddedImageParticleTargets(samples[index], maxCount),
		[samples, index, maxCount],
	);

	const currentTargetsRef = useRef(currentTargets);
	currentTargetsRef.current = currentTargets;

	const basePositionsRef = useRef<Float32Array | null>(null);
	const waveOffsetsRef = useRef<Float32Array | null>(null);
	const velocitiesRef = useRef<Float32Array | null>(null);
	const pointerRef = useRef<ImageParticlePointer>({
		x: 0,
		y: 0,
		active: false,
	});
	const pointerTargetRef = useRef({ x: 0, y: 0 });
	const indexRef = useRef(index);
	const fromSnapshotRef = useRef<ImageParticleSnapshot | null>(null);
	const morphedRef = useRef<ImageParticleSnapshot>({
		positions: new Float32Array(0),
		colors: new Float32Array(0),
		alphas: new Float32Array(0),
	});
	const transition = useMotionValue(1);

	const material = useMemo(
		() => createImageParticlesMaterial(alphaMap, 1, 1),
		[alphaMap],
	);

	useEffect(() => {
		return () => material.dispose();
	}, [material]);

	const geometry = useMemo(() => {
		const initial = createPaddedImageParticleTargets(samples[0], maxCount);
		const buffer = new THREE.BufferGeometry();
		buffer.setAttribute(
			"position",
			new THREE.BufferAttribute(initial.positions.slice(), 3),
		);
		buffer.setAttribute(
			"color",
			new THREE.BufferAttribute(initial.colors.slice(), 3),
		);
		buffer.setAttribute(
			"particleAlpha",
			new THREE.BufferAttribute(initial.alphas.slice(), 1),
		);
		return buffer;
	}, [samples, maxCount]);

	useEffect(() => {
		const positionAttr = geometry.attributes.position;
		const colorAttr = geometry.attributes.color;
		const alphaAttr = geometry.attributes.particleAlpha;
		const displayPositions = positionAttr.array as Float32Array;
		const displayColors = colorAttr.array as Float32Array;
		const displayAlphas = alphaAttr.array as Float32Array;
		const targets = currentTargetsRef.current;

		basePositionsRef.current = targets.positions.slice();
		displayPositions.set(targets.positions);
		displayColors.set(targets.colors);
		displayAlphas.set(targets.alphas);
		positionAttr.needsUpdate = true;
		colorAttr.needsUpdate = true;
		alphaAttr.needsUpdate = true;

		velocitiesRef.current = new Float32Array(targets.positions.length);
	}, [geometry]);

	useEffect(() => {
		return () => geometry.dispose();
	}, [geometry]);

	useEffect(() => {
		const morphed = morphedRef.current;
		const bufferLength = maxCount * 3;

		if (morphed.positions.length !== bufferLength) {
			morphed.positions = new Float32Array(bufferLength);
			morphed.colors = new Float32Array(bufferLength);
			morphed.alphas = new Float32Array(maxCount);
		}
	}, [maxCount]);

	useEffect(() => {
		if (indexRef.current === index) return;

		const basePositions = basePositionsRef.current;
		const colorAttr = geometry.attributes.color;
		const alphaAttr = geometry.attributes.particleAlpha;
		if (!basePositions) return;

		fromSnapshotRef.current = {
			positions: basePositions.slice(),
			colors: (colorAttr.array as Float32Array).slice(),
			alphas: (alphaAttr.array as Float32Array).slice(),
		};

		transition.set(0);
		void animate(transition, 1, {
			duration: IMAGE_PARTICLE_TRANSITION_DURATION_S,
			ease: SAMPLE_EASE,
		});

		if (velocitiesRef.current) {
			dampImageParticleVelocities(velocitiesRef.current, 0);
		}

		indexRef.current = index;
	}, [geometry, index, transition]);

	useFrame((state, delta) => {
		const points = pointsRef.current;
		const basePositions = basePositionsRef.current;
		const velocities = velocitiesRef.current;
		if (!points || !basePositions || !velocities) return;

		material.uniforms.size.value = size;
		material.uniforms.scale.value = pixelScale;

		const targets = currentTargetsRef.current;
		const blend = transition.get();
		const from = fromSnapshotRef.current;
		const morphed = morphedRef.current;
		const transitioning = from !== null && blend < 1;

		let morphedPositions: Float32Array = targets.positions;
		let morphedColors: Float32Array = targets.colors;
		let morphedAlphas: Float32Array = targets.alphas;

		if (transitioning) {
			lerpPositionSets(
				morphed.positions,
				from.positions,
				targets.positions,
				blend,
			);
			lerpPositionSets(morphed.colors, from.colors, targets.colors, blend);
			lerpPositionSets(morphed.alphas, from.alphas, targets.alphas, blend);
			morphedPositions = morphed.positions;
			morphedColors = morphed.colors;
			morphedAlphas = morphed.alphas;
		} else if (from && blend >= 1) {
			fromSnapshotRef.current = null;
		}
		const positionAttr = points.geometry.attributes.position;
		const colorAttr = points.geometry.attributes.color;
		const alphaAttr = points.geometry.attributes.particleAlpha;
		const displayPositions = positionAttr.array as Float32Array;
		const displayColors = colorAttr.array as Float32Array;
		const displayAlphas = alphaAttr.array as Float32Array;

		const bufferLength = targets.positions.length;

		if (
			!waveOffsetsRef.current ||
			waveOffsetsRef.current.length !== bufferLength
		) {
			waveOffsetsRef.current = new Float32Array(bufferLength);
		}

		const waveOffsets = waveOffsetsRef.current;
		const pointer = pointerRef.current;
		const pointerTarget = pointerTargetRef.current;

		raycaster.setFromCamera(state.pointer, state.camera);
		const hit = raycaster.ray.intersectPlane(_plane, _intersection);
		if (hit) {
			pointerTarget.x = _intersection.x;
			pointerTarget.y = _intersection.y;
		}

		const pointerLerp = 1 - Math.exp(-POINTER_LERP_SPEED * delta);
		pointer.x += (pointerTarget.x - pointer.x) * pointerLerp;
		pointer.y += (pointerTarget.y - pointer.y) * pointerLerp;
		pointer.active = state.events.connected;

		if (transitioning) {
			basePositions.set(morphedPositions);
			displayColors.set(morphedColors);
			displayAlphas.set(morphedAlphas);
		} else {
			integrateImageParticlePositions(
				basePositions,
				velocities,
				targets.positions,
				targets.alphas,
				pointer,
				delta,
				IMAGE_PARTICLE_POINTER_DEFAULTS,
			);
			displayColors.set(targets.colors);
			displayAlphas.set(targets.alphas);
		}

		computeImageParticleWaveOffsets(
			waveOffsets,
			morphedPositions,
			morphedAlphas,
			waveFactors,
			state.clock.elapsedTime,
			IMAGE_PARTICLE_WAVE_DEFAULTS,
		);

		for (let i = 0; i < bufferLength; i++) {
			displayPositions[i] = basePositions[i] + waveOffsets[i];
		}

		positionAttr.needsUpdate = true;
		colorAttr.needsUpdate = true;
		alphaAttr.needsUpdate = true;
	});

	return (
		<points
			ref={pointsRef}
			geometry={geometry}
			material={material}
			frustumCulled={false}
		/>
	);
}
