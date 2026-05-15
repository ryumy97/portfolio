"use client";

import type { MotionValue } from "motion/react";
import { useMotionValueEvent } from "motion/react";
import { getImageProps, type StaticImageData } from "next/image";
import { useEffect, useRef } from "react";

export type WebGLNeighborCanvasProps = {
	className?: string;
	/** Images sampled as halftone textures (optimized to canvas size). */
	images: StaticImageData[];
	/** Global scroll progress from 0 to 1. */
	progress: MotionValue<number>;
	/** Size of each halftone cell in pixels. Defaults to 10. */
	pixelSize?: number;
	/** Dot radius as a fraction of cell size (0–1). Defaults to 0.4. */
	radius?: number;
	/** Quality passed to the Next.js image optimizer. */
	quality?: number;
};

const DEFAULT_PIXEL_SIZE = 20;
const DEFAULT_RADIUS = 0.72;

const VS = `
attribute vec2 a_pos;
varying vec2 vUv;
void main() {
  vUv = 0.5 * (a_pos + 1.0);
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

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

function compile(
	gl: WebGLRenderingContext,
	type: number,
	source: string,
): WebGLShader | null {
	const shader = gl.createShader(type);
	if (!shader) return null;
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		gl.deleteShader(shader);
		return null;
	}
	return shader;
}

function linkProgram(
	gl: WebGLRenderingContext,
	vs: WebGLShader,
	fs: WebGLShader,
): WebGLProgram | null {
	const program = gl.createProgram();
	if (!program) return null;
	gl.attachShader(program, vs);
	gl.attachShader(program, fs);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		gl.deleteProgram(program);
		return null;
	}
	return program;
}

function getOptimizedSrc(
	image: StaticImageData,
	width: number,
	height: number,
	quality: number,
) {
	const { props } = getImageProps({
		alt: "",
		src: image,
		width: Math.max(1, Math.round(width)),
		height: Math.max(1, Math.round(height)),
		quality,
	});
	return props.src;
}

function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = src;
	});
}

function getSegmentState(scroll: number, segmentCount: number) {
	const clamped = Math.max(0, Math.min(1, scroll));
	const scaled = clamped * segmentCount;
	const segment = Math.min(Math.floor(scaled), segmentCount - 1);
	const mix = scaled - segment;
	return { segment, mix };
}

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
	pixelSize = DEFAULT_PIXEL_SIZE,
	radius = DEFAULT_RADIUS,
	quality = 80,
}: WebGLNeighborCanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const drawRef = useRef<(() => void) | null>(null);
	const scrollRef = useRef(progress.get());
	const rafRef = useRef(0);
	const pendingRef = useRef(false);

	const invalidate = useRef(() => {
		rafRef.current = requestAnimationFrame(() => {
			drawRef.current?.();
		});
	});

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
		let ro: ResizeObserver | null = null;

		const gl = canvas.getContext("webgl", {
			alpha: true,
			premultipliedAlpha: false,
			antialias: false,
		});
		if (!gl) return;

		gl.getExtension("OES_standard_derivatives");

		const uploadTexture = (image: HTMLImageElement) => {
			const tex = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, tex);
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
			gl.texImage2D(
				gl.TEXTURE_2D,
				0,
				gl.RGBA,
				gl.RGBA,
				gl.UNSIGNED_BYTE,
				image,
			);
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			return tex;
		};

		const getCanvasSize = () => {
			const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
			return {
				w: Math.floor(canvas.clientWidth * dpr),
				h: Math.floor(canvas.clientHeight * dpr),
			};
		};

		const reloadTextures = async (w: number, h: number) => {
			if (w <= 0 || h <= 0) return;

			const loadId = ++textureLoadId;
			const srcs = images.map((image) => getOptimizedSrc(image, w, h, quality));
			const imageElements = await Promise.all(srcs.map(loadImage));
			if (cancelled || loadId !== textureLoadId) return;

			for (const tex of textures) gl.deleteTexture(tex);
			textures.length = 0;

			for (const image of imageElements) {
				textures.push(uploadTexture(image));
			}

			loadedTextureSize = { w, h };
			invalidate.current();
		};

		const init = async () => {
			const vs = compile(gl, gl.VERTEX_SHADER, VS);
			const fs = compile(gl, gl.FRAGMENT_SHADER, FS);
			if (!vs || !fs) return;

			program = linkProgram(gl, vs, fs);
			gl.deleteShader(vs);
			gl.deleteShader(fs);
			if (!program) return;

			const aPos = gl.getAttribLocation(program, "a_pos");
			const uResolution = gl.getUniformLocation(program, "uResolution");
			const uPixelSizeLoc = gl.getUniformLocation(program, "uPixelSize");
			const uRadiusLoc = gl.getUniformLocation(program, "uRadius");
			const uProgressLoc = gl.getUniformLocation(program, "uProgress");
			const uTexture1Loc = gl.getUniformLocation(program, "uTexture1");
			const uTexture2Loc = gl.getUniformLocation(program, "uTexture2");

			buf = gl.createBuffer();
			if (!buf) {
				gl.deleteProgram(program);
				program = null;
				return;
			}

			gl.bindBuffer(gl.ARRAY_BUFFER, buf);
			gl.bufferData(
				gl.ARRAY_BUFFER,
				new Float32Array([-1, -1, 3, -1, -1, 3]),
				gl.STATIC_DRAW,
			);

			const applyProgram = gl.useProgram.bind(gl);

			const draw = () => {
				if (textures.length === 0) return;

				gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
				gl.clearColor(0, 0, 0, 1);
				gl.clear(gl.COLOR_BUFFER_BIT);
				applyProgram(program);

				const { segment, mix } = getSegmentState(
					scrollRef.current,
					segmentCount,
				);
				const from = textures[segment];
				const to = textures[Math.min(segment + 1, textures.length - 1)];

				if (uResolution) {
					gl.uniform2f(
						uResolution,
						gl.drawingBufferWidth,
						gl.drawingBufferHeight,
					);
				}
				if (uPixelSizeLoc) gl.uniform1f(uPixelSizeLoc, pixelSize);
				if (uRadiusLoc) gl.uniform1f(uRadiusLoc, radius);
				if (uProgressLoc) gl.uniform1f(uProgressLoc, mix);

				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, from);
				if (uTexture1Loc) gl.uniform1i(uTexture1Loc, 0);

				gl.activeTexture(gl.TEXTURE1);
				gl.bindTexture(gl.TEXTURE_2D, to);
				if (uTexture2Loc) gl.uniform1i(uTexture2Loc, 1);

				gl.bindBuffer(gl.ARRAY_BUFFER, buf);
				gl.enableVertexAttribArray(aPos);
				gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
				gl.drawArrays(gl.TRIANGLES, 0, 3);
			};

			drawRef.current = draw;

			const resize = () => {
				const { w, h } = getCanvasSize();
				if (w <= 0 || h <= 0) return;

				const sizeChanged =
					w !== canvas.width ||
					h !== canvas.height ||
					w !== loadedTextureSize.w ||
					h !== loadedTextureSize.h;

				canvas.width = w;
				canvas.height = h;

				if (sizeChanged) {
					reloadTextures(w, h);
				} else {
					invalidate.current();
				}
			};

			ro = new ResizeObserver(resize);
			ro.observe(canvas);
			resize();
		};

		init();

		return () => {
			cancelled = true;
			cancelAnimationFrame(rafRef.current);
			pendingRef.current = false;
			ro?.disconnect();
			drawRef.current = null;
			if (buf) gl.deleteBuffer(buf);
			for (const tex of textures) gl.deleteTexture(tex);
			if (program) gl.deleteProgram(program);
		};
	}, [images, pixelSize, radius, quality]);

	useMotionValueEvent(progress, "change", (value) => {
		scrollRef.current = value;
		invalidate.current();
	});

	return (
		<canvas
			ref={canvasRef}
			className={className}
			style={{ display: "block", width: "100%", height: "100%" }}
		/>
	);
}
