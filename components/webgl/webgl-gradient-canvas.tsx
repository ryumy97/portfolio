"use client";

import { MotionValue } from "motion";
import { useMotionValueEvent } from "motion/react";
import { useEffect, useRef } from "react";

export type WebGLGradientCanvasProps = {
	className?: string;
	/** Maps to GLSL `radius`: max dot radius in cell space (≈0.35–0.55). */
	halftoneRadius?: number;
	/** Maps to GLSL `pixelSize`: size of each halftone cell in pixels. */
	halftonePixelSize?: number;
	/** 0–100, uploaded as GLSL `u_progress` in 0–1. */
	progress: MotionValue<number>;
};

const DEFAULT_HALFTONE_PIXEL_SIZE = 50;
const DEFAULT_HALFTONE_RADIUS = 0.72;

const VS = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = 0.5 * (a_pos + 1.0);
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FS = `
precision mediump float;
varying vec2 v_uv;
uniform vec2 u_resolution;
uniform float u_pixelSize;
uniform float u_radius;
uniform float u_progress;

float clampGradient(float x) {
	return clamp(x, 0.0, 1.0);
}

void main() {
	vec2 uv = v_uv;
	vec2 normalizedPixelSize = u_pixelSize / u_resolution;

	// gradient
	float thickness = 0.3;
	float xProgress = mix(0.0, 1.0 / thickness, uv.x - mix(1.0, -thickness, u_progress));
	float yProgress = mix(0.0, 1.0 / thickness, uv.y - mix(1.0, -thickness, u_progress));
	float gradient = 1.0 - clampGradient((xProgress + yProgress) * 0.5);

	// cell	
	vec2 cellUv = fract(uv / normalizedPixelSize);
	float dist = length(cellUv - 0.5);

	// shape - gradient effecting cell 
	float circle = 1.0 - smoothstep((u_radius - 0.01) * gradient, (u_radius + 0.01) * gradient, dist);

	// color
	vec3 color = mix(vec3(0.0), vec3(0.969, 0.365, 0.365), clampGradient(u_progress * 2.0));

	gl_FragColor = vec4(color, circle);
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

/**
 * Full-viewport WebGL halftone overlay. Uniforms: `u_resolution`, `u_pixelSize`,
 * `u_radius`, `u_progress` (0–1 from the `progress` prop 0–100).
 */
export function WebGLGradientCanvas({
	className,
	halftonePixelSize = DEFAULT_HALFTONE_PIXEL_SIZE,
	halftoneRadius = DEFAULT_HALFTONE_RADIUS,
	progress,
}: WebGLGradientCanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const progressRef = useRef(progress.get());
	progressRef.current = progress.get();
	const drawRef = useRef<(() => void) | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const gl = canvas.getContext("webgl", {
			alpha: true,
			premultipliedAlpha: false,
			antialias: false,
		});
		if (!gl) return;

		const vs = compile(gl, gl.VERTEX_SHADER, VS);
		const fs = compile(gl, gl.FRAGMENT_SHADER, FS);
		if (!vs || !fs) return;

		const program = linkProgram(gl, vs, fs);
		gl.deleteShader(vs);
		gl.deleteShader(fs);
		if (!program) return;

		const aPos = gl.getAttribLocation(program, "a_pos");
		const uResolution = gl.getUniformLocation(program, "u_resolution");
		const uPixelSizeLoc = gl.getUniformLocation(program, "u_pixelSize");
		const uRadiusLoc = gl.getUniformLocation(program, "u_radius");
		const uProgressLoc = gl.getUniformLocation(program, "u_progress");
		const buf = gl.createBuffer();
		if (!buf) {
			gl.deleteProgram(program);
			return;
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, buf);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array([-1, -1, 3, -1, -1, 3]),
			gl.STATIC_DRAW,
		);

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		const applyProgram = gl.useProgram.bind(gl);
		const uniform2f = gl.uniform2f.bind(gl);
		const uniform1f = gl.uniform1f.bind(gl);

		const draw = () => {
			gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);
			applyProgram(program);
			if (uResolution) {
				uniform2f(uResolution, gl.drawingBufferWidth, gl.drawingBufferHeight);
			}
			if (uPixelSizeLoc) uniform1f(uPixelSizeLoc, halftonePixelSize);
			if (uRadiusLoc) uniform1f(uRadiusLoc, halftoneRadius);
			if (uProgressLoc) uniform1f(uProgressLoc, progressRef.current);

			gl.bindBuffer(gl.ARRAY_BUFFER, buf);
			gl.enableVertexAttribArray(aPos);
			gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
		};

		drawRef.current = draw;

		const resize = () => {
			const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
			const w = Math.floor(canvas.clientWidth * dpr);
			const h = Math.floor(canvas.clientHeight * dpr);
			if (w > 0 && h > 0) {
				canvas.width = w;
				canvas.height = h;
			}
			draw();
		};

		const ro = new ResizeObserver(resize);
		ro.observe(canvas);
		resize();

		return () => {
			ro.disconnect();
			drawRef.current = null;
			gl.deleteBuffer(buf);
			gl.deleteProgram(program);
		};
	}, [halftonePixelSize, halftoneRadius]);

	useMotionValueEvent(progress, "change", (value) => {
		console.log(value);

		progressRef.current = value;
		drawRef.current?.();
	});

	return (
		<canvas
			ref={canvasRef}
			className={className}
			style={{ display: "block", width: "100%", height: "100%" }}
		/>
	);
}
