import { lerpPositionSets } from "@/lib/three/sample-geometry-surface";
import { SHAPE_COUNT } from "./shapes";

// --- Params ---

export type ParticleMotionParams = {
	fieldTimeScale: number;
	fieldFrequency: number;
	fieldStrength: number;
	fieldInfluence: number;
	acceleration: number;
	damping: number;
	maxSpeed: number;
};

export const PARTICLE_MOTION_DEFAULTS: ParticleMotionParams = {
	fieldTimeScale: 0.4,
	fieldFrequency: 0.85,
	fieldStrength: 1,
	fieldInfluence: 0.65,
	acceleration: 10,
	damping: 0.5,
	maxSpeed: 0.35,
};

// --- Morph ---

export type ShapeMorphState = {
	fromIndex: number;
	toIndex: number;
	blend: number;
};

function getShapeMorphState(shapeIndex: number): ShapeMorphState {
	const fromIndex = Math.floor(shapeIndex) % SHAPE_COUNT;
	const toIndex = (fromIndex + 1) % SHAPE_COUNT;
	const blend = shapeIndex - Math.floor(shapeIndex);

	return { fromIndex, toIndex, blend };
}

/** Write the morphed shape target into `target` for the given continuous shape index. */
export function computeShapeTargetPositions(
	target: Float32Array,
	shapePositions: Float32Array[],
	shapeIndex: number,
) {
	const { fromIndex, toIndex, blend } = getShapeMorphState(shapeIndex);

	lerpPositionSets(
		target,
		shapePositions[fromIndex],
		shapePositions[toIndex],
		blend,
	);
}

// --- Vector field ---

const FIELD_EPSILON = 0.05;
const _field = { x: 0, y: 0, z: 0 };

function hash3(ix: number, iy: number, iz: number): number {
	const n = Math.sin(ix * 127.1 + iy * 311.7 + iz * 74.7) * 43758.5453;
	return n - Math.floor(n);
}

function smoothstep(t: number): number {
	return t * t * (3 - 2 * t);
}

function valueNoise3D(x: number, y: number, z: number): number {
	const x0 = Math.floor(x);
	const y0 = Math.floor(y);
	const z0 = Math.floor(z);
	const fx = smoothstep(x - x0);
	const fy = smoothstep(y - y0);
	const fz = smoothstep(z - z0);

	const n000 = hash3(x0, y0, z0);
	const n100 = hash3(x0 + 1, y0, z0);
	const n010 = hash3(x0, y0 + 1, z0);
	const n110 = hash3(x0 + 1, y0 + 1, z0);
	const n001 = hash3(x0, y0, z0 + 1);
	const n101 = hash3(x0 + 1, y0, z0 + 1);
	const n011 = hash3(x0, y0 + 1, z0 + 1);
	const n111 = hash3(x0 + 1, y0 + 1, z0 + 1);

	const nx00 = n000 + (n100 - n000) * fx;
	const nx10 = n010 + (n110 - n010) * fx;
	const nx01 = n001 + (n101 - n001) * fx;
	const nx11 = n011 + (n111 - n011) * fx;
	const nxy0 = nx00 + (nx10 - nx00) * fy;
	const nxy1 = nx01 + (nx11 - nx01) * fy;

	return (nxy0 + (nxy1 - nxy0) * fz) * 2 - 1;
}

function fbm3D(x: number, y: number, z: number): number {
	let value = 0;
	let amplitude = 0.5;
	let frequency = 1;

	for (let octave = 0; octave < 3; octave++) {
		value +=
			amplitude * valueNoise3D(x * frequency, y * frequency, z * frequency);
		amplitude *= 0.5;
		frequency *= 2;
	}

	return value;
}

function potentialX(
	x: number,
	y: number,
	z: number,
	time: number,
	frequency: number,
): number {
	return fbm3D(x * frequency, y * frequency + time, z * frequency);
}

function potentialY(
	x: number,
	y: number,
	z: number,
	time: number,
	frequency: number,
): number {
	return fbm3D(y * frequency + time, z * frequency, x * frequency);
}

function potentialZ(
	x: number,
	y: number,
	z: number,
	time: number,
	frequency: number,
): number {
	return fbm3D(z * frequency, x * frequency + time, y * frequency);
}

function sampleVectorField(
	x: number,
	y: number,
	z: number,
	time: number,
	{
		fieldTimeScale,
		fieldFrequency,
		fieldStrength,
	}: Pick<
		ParticleMotionParams,
		"fieldTimeScale" | "fieldFrequency" | "fieldStrength"
	>,
): { x: number; y: number; z: number } {
	const t = time * fieldTimeScale;
	const eps = FIELD_EPSILON;

	const dPzDy =
		(potentialZ(x, y + eps, z, t, fieldFrequency) -
			potentialZ(x, y - eps, z, t, fieldFrequency)) /
		(2 * eps);
	const dPyDz =
		(potentialY(x, y, z + eps, t, fieldFrequency) -
			potentialY(x, y, z - eps, t, fieldFrequency)) /
		(2 * eps);
	const dPxDz =
		(potentialX(x, y, z + eps, t, fieldFrequency) -
			potentialX(x, y, z - eps, t, fieldFrequency)) /
		(2 * eps);
	const dPzDx =
		(potentialZ(x + eps, y, z, t, fieldFrequency) -
			potentialZ(x - eps, y, z, t, fieldFrequency)) /
		(2 * eps);
	const dPyDx =
		(potentialY(x + eps, y, z, t, fieldFrequency) -
			potentialY(x - eps, y, z, t, fieldFrequency)) /
		(2 * eps);
	const dPxDy =
		(potentialX(x, y + eps, z, t, fieldFrequency) -
			potentialX(x, y - eps, z, t, fieldFrequency)) /
		(2 * eps);

	_field.x = (dPzDy - dPyDz) * fieldStrength;
	_field.y = (dPxDz - dPzDx) * fieldStrength;
	_field.z = (dPyDx - dPxDy) * fieldStrength;

	return _field;
}

// --- Integration ---

/** Move display positions toward targets with velocity + spatial vector field. */
export function integrateParticlePositions(
	display: Float32Array,
	velocity: Float32Array,
	target: Float32Array,
	delta: number,
	time: number,
	params: ParticleMotionParams,
) {
	const accel = params.acceleration * delta;
	const fieldScale = params.fieldInfluence * delta;
	const maxSpeedSq = params.maxSpeed * params.maxSpeed;

	for (let i = 0; i < display.length; i += 3) {
		const x = display[i];
		const y = display[i + 1];
		const z = display[i + 2];

		const field = sampleVectorField(x, y, z, time, params);
		velocity[i] += field.x * fieldScale;
		velocity[i + 1] += field.y * fieldScale;
		velocity[i + 2] += field.z * fieldScale;

		velocity[i] += (target[i] - x) * accel;
		velocity[i + 1] += (target[i + 1] - y) * accel;
		velocity[i + 2] += (target[i + 2] - z) * accel;

		velocity[i] *= params.damping;
		velocity[i + 1] *= params.damping;
		velocity[i + 2] *= params.damping;

		const speedSq =
			velocity[i] * velocity[i] +
			velocity[i + 1] * velocity[i + 1] +
			velocity[i + 2] * velocity[i + 2];

		if (speedSq > maxSpeedSq) {
			const scale = params.maxSpeed / Math.sqrt(speedSq);
			velocity[i] *= scale;
			velocity[i + 1] *= scale;
			velocity[i + 2] *= scale;
		}

		display[i] += velocity[i];
		display[i + 1] += velocity[i + 1];
		display[i + 2] += velocity[i + 2];
	}
}
