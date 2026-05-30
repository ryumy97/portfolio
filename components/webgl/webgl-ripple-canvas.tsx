"use client";

import { useEffect, useRef } from "react";
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

export const WEBGL_RIPPLE_DEFAULTS = {
	maxRipples: 24,
	pixelSize: 50,
	radius: 0.72,
	color: [0.969, 0.365, 0.365] as [number, number, number],
	expandRate: 0.4,
	fadeRate: 6,
	waveFrequency: 40,
	pointerThrottleMs: 10,
	velocityScale: 1000,
	maxVelocity: 1,
	driftStrength: 0.3,
} as const;

export type WebGLRippleCanvasProps = {
	className?: string;
	/** Max number of concurrent ripples. Defaults to 24. */
	maxRipples?: number;
	/** Halftone cell size in pixels. Defaults to 50. */
	pixelSize?: number;
	/** Dot radius within each cell (0–1). Defaults to 0.72. */
	radius?: number;
	/** Ripple color as RGB values (0–1). */
	color?: [number, number, number];
	/** How fast ripples expand. Defaults to 0.4. */
	expandRate?: number;
	/** Ripple decay speed. Defaults to 6. */
	fadeRate?: number;
	/** Ring wave density. Defaults to 40. */
	waveFrequency?: number;
	/** Minimum ms between pointer samples. Defaults to 10. */
	pointerThrottleMs?: number;
	/** Pointer speed multiplier for ripple intensity. Defaults to 1000. */
	velocityScale?: number;
	/** Max ripple velocity from pointer speed. Defaults to 1. */
	maxVelocity?: number;
	/** Pointer drift applied to ripple centers. Defaults to 0.3. */
	driftStrength?: number;
};

const MAX_RIPPLES = 24;

