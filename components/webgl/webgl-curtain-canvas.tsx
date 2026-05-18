"use client";

import {
	CANVAS_STYLE,
	createFullscreenTriangleBuffer,
	createProgram,
	drawFullscreenTriangle,
	FULLSCREEN_VS,
	getWebGLContext,
	observeCanvasPixelSize,
	setResolutionUniform,
} from "@/lib/webgl";
import type { MotionValue } from "motion";
import { useMotionValueEvent } from "motion/react";
import { useEffect, useRef } from "react";

export type WebGLCurtainCanvasProps = {
	className?: string;
	/** 0–100, uploaded as GLSL `u_progress` in 0–1. */
	progress: MotionValue<number>;
};

const FS = `
precision mediump float;
varying vec2 vUv;
uniform vec2 u_resolution;
uniform float u_progress;

void main() {
  vec2 uv = vUv;

  float center = 0.5;
  float halfWidth = mix(0.0, 0.5, u_progress);

  float dist = abs(uv.x - center);

  float color = step(dist, halfWidth);
  float light = smoothstep(dist, 1.0, u_progress);
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

		const gl = getWebGLContext(canvas);
		if (!gl) return;

		const program = createProgram(gl, FULLSCREEN_VS, FS);
		if (!program) return;

		const uResolution = gl.getUniformLocation(program, "u_resolution");
		const uProgressLoc = gl.getUniformLocation(program, "u_progress");
		const buf = createFullscreenTriangleBuffer(gl);
		if (!buf) {
			gl.deleteProgram(program);
			return;
		}

		const draw = () => {
			gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
			gl.clearColor(0, 0, 0, 1);
			gl.clear(gl.COLOR_BUFFER_BIT);
			// biome-ignore lint/correctness/useHookAtTopLevel: not a hook
			gl.useProgram(program);
			setResolutionUniform(gl, uResolution);
			if (uProgressLoc) gl.uniform1f(uProgressLoc, progressRef.current);
			drawFullscreenTriangle(gl, program, buf);
		};

		drawRef.current = draw;

		const disconnectResize = observeCanvasPixelSize(canvas, () => {
			draw();
		});

		return () => {
			disconnectResize();
			drawRef.current = null;
			gl.deleteBuffer(buf);
			gl.deleteProgram(program);
		};
	}, []);

	useMotionValueEvent(progress, "change", (value) => {
		progressRef.current = value;
		drawRef.current?.();
	});

	return <canvas ref={canvasRef} className={className} style={CANVAS_STYLE} />;
}
