"use client";

import type { StaticImageData } from "next/image";
import { useEffect, useState } from "react";
import {
	createParticleIndexOrder,
	createProjectedParticleOrder,
	IMAGE_PARTICLE_SHUFFLE_SEED,
	type ImageParticleSample,
	type SampleImageParticlesOptions,
	sampleImageParticles,
	shuffleImageParticleSample,
} from "@/lib/three/sample-image-particles";
import { getOptimizedImageSrc, loadImage } from "@/lib/webgl";

export function useImageParticleSamples(
	images: readonly StaticImageData[],
	options: SampleImageParticlesOptions,
) {
	const [samples, setSamples] = useState<ImageParticleSample[] | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	const { step = 4, alphaThreshold = 16 } = options;

	useEffect(() => {
		let cancelled = false;

		setLoading(true);
		setError(null);

		Promise.all(
			images.map(async (image) => {
				const src = getOptimizedImageSrc(image, image.width, image.height, 75);
				const loadedImage = await loadImage(src);
				return sampleImageParticles(loadedImage, {
					step,
					alphaThreshold,
					shuffle: false,
				});
			}),
		)
			.then((rawSamples) => {
				if (cancelled) return;

				const maxCount = Math.max(
					0,
					...rawSamples.map((sample) => sample.count),
				);
				const globalOrder = createParticleIndexOrder(
					maxCount,
					IMAGE_PARTICLE_SHUFFLE_SEED,
				);

				const nextSamples = rawSamples.map((sample) => {
					if (sample.count <= 1) return sample;

					const order = createProjectedParticleOrder(globalOrder, sample.count);
					return shuffleImageParticleSample(sample, order);
				});

				setSamples(nextSamples);
			})
			.catch((cause) => {
				if (cancelled) return;
				setError(cause instanceof Error ? cause : new Error(String(cause)));
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [images, step, alphaThreshold]);

	return { samples, loading, error };
}
