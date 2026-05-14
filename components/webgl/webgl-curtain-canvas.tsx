"use client";

import type { MotionValue } from "motion";
import { useMotionValueEvent } from "motion/react";
import { useEffect, useRef } from "react";

export type WebGLCurtainCanvasProps = {
	className?: string;
	/** 0–100, uploaded as GLSL `u_progress` in 0–1. */
	progress: MotionValue<number>;
};

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
uniform float u_progress;

void main() {
  vec2 uv = v_uv;

  float center = 0.5;
  float halfWidth = mix(0.0, 0.5, u_progress);

  float dist = abs(uv.x - center);

  float color = step(dist, halfWidth);
  float light = smoothstep(dist, 1.0, u_progress);
  float light2 = smoothstep(dist, 1.0, u_progress);
  if (u_progress == 0.0) {
  	gl_FragColor = vec4(vec3(0.0), 1.0);
  	return;
  }

  if (color < 1.0) {
	gl_FragColor = vec4(vec3(light), 1.0);
	return;
  }

  gl_FragColor = vec4(vec3(color), 1.0 - light);
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

export function WebGLCurtainCanvas({
	className,
	progress,
}: WebGLCurtainCanvasProps) {
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

		const applyProgram = gl.useProgram.bind(gl);

		const draw = () => {
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
			if (uProgressLoc) gl.uniform1f(uProgressLoc, progressRef.current);

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
	}, []);

	useMotionValueEvent(progress, "change", (value) => {
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
