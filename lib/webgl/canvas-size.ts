import { MAX_DEVICE_PIXEL_RATIO } from "./constants";

export type PixelSize = { w: number; h: number };

export function getCanvasPixelSize(canvas: HTMLCanvasElement): PixelSize {
	const dpr = Math.min(window.devicePixelRatio ?? 1, MAX_DEVICE_PIXEL_RATIO);
	return {
		w: Math.floor(canvas.clientWidth * dpr),
		h: Math.floor(canvas.clientHeight * dpr),
	};
}

export function resizeCanvasToPixelSize(
	canvas: HTMLCanvasElement,
	size: PixelSize,
): boolean {
	if (size.w <= 0 || size.h <= 0) return false;

	const changed = canvas.width !== size.w || canvas.height !== size.h;
	if (changed) {
		canvas.width = size.w;
		canvas.height = size.h;
	}
	return changed;
}

export function observeCanvasPixelSize(
	canvas: HTMLCanvasElement,
	onResize: (size: PixelSize, canvasSizeChanged: boolean) => void,
): () => void {
	const resize = () => {
		const size = getCanvasPixelSize(canvas);
		if (size.w <= 0 || size.h <= 0) return;
		const canvasSizeChanged = resizeCanvasToPixelSize(canvas, size);
		onResize(size, canvasSizeChanged);
	};

	const observer = new ResizeObserver(resize);
	observer.observe(canvas);
	resize();

	return () => observer.disconnect();
}
