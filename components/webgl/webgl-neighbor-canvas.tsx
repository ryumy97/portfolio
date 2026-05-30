"use client";

import type { MotionValue } from "motion/react";
import { useMotionValueEvent } from "motion/react";
import type { StaticImageData } from "next/image";
import { useEffect, useRef } from "react";
import {
	CANVAS_STYLE,
	createFullscreenTriangleBuffer,
	createProgram,
	createScheduledDraw,
	drawFullscreenTriangle,
	FULLSCREEN_VS,
	getCanvasPixelSize,
	getScrollSegmentState,
	getWebGLContext,
	loadOptimizedImages,
	observeCanvasPixelSize,
	setResolutionUniform,
	uploadTextureFromImage,
} from "@/lib/webgl";

export const WEBGL_NEIGHBOR_DEFAULTS = {
	pixelSize: 20,
	radius: 0.72,
	quality: 75,
} as const;

export type WebGLNeighborCanvasProps = {
	className?: string;
	/** Images sampled as halftone textures (optimized to canvas size). */
	images: StaticImageData[];
	/** Global scroll progress from 0 to 1. */
	progress: MotionValue<number>;
	/** Size of each halftone cell in pixels. Defaults to 20. */
	pixelSize?: number;
	/** Dot radius as a fraction of cell size (0–1). Defaults to 0.72. */
	radius?: number;
	/** Quality passed to the Next.js image optimizer. Defaults to 75. */
	quality?: number;
};

type NeighborConfig = {
	pixelSize: number;
	radius: number;
};

const FS = `
#extension GL_OES_standard_derivatives : enable
precision mediump float;
varying vec2 vUv;
uniform vec2 uResolution;
uniform float uPixelSize;
uniform float uRadius;
uniform sampler2D uTexture1;
uniform sampler2D uTexture2;
uniform float uProgress;

vec4 sampleCellColor(vec2 cellIndex, vec2 uvPixel) {
  if (uvPixel.x + uvPixel.y > uProgress * 2.0) {
	return texture2D(uTexture1, uvPixel);
  }
  else {
	return texture2D(uTexture2, uvPixel);
  }
}

void main() {
  vec2 pixelCoord = vUv * uResolution;
  vec2 baseCellIndex = floor(pixelCoord / uPixelSize);

  vec4 finalColor = vec4(0.0);
  float maxCircle = 0.0;

  const int searchRadius = 1;

  for (int dx = -searchRadius; dx <= searchRadius; dx++) {
    for (int dy = -searchRadius; dy <= searchRadius; dy++) {
      vec2 cellIndex = baseCellIndex + vec2(float(dx), float(dy));
      vec2 cellCenter = (cellIndex + 0.5) * uPixelSize;
      vec2 uvPixel = cellCenter / uResolution;
	  
      vec4 color = sampleCellColor(cellIndex, uvPixel);

      float dist = length(pixelCoord - cellCenter);
      float radius = uPixelSize * uRadius;
      float aa = fwidth(dist);
      float circle = 1.0 - smoothstep(radius - aa, radius + aa, dist);

      if (circle > maxCircle) {
        maxCircle = circle;
        finalColor = color;
      }
    }
  }

  vec3 bgColor = vec3(0.0);
  vec3 color = mix(bgColor, finalColor.rgb, maxCircle);
  gl_FragColor = vec4(color, 1.0);
}
`;

/**
 * WebGL halftone effect with per-segment texture transitions.
 *
 * Scroll 0→1 is split into `imageSrcs.length - 1` equal segments. Within each
 * segment, `uTexture1`/`uTexture2` mix from image k to image k + 1.
 */
