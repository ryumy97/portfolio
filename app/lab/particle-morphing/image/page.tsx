"use client";

import { PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { LabControlsGroup } from "@/app/lab/lab-controls-group";
import { LabPageLayout } from "@/app/lab/lab-page-layout";
import { CanvasLoader } from "@/components/canvas-loader";
import type { LabNumericControlDef } from "@/lib/lab/controls";
import { useImageParticleSamples } from "./hooks/use-image-particle-samples";
import { IMAGE_PARTICLE_IMAGES } from "./images";
import {
	IMAGE_PARTICLE_POINTER_DEFAULTS,
	type ImageParticlePointerParams,
} from "./model/image-particle-pointer";
import {
	IMAGE_PARTICLE_WAVE_DEFAULTS,
	type ImageParticleWaveParams,
} from "./model/image-particle-wave";
import { ImageParticlesView } from "./view/image-particles";

const IMAGE_INTERVAL_MS = 3000;

const APPEARANCE_CONTROLS = [
	{ key: "step", label: "Spacing", min: 2, max: 24, step: 1 },
	{ key: "size", label: "Dot size", min: 0.01, max: 0.5, step: 0.001 },
] as const satisfies readonly LabNumericControlDef[];

const POINTER_CONTROLS = [
	{ key: "radius", label: "Radius", min: 0.1, max: 1.5, step: 0.05 },
	{ key: "strength", label: "Strength", min: 0, max: 30, step: 0.5 },
] as const satisfies readonly LabNumericControlDef<"radius" | "strength">[];

const MOVEMENT_CONTROLS = [
	{ key: "stiffness", label: "Stiffness", min: 0.5, max: 20, step: 0.5 },
	{ key: "damping", label: "Damping", min: 0.01, max: 0.5, step: 0.01 },
	{ key: "maxSpeed", label: "Max speed", min: 1, max: 40, step: 1 },
] as const satisfies readonly LabNumericControlDef<
	"stiffness" | "damping" | "maxSpeed"
>[];

const WAVE_CONTROLS = [
	{ key: "amplitude", label: "Amplitude", min: 0, max: 0.05, step: 0.001 },
	{ key: "timeScale", label: "Speed", min: 0, max: 3, step: 0.05 },
	{ key: "frequency", label: "Frequency", min: 1, max: 40, step: 1 },
	{ key: "frequencyJitter", label: "Jitter", min: 0, max: 1, step: 0.05 },
] as const satisfies readonly LabNumericControlDef<
	"amplitude" | "timeScale" | "frequency" | "frequencyJitter"
>[];

type AppearanceKey = (typeof APPEARANCE_CONTROLS)[number]["key"];
type WaveControlKey = (typeof WAVE_CONTROLS)[number]["key"];

function toWaveParams(
	values: Record<WaveControlKey, number>,
): ImageParticleWaveParams {
	return {
		...IMAGE_PARTICLE_WAVE_DEFAULTS,
		amplitudeX: values.amplitude,
		amplitudeY: values.amplitude,
		frequencyX: values.frequency,
		frequencyY: values.frequency,
		timeScale: values.timeScale,
		frequencyJitter: values.frequencyJitter,
	};
}

export default function ParticleMorphingPage() {
	const [eventSource, setEventSource] = useState<HTMLDivElement | null>(null);
	const [imageIndex, setImageIndex] = useState(0);
	const [appearance, setAppearance] = useState<Record<AppearanceKey, number>>({
		step: 6,
		size: 0.12,
	});
	const [pointer, setPointer] = useState<ImageParticlePointerParams>(
		IMAGE_PARTICLE_POINTER_DEFAULTS,
	);
	const [waveControls, setWaveControls] = useState<
		Record<WaveControlKey, number>
	>({
		amplitude: IMAGE_PARTICLE_WAVE_DEFAULTS.amplitudeX,
		timeScale: IMAGE_PARTICLE_WAVE_DEFAULTS.timeScale,
		frequency: IMAGE_PARTICLE_WAVE_DEFAULTS.frequencyX,
		frequencyJitter: IMAGE_PARTICLE_WAVE_DEFAULTS.frequencyJitter,
	});

	const { samples, loading } = useImageParticleSamples(IMAGE_PARTICLE_IMAGES, {
		step: appearance.step,
	});

	const currentSample = samples?.[imageIndex];

	useEffect(() => {
		if (!samples) return;

		setImageIndex(0);

		const interval = setInterval(() => {
			setImageIndex((current) => (current + 1) % IMAGE_PARTICLE_IMAGES.length);
		}, IMAGE_INTERVAL_MS);

		return () => clearInterval(interval);
	}, [samples]);

	return (
		<LabPageLayout
			title="Image Morph"
			description="Image pixels sampled into particles, morphing in a loop. Move the pointer to disturb the field."
			sidebar={
				<div className="flex flex-col gap-6">
					<LabControlsGroup
						label="Appearance"
						controls={APPEARANCE_CONTROLS}
						values={appearance}
						onValueChange={(key, value) =>
							setAppearance((current) => ({ ...current, [key]: value }))
						}
					/>
					<LabControlsGroup
						label="Pointer"
						controls={POINTER_CONTROLS}
						values={pointer}
						onValueChange={(key, value) =>
							setPointer((current) => ({ ...current, [key]: value }))
						}
					/>
					<LabControlsGroup
						label="Movement"
						controls={MOVEMENT_CONTROLS}
						values={pointer}
						onValueChange={(key, value) =>
							setPointer((current) => ({ ...current, [key]: value }))
						}
					/>
					<LabControlsGroup
						label="Wave"
						controls={WAVE_CONTROLS}
						values={waveControls}
						onValueChange={(key, value) =>
							setWaveControls((current) => ({ ...current, [key]: value }))
						}
					/>
				</div>
			}
		>
			<div ref={setEventSource} className="absolute inset-0 h-full w-full">
				<CanvasLoader active={loading} />
				<Canvas
					className="absolute inset-0 h-full w-full"
					eventSource={eventSource ?? undefined}
					frameloop="always"
				>
					<PerspectiveCamera fov={32} position={[0, 0, 4.2]} makeDefault />
					{samples && currentSample && currentSample.count > 0 ? (
						<ImageParticlesView
							samples={samples}
							index={imageIndex}
							size={appearance.size}
							pointer={pointer}
							wave={toWaveParams(waveControls)}
						/>
					) : null}
				</Canvas>
			</div>
		</LabPageLayout>
	);
}
