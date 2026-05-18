"use client";

import {
	CANVAS_STYLE,
	createFullscreenTriangleBuffer,
	createProgram,
	createScheduledDraw,
	drawFullscreenTriangle,
	FULLSCREEN_VS,
	getCanvasPixelSize,
	getWebGLContext,
	getOptimizedImageSrc,
	loadImage,
	observeCanvasPixelSize,
	setResolutionUniform,
	uploadTextureFromImage,
} from "@/lib/webgl";
import type { StaticImageData } from "next/image";
import { useEffect, useRef } from "react";
import { useMotionValueEvent, type MotionValue } from "motion/react";

export type WebGLPixelationCanvasProps = {
	className?: string;
	/** Source image sampled into the pixel grid. */
	image: StaticImageData;
	/** Size of each pixel cell in screen pixels. Defaults to 20. */
	pixelSize: MotionValue<number>;
	/** Dot radius in cell UV space (0–1). Defaults to 0.5. */
	radius: MotionValue<number>;
	/** Quality passed to the Next.js image optimizer. */
	quality?: number;
};

const DEFAULT_PIXEL_SIZE = 20;
const DEFAULT_RADIUS = 0.5;

const FS = `
precision mediump float;
varying vec2 vUv;
uniform vec2 uResolution;
uniform float uPixelSize;
uniform float uRadius;
uniform sampler2D uTexture;

void main() {
  vec2 uv = vUv;
  vec2 normalizedPixelSize = uPixelSize / uResolution;
  vec2 uvPixel = normalizedPixelSize * floor(uv / normalizedPixelSize);

  vec4 color = texture2D(uTexture, uvPixel);

  vec2 cellUv = fract(uv / normalizedPixelSize);
  float dist = length(cellUv - 0.5);

  float circle = smoothstep(uRadius - 0.01, uRadius + 0.01, dist);

  color = mix(color, vec4(0.0, 0.0, 0.0, 1.0), circle);
  gl_FragColor = color;
}
`;

/**
 * Pixelates a texture on a grid and masks each cell with a circular dot
 * (black outside the radius).
 */
export function WebGLPixelationCanvas({
	className,
	image,
	pixelSize,
	radius,
	quality = 80,
}: WebGLPixelationCanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const drawRef = useRef<(() => void) | null>(null);
	const invalidate = useRef(createScheduledDraw(drawRef));

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		let cancelled = false;
		let program: WebGLProgram | null = null;
		let buf: WebGLBuffer | null = null;
		let texture: WebGLTexture | null = null;
		let textureLoadId = 0;
		let loadedTextureSize = { w: 0, h: 0 };

		const gl = getWebGLContext(canvas);
		if (!gl) return;

		const reloadTexture = async (w: number, h: number) => {
			if (w <= 0 || h <= 0) return;

			const loadId = ++textureLoadId;
			const src = getOptimizedImageSrc(image, w, h, quality);
			const imageElement = await loadImage(src);
			if (cancelled || loadId !== textureLoadId) return;

			if (texture) gl.deleteTexture(texture);
			texture = uploadTextureFromImage(gl, imageElement);
			loadedTextureSize = { w, h };
			invalidate.current();
		};

		program = createProgram(gl, FULLSCREEN_VS, FS);
		if (!program) return;

		const uResolution = gl.getUniformLocation(program, "uResolution");
		const uPixelSizeLoc = gl.getUniformLocation(program, "uPixelSize");
		const uRadiusLoc = gl.getUniformLocation(program, "uRadius");
		const uTextureLoc = gl.getUniformLocation(program, "uTexture");

		buf = createFullscreenTriangleBuffer(gl);
		if (!buf) {
			gl.deleteProgram(program);
			return;
		}

		const draw = () => {
			if (!texture) return;

			gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
			gl.clearColor(0, 0, 0, 1);
			gl.clear(gl.COLOR_BUFFER_BIT);
			// biome-ignore lint/correctness/useHookAtTopLevel: not a hook
			gl.useProgram(program);
			setResolutionUniform(gl, uResolution);
			if (uPixelSizeLoc) gl.uniform1f(uPixelSizeLoc, pixelSize.get());
			if (uRadiusLoc) gl.uniform1f(uRadiusLoc, radius.get());

			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, texture);
			if (uTextureLoc) gl.uniform1i(uTextureLoc, 0);

			drawFullscreenTriangle(gl, program, buf);
		};

		drawRef.current = draw;

		const disconnectResize = observeCanvasPixelSize(canvas, (size) => {
			drawRef.current?.();
		});

		const { w, h } = getCanvasPixelSize(canvas);
		if (w > 0 && h > 0) reloadTexture(w, h);

		return () => {
			cancelled = true;
			disconnectResize();
			drawRef.current = null;
			if (buf) gl.deleteBuffer(buf);
			if (texture) gl.deleteTexture(texture);
			if (program) gl.deleteProgram(program);
		};
	}, [image, pixelSize, radius, quality]);

	useMotionValueEvent(pixelSize, "change", () => {
		invalidate.current();
	});
	useMotionValueEvent(radius, "change", () => {
		invalidate.current();
	});

	return <canvas ref={canvasRef} className={className} style={CANVAS_STYLE} />;
}