const FS = `
precision mediump float;
varying vec2 vUv;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_pixelSize;
uniform float u_radius;
uniform vec3 u_color;
uniform float u_expandRate;
uniform float u_fadeRate;
uniform float u_waveFrequency;
uniform vec4 u_ripples[${MAX_RIPPLES}];
uniform vec2 u_rippleVel[${MAX_RIPPLES}];

void main() {
  vec2 uv = vUv;
  vec2 normalizedPixelSize = u_pixelSize / u_resolution;
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

    float rippleRadius = age * u_expandRate;
    float fadeOut = exp(-age * u_fadeRate);

    float dist = length((uv - movedCenter) * aspect);
    float ring = sin((dist - rippleRadius) * u_waveFrequency) * fadeOut;
    ring *= smoothstep(rippleRadius + 0.05, rippleRadius, dist);
    ring *= smoothstep(0.0, 0.02, dist);

    wave += ring;
  }

  float alpha = clamp(abs(wave), 0.0, 1.0);

  vec2 cellUv = fract(uv / normalizedPixelSize);
  float dist = length(cellUv - 0.5);

  float circle = 1.0 - smoothstep((u_radius - 0.01) * alpha, (u_radius + 0.01) * alpha, dist);

  gl_FragColor = vec4(u_color, circle);
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

type RippleConfig = {
	maxRipples: number;
	pixelSize: number;
	radius: number;
	color: [number, number, number];
	expandRate: number;
	fadeRate: number;
	waveFrequency: number;
	pointerThrottleMs: number;
	velocityScale: number;
	maxVelocity: number;
	driftStrength: number;
};

export function WebGLRippleCanvas({
	className,
	maxRipples = WEBGL_RIPPLE_DEFAULTS.maxRipples,
	pixelSize = WEBGL_RIPPLE_DEFAULTS.pixelSize,
	radius = WEBGL_RIPPLE_DEFAULTS.radius,
	color = WEBGL_RIPPLE_DEFAULTS.color,
	expandRate = WEBGL_RIPPLE_DEFAULTS.expandRate,
	fadeRate = WEBGL_RIPPLE_DEFAULTS.fadeRate,
	waveFrequency = WEBGL_RIPPLE_DEFAULTS.waveFrequency,
	pointerThrottleMs = WEBGL_RIPPLE_DEFAULTS.pointerThrottleMs,
	velocityScale = WEBGL_RIPPLE_DEFAULTS.velocityScale,
	maxVelocity = WEBGL_RIPPLE_DEFAULTS.maxVelocity,
	driftStrength = WEBGL_RIPPLE_DEFAULTS.driftStrength,
}: WebGLRippleCanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const ripplesRef = useRef<Ripple[]>([]);
	const startTimeRef = useRef(0);
	const rafRef = useRef(0);
	const configRef = useRef<RippleConfig>({
		maxRipples,
		pixelSize,
		radius,
		color,
		expandRate,
		fadeRate,
		waveFrequency,
		pointerThrottleMs,
		velocityScale,
		maxVelocity,
		driftStrength,
	});

	useEffect(() => {
		configRef.current = {
			maxRipples,
			pixelSize,
			radius,
			color,
			expandRate,
			fadeRate,
			waveFrequency,
			pointerThrottleMs,
			velocityScale,
			maxVelocity,
			driftStrength,
		};
	}, [
		maxRipples,
		pixelSize,
		radius,
		color,
		expandRate,
		fadeRate,
		waveFrequency,
		pointerThrottleMs,
		velocityScale,
		maxVelocity,
		driftStrength,
	]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const gl = getWebGLContext(canvas);
		if (!gl) return;

		const program = createProgram(gl, FULLSCREEN_VS, FS);
		if (!program) return;

		const uResolution = gl.getUniformLocation(program, "u_resolution");
		const uTimeLoc = gl.getUniformLocation(program, "u_time");
		const uPixelSize = gl.getUniformLocation(program, "u_pixelSize");
		const uRadius = gl.getUniformLocation(program, "u_radius");
		const uColor = gl.getUniformLocation(program, "u_color");
		const uExpandRate = gl.getUniformLocation(program, "u_expandRate");
		const uFadeRate = gl.getUniformLocation(program, "u_fadeRate");
		const uWaveFrequency = gl.getUniformLocation(program, "u_waveFrequency");
		const uRippleLocs: WebGLUniformLocation[] = [];
		const uRippleVelLocs: WebGLUniformLocation[] = [];
		for (let i = 0; i < MAX_RIPPLES; i++) {
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
			const config = configRef.current;
			const now = performance.now() / 1000 - startTimeRef.current;
			gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);
			// biome-ignore lint/correctness/useHookAtTopLevel: not a hook
			gl.useProgram(program);
			setResolutionUniform(gl, uResolution);
			if (uTimeLoc) gl.uniform1f(uTimeLoc, now);
			if (uPixelSize) gl.uniform1f(uPixelSize, config.pixelSize);
			if (uRadius) gl.uniform1f(uRadius, config.radius);
			if (uColor)
				gl.uniform3f(uColor, config.color[0], config.color[1], config.color[2]);
			if (uExpandRate) gl.uniform1f(uExpandRate, config.expandRate);
			if (uFadeRate) gl.uniform1f(uFadeRate, config.fadeRate);
			if (uWaveFrequency) gl.uniform1f(uWaveFrequency, config.waveFrequency);

			const ripples = ripplesRef.current;
			for (let i = 0; i < MAX_RIPPLES; i++) {
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
			const config = configRef.current;
			const now = performance.now();
			if (now - lastPointerTime < config.pointerThrottleMs) return;

			const rect = canvas.getBoundingClientRect();
			const x = (e.clientX - rect.left) / rect.width;
			const y = 1.0 - (e.clientY - rect.top) / rect.height;

			const dt = (now - lastPointerTime) / 1000;
			const dx = x - lastPointerX;
			const dy = y - lastPointerY;
			const speed = dt > 0 ? Math.sqrt(dx * dx + dy * dy) / dt : 0;
			const velocity = Math.min(
				speed * config.velocityScale,
				config.maxVelocity,
			);
			const vx = dt > 0 ? (dx / dt) * config.driftStrength : 0;
			const vy = dt > 0 ? (dy / dt) * config.driftStrength : 0;

			lastPointerTime = now;
			lastPointerX = x;
			lastPointerY = y;

			const t = now / 1000 - startTimeRef.current;

			ripplesRef.current.push({ x, y, birth: t, velocity, vx, vy });
			if (ripplesRef.current.length > config.maxRipples) {
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
	}, []);

	return <canvas ref={canvasRef} className={className} style={CANVAS_STYLE} />;
}