export function WebGLNeighborCanvas({
	className,
	images,
	progress,
	pixelSize = WEBGL_NEIGHBOR_DEFAULTS.pixelSize,
	radius = WEBGL_NEIGHBOR_DEFAULTS.radius,
	quality = WEBGL_NEIGHBOR_DEFAULTS.quality,
}: WebGLNeighborCanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const drawRef = useRef<(() => void) | null>(null);
	const scrollRef = useRef(progress.get());
	const invalidate = useRef(createScheduledDraw(drawRef));
	const configRef = useRef<NeighborConfig>({ pixelSize, radius });

	useEffect(() => {
		configRef.current = { pixelSize, radius };
		invalidate.current();
	}, [pixelSize, radius]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || images.length === 0) return;

		const segmentCount = Math.max(images.length - 1, 1);

		let cancelled = false;
		let program: WebGLProgram | null = null;
		let buf: WebGLBuffer | null = null;
		const textures: WebGLTexture[] = [];
		let textureLoadId = 0;
		let loadedTextureSize = { w: 0, h: 0 };

		const gl = getWebGLContext(canvas);
		if (!gl) return;

		gl.getExtension("OES_standard_derivatives");

		const reloadTextures = async (w: number, h: number) => {
			if (w <= 0 || h <= 0) return;

			const loadId = ++textureLoadId;
			const imageElements = await loadOptimizedImages(images, w, h, quality);
			if (cancelled || loadId !== textureLoadId) return;

			for (const tex of textures) gl.deleteTexture(tex);
			textures.length = 0;

			for (const imageElement of imageElements) {
				const tex = uploadTextureFromImage(gl, imageElement);
				if (tex) textures.push(tex);
			}

			loadedTextureSize = { w, h };
			invalidate.current();
		};

		program = createProgram(gl, FULLSCREEN_VS, FS);
		if (!program) return;

		const uResolution = gl.getUniformLocation(program, "uResolution");
		const uPixelSizeLoc = gl.getUniformLocation(program, "uPixelSize");
		const uRadiusLoc = gl.getUniformLocation(program, "uRadius");
		const uProgressLoc = gl.getUniformLocation(program, "uProgress");
		const uTexture1Loc = gl.getUniformLocation(program, "uTexture1");
		const uTexture2Loc = gl.getUniformLocation(program, "uTexture2");

		buf = createFullscreenTriangleBuffer(gl);
		if (!buf) {
			gl.deleteProgram(program);
			return;
		}

		const draw = () => {
			if (textures.length === 0) return;

			const config = configRef.current;
			gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
			gl.clearColor(0, 0, 0, 1);
			gl.clear(gl.COLOR_BUFFER_BIT);
			// biome-ignore lint/correctness/useHookAtTopLevel: not a hook
			gl.useProgram(program);

			const { segment, mix } = getScrollSegmentState(
				scrollRef.current,
				segmentCount,
			);
			const from = textures[segment];
			const to = textures[Math.min(segment + 1, textures.length - 1)];

			setResolutionUniform(gl, uResolution);
			if (uPixelSizeLoc) gl.uniform1f(uPixelSizeLoc, config.pixelSize);
			if (uRadiusLoc) gl.uniform1f(uRadiusLoc, config.radius);
			if (uProgressLoc) gl.uniform1f(uProgressLoc, mix);

			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, from);
			if (uTexture1Loc) gl.uniform1i(uTexture1Loc, 0);

			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, to);
			if (uTexture2Loc) gl.uniform1i(uTexture2Loc, 1);

			drawFullscreenTriangle(gl, program, buf);
		};

		drawRef.current = draw;

		const disconnectResize = observeCanvasPixelSize(canvas, (size) => {
			const sizeChanged =
				size.w !== loadedTextureSize.w || size.h !== loadedTextureSize.h;

			if (sizeChanged) {
				reloadTextures(size.w, size.h);
			} else {
				invalidate.current();
			}
		});

		const { w, h } = getCanvasPixelSize(canvas);
		if (w > 0 && h > 0) reloadTextures(w, h);

		return () => {
			cancelled = true;
			disconnectResize();
			drawRef.current = null;
			if (buf) gl.deleteBuffer(buf);
			for (const tex of textures) gl.deleteTexture(tex);
			if (program) gl.deleteProgram(program);
		};
	}, [images, quality]);

	useMotionValueEvent(progress, "change", (value) => {
		scrollRef.current = value;
		invalidate.current();
	});

	return <canvas ref={canvasRef} className={className} style={CANVAS_STYLE} />;
}
