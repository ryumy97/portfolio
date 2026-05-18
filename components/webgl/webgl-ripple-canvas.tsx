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
import { useEffect, useRef } from "react";

export type WebGLRippleCanvasProps = {
	className?: string;
	/** Max number of concurrent ripples. Defaults to 10. */
	maxRipples?: number;
};

const MAX_RIPPLES = 24;
const POINTER_THROTTLE_MS = 10;

const FS = `
precision mediump float;
varying vec2 vUv;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec4 u_ripples[${MAX_RIPPLES}];
uniform vec2 u_rippleVel[${MAX_RIPPLES}];

void main() {
  vec2 uv = vUv;
  vec2 normalizedPixelSize = 50.0 / u_resolution;
  vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);

  float wave = 0.0;

  for (int i = 0; i < ${MAX_RIPPLES}; i++) {
    vec2 center = u_ripples[i].xy;
    float birth = u_ripples[i].z;
    float velocity = u_ripples[i].w;

    if (birth < 0.0) continue;

    float age = u_time - birth;
    vec2 vel = u_rippleVel[i];
    vec2 movedCenter = center + vel * age;

    float radius = age * 0.4;
    float fadeOut = exp(-age * 6.0);

    float dist = length((uv - movedCenter) * aspect);
    float ring = sin((dist - radius) * 40.0) * fadeOut;
    ring *= smoothstep(radius + 0.05, radius, dist);
    ring *= smoothstep(0.0, 0.02, dist);

    wave += ring;
  }

  float alpha = clamp(abs(wave), 0.0, 1.0);
  float u_radius = 0.72;

  vec2 cellUv = fract(uv / normalizedPixelSize);
  float dist = length(cellUv - 0.5);

  float circle = 1.0 - smoothstep((u_radius - 0.01) * alpha, (u_radius + 0.01) * alpha, dist);

  vec3 color = vec3(0.969, 0.365, 0.365);

  gl_FragColor = vec4(color, circle);
}
`;

type Ripple = {
	x: number;
	y: number;
	birth: number;
	velocity: number;
	vx: number;
	vy: number;
};

export function WebGLRippleCanvas({
	className,
	maxRipples = MAX_RIPPLES,
}: WebGLRippleCanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const ripplesRef = useRef<Ripple[]>([]);
	const startTimeRef = useRef(0);
	const rafRef = useRef(0);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const gl = getWebGLContext(canvas);
		if (!gl) return;

		const program = createProgram(gl, FULLSCREEN_VS, FS);
		if (!program) return;

		const uResolution = gl.getUniformLocation(program, "u_resolution");
		const uTimeLoc = gl.getUniformLocation(program, "u_time");
		const uRippleLocs: WebGLUniformLocation[] = [];
		const uRippleVelLocs: WebGLUniformLocation[] = [];
		for (let i = 0; i < maxRipples; i++) {
			const loc = gl.getUniformLocation(program, `u_ripples[${i}]`);
			if (loc) uRippleLocs.push(loc);
			const velLoc = gl.getUniformLocation(program, `u_rippleVel[${i}]`);
			if (velLoc) uRippleVelLocs.push(velLoc);
		}

		const buf = createFullscreenTriangleBuffer(gl);
		if (!buf) {
			gl.deleteProgram(program);
			return;
		}

		startTimeRef.current = performance.now() / 1000;

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		const draw = () => {
			const now = performance.now() / 1000 - startTimeRef.current;
			gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);
			// biome-ignore lint/correctness/useHookAtTopLevel: not a hook
			gl.useProgram(program);
			setResolutionUniform(gl, uResolution);
			if (uTimeLoc) gl.uniform1f(uTimeLoc, now);

			const ripples = ripplesRef.current;
			for (let i = 0; i < maxRipples; i++) {
				const loc = uRippleLocs[i];
				const velLoc = uRippleVelLocs[i];
				if (i < ripples.length) {
					if (loc) {
						gl.uniform4f(
							loc,
							ripples[i].x,
							ripples[i].y,
							ripples[i].birth,
							ripples[i].velocity,
						);
					}
					if (velLoc) gl.uniform2f(velLoc, ripples[i].vx, ripples[i].vy);
				} else {
					if (loc) gl.uniform4f(loc, 0, 0, -1, 0);
					if (velLoc) gl.uniform2f(velLoc, 0, 0);
				}
			}

			drawFullscreenTriangle(gl, program, buf);
		};

		const loop = () => {
			draw();
			rafRef.current = requestAnimationFrame(loop);
		};

		let lastPointerTime = 0;
		let lastPointerX = 0;
		let lastPointerY = 0;

		const handlePointer = (e: PointerEvent) => {
			const now = performance.now();
			if (now - lastPointerTime < POINTER_THROTTLE_MS) return;

			const rect = canvas.getBoundingClientRect();
			const x = (e.clientX - rect.left) / rect.width;
			const y = 1.0 - (e.clientY - rect.top) / rect.height;

			const dt = (now - lastPointerTime) / 1000;
			const dx = x - lastPointerX;
			const dy = y - lastPointerY;
			const speed = dt > 0 ? Math.sqrt(dx * dx + dy * dy) / dt : 0;
			const velocity = Math.min(speed * 1000, 1.0);
			const vx = dt > 0 ? (dx / dt) * 0.3 : 0;
			const vy = dt > 0 ? (dy / dt) * 0.3 : 0;

			lastPointerTime = now;
			lastPointerX = x;
			lastPointerY = y;

			const t = now / 1000 - startTimeRef.current;

			ripplesRef.current.push({ x, y, birth: t, velocity, vx, vy });
			if (ripplesRef.current.length > maxRipples) {
				ripplesRef.current.shift();
			}
		};

		window.addEventListener("pointermove", handlePointer);
		window.addEventListener("pointerdown", handlePointer);

		const disconnectResize = observeCanvasPixelSize(canvas, () => {});

		loop();

		return () => {
			disconnectResize();
			cancelAnimationFrame(rafRef.current);
			window.removeEventListener("pointermove", handlePointer);
			window.removeEventListener("pointerdown", handlePointer);
			gl.deleteBuffer(buf);
			gl.deleteProgram(program);
		};
	}, [maxRipples]);

	return <canvas ref={canvasRef} className={className} style={CANVAS_STYLE} />;
}
