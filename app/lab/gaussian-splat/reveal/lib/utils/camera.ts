export function computeDepthQuantiles(
	positions: Float32Array,
	qNear = 0.001,
	qFocus = 0.1,
	qFar = 0.999,
): { min: number; focus: number; max: number } {
	const depths: number[] = [];

	for (let i = 2; i < positions.length; i += 3) {
		const z = positions[i];
		if (z !== undefined && Number.isFinite(z) && z > 0) {
			depths.push(z);
		}
	}

	if (depths.length === 0) {
		return { min: 1, focus: 2, max: 10 };
	}

	depths.sort((a, b) => a - b);

	const minIndex = Math.floor(depths.length * qNear);
	const focusIndex = Math.floor(depths.length * qFocus);
	const maxIndex = Math.floor(depths.length * qFar);

	return {
		min: depths[minIndex] ?? depths[0] ?? 1,
		focus: depths[focusIndex] ?? depths[0] ?? 2,
		max: depths[maxIndex] ?? depths[depths.length - 1] ?? 10,
	};
}
