"use client";

import { getImageProps, type StaticImageData } from "next/image";
import { useEffect, useRef } from "react";

export type WebGLPixelationCanvasProps = {
	className?: string;
	/** Source image sampled into the pixel grid. */
	image: StaticImageData;
	/** Size of each pixel cell in screen pixels. Defaults to 20. */
	pixelSize?: number;
	/** Dot radius in cell UV space (0–1). Defaults to 0.5. */
	radius?: number;
	/** Quality passed to the Next.js image optimizer. */
	quality?: number;
};

const DEFAULT_PIXEL_SIZE = 20;
const DEFAULT_RADIUS = 0.5;

const VS = `
attribute vec2 a_pos;
varying vec2 vUv;
void main() {
  vUv = 0.5 * (a_pos + 1.0);
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

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

/**
 * Pixelates a texture on a grid and masks each cell with a circular dot
 * (black outside the radius).
 */
export function WebGLPixelationCanvas({
	className,
	image,
	pixelSize = DEFAULT_PIXEL_SIZE,
	radius = DEFAULT_RADIUS,
	quality = 80,
}: WebGLPixelationCanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const drawRef = useRef<(() => void) | null>(null);
	const rafRef = useRef(0);

	const invalidate = useRef(() => {
		cancelAnimationFrame(rafRef.current);
		rafRef.current = requestAnimationFrame(() => {
			drawRef.current?.();
		});
	});

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		let cancelled = false;
		let program: WebGLProgram | null = null;
		let buf: WebGLBuffer | null = null;
		let texture: WebGLTexture | null = null;
		let textureLoadId = 0;
		let loadedTextureSize = { w: 0, h: 0 };
		let ro: ResizeObserver | null = null;

		const gl = canvas.getContext("webgl", {
			alpha: true,
			premultipliedAlpha: false,
			antialias: false,
		});
		if (!gl) return;

		const uploadTexture = (imageElement: HTMLImageElement) => {
			if (texture) gl.deleteTexture(texture);
			texture = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
			gl.texImage2D(
				gl.TEXTURE_2D,
				0,
				gl.RGBA,
				gl.RGBA,
				gl.UNSIGNED_BYTE,
				imageElement,
			);
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		};

		const getCanvasSize = () => {
			const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
			return {
				w: Math.floor(canvas.clientWidth * dpr),
				h: Math.floor(canvas.clientHeight * dpr),
			};
		};

		const reloadTexture = async (w: number, h: number) => {
			if (w <= 0 || h <= 0) return;

			const loadId = ++textureLoadId;
			const src = getOptimizedSrc(image, w, h, quality);
			const imageElement = await loadImage(src);
			if (cancelled || loadId !== textureLoadId) return;

			uploadTexture(imageElement);
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
			const uTextureLoc = gl.getUniformLocation(program, "uTexture");

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
				if (!texture) return;

				gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
				gl.clearColor(0, 0, 0, 1);
				gl.clear(gl.COLOR_BUFFER_BIT);
				applyProgram(program);

				if (uResolution) {
					gl.uniform2f(
						uResolution,
						gl.drawingBufferWidth,
						gl.drawingBufferHeight,
					);
				}
				if (uPixelSizeLoc) gl.uniform1f(uPixelSizeLoc, pixelSize);
				if (uRadiusLoc) gl.uniform1f(uRadiusLoc, radius);

				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, texture);
				if (uTextureLoc) gl.uniform1i(uTextureLoc, 0);

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
					reloadTexture(w, h);
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
			ro?.disconnect();
			drawRef.current = null;
			if (buf) gl.deleteBuffer(buf);
			if (texture) gl.deleteTexture(texture);
			if (program) gl.deleteProgram(program);
		};
	}, [image, pixelSize, radius, quality]);

	return (
		<canvas
			ref={canvasRef}
			className={className}
			style={{ display: "block", width: "100%", height: "100%" }}
		/>
	);
}
