"use client";

import { PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { LabNumericControls } from "@/app/lab/lab-numeric-controls";
import { LabPageLayout } from "@/app/lab/lab-page-layout";
import { CanvasLoader } from "@/components/canvas-loader";
import type { LabNumericControlDef } from "@/lib/lab/controls";
import { useImageParticleSamples } from "./hooks/use-image-particle-samples";
import { IMAGE_PARTICLE_IMAGES } from "./images";
import { ImageParticlesView } from "./view/image-particles";

const IMAGE_INTERVAL_MS = 3000;

const CONTROLS = [
	{ key: "step", label: "Spacing", min: 2, max: 24, step: 1 },
	{ key: "size", label: "Dot size", min: 0.01, max: 0.2, step: 0.001 },
] as const satisfies readonly LabNumericControlDef[];

type ControlKey = (typeof CONTROLS)[number]["key"];

export default function ParticleMorphingPage() {
	const [eventSource, setEventSource] = useState<HTMLDivElement | null>(null);
	const [imageIndex, setImageIndex] = useState(0);
	const [values, setValues] = useState<Record<ControlKey, number>>({
		step: 8,
		size: 0.1,
	});

	const { samples, loading } = useImageParticleSamples(IMAGE_PARTICLE_IMAGES, {
		step: values.step,
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
			title="Particle Morphing"
			description="Image pixels sampled into a Three.js particle field."
			sidebar={
				<LabNumericControls
					controls={CONTROLS}
					values={values}
					onValueChange={(key, value) =>
						setValues((current) => ({ ...current, [key]: value }))
					}
				/>
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
							size={values.size}
						/>
					) : null}
				</Canvas>
			</div>
		</LabPageLayout>
	);
}
