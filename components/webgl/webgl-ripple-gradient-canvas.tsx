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

const MAX_CLICK_RIPPLES = 6;

const FS = `
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColors[5];
uniform float uNoiseIntensity;
uniform float uNoiseStyle;
uniform float uRipple;
uniform float uDepth;
uniform float uSpeed;
uniform float uThickness;
uniform float uSpeedField;
uniform float uRippleCount;
uniform float uChromatic;
uniform float uNestedMode;
uniform float uGlassRadius;
uniform vec4 uClickRipples[6];
varying vec2 vUv;
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.52;
  mat2 rotate = mat2(0.82, -0.57, 0.57, 0.82);
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = rotate * p * 2.03 + 13.7;
    amplitude *= 0.52;
  }
  return value;
}
vec3 palette(float t) {
  t = clamp(t, 0.0, 0.999);
  float scaled = t * 4.0;
  int index = int(floor(scaled));
  float blend = smoothstep(0.08, 0.92, fract(scaled));
  if (index == 0) return mix(uColors[0], uColors[1], blend);
  if (index == 1) return mix(uColors[1], uColors[2], blend);
  if (index == 2) return mix(uColors[2], uColors[3], blend);
  return mix(uColors[3], uColors[4], blend);
}
float roundedRectSDF(vec2 p, vec2 halfSize, float radius) {
  vec2 q = abs(p) - halfSize + vec2(radius);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
}
float glassRefractionCurve(float x) {
  float a = 0.992;
  float b = 2.332;
  float c = 4.544;
  float d = 6.923;
  return 1.0 - b * pow(c * 2.718281828459045, -d * x - a);
}
vec2 randomCenter(float seed) {
  return vec2(
    mix(-0.82, 0.82, hash(vec2(seed, seed + 19.7))),
    mix(-0.62, 0.62, hash(vec2(seed + 41.2, seed + 3.4)))
  );
}
float surfaceRidge(vec2 p) {
  float fieldTime = uTime * 0.12 * mix(0.4, 1.35, clamp(uSpeedField, 0.0, 1.8));
  float curve =
    0.18 * sin(p.x * 2.1 - 0.5 + fieldTime) +
    0.1 * sin(p.x * 4.8 + 1.4 - fieldTime * 0.73) +
    0.045 * sin((p.x + p.y) * 6.2 + fieldTime * 1.18);
  float ridgeDistance = abs(p.y - curve);
  float ridgeWidth = mix(0.3, 0.18, 0.5 + 0.5 * sin(fieldTime * 0.83));
  float ridge = 1.0 - smoothstep(0.018, ridgeWidth, ridgeDistance);
  float shoulder = 1.0 - smoothstep(0.1, ridgeWidth + 0.32, ridgeDistance);
  return clamp(ridge * 0.72 + shoulder * 0.28, 0.0, 1.0);
}
float surfaceSpeed(vec2 p) {
  float ridge = surfaceRidge(p);
  float sideBias = smoothstep(-0.24, 0.36, p.y - p.x * 0.1);
  float shapedField = clamp(uSpeedField, 0.0, 1.8);
  float ridgeSpeed = mix(1.0, 1.78, ridge) * mix(1.0, 1.18, sideBias);
  float slowPocket = mix(1.0, 0.56, 1.0 - ridge) * mix(1.0, 0.84, 1.0 - sideBias);
  return mix(1.0, ridgeSpeed * slowPocket, shapedField);
}
vec2 viscousWave(vec2 p, float seed, float offset, float cycle, float baseRate, float width) {
  float clock = uTime * uSpeed + offset;
  float generation = floor(clock / cycle);
  float age = mod(clock, cycle);
  float seeded = seed + generation * 23.71;
  float localSpeed = surfaceSpeed(p);
  float ridge = surfaceRidge(p);
  float radius = age * baseRate * mix(0.68, 1.36, hash(vec2(seeded, 9.4))) * localSpeed;
  float envelope = smoothstep(0.0, cycle * 0.16, age) * (1.0 - smoothstep(cycle * 0.66, cycle, age));
  vec2 center = randomCenter(seeded);
  vec2 stretch = vec2(
    mix(0.68, 1.58, hash(vec2(seeded + 2.0, 11.7))),
    mix(0.68, 1.72, hash(vec2(seeded + 8.0, 17.3)))
  );
  float spin = mix(-0.85, 0.85, hash(vec2(seeded + 4.0, 31.6)));
  mat2 rotate = mat2(cos(spin), -sin(spin), sin(spin), cos(spin));
  float drift = fbm(p * 1.7 + center * 2.0 + age * 0.015 * localSpeed);
  vec2 pulled = p - center;
  pulled += 0.08 * vec2(
    fbm(p * 2.1 + age * 0.025 * localSpeed),
    fbm(p * 1.8 - age * 0.018 * localSpeed)
  );
  pulled += ridge * 0.035 * vec2(sin(p.y * 8.0 + seeded), cos(p.x * 7.0 - seeded));
  float distanceField = length((rotate * pulled) * stretch) + (drift - 0.5) * 0.16;
  float thickWidth = width * uThickness;
  float ring = 1.0 - smoothstep(thickWidth * 0.75, thickWidth * 2.7, abs(distanceField - radius));
  float interiorDistance = max(radius - distanceField, 0.0);
  float wake = smoothstep(0.0, thickWidth * 4.8, interiorDistance);
  wake *= 1.0 - smoothstep(max(radius * 0.24, thickWidth * 3.2), max(radius * 1.12, thickWidth * 5.2), interiorDistance);
  wake *= 1.0 - smoothstep(cycle * 0.48, cycle * 0.88, age);
  wake *= 0.82 + 0.18 * fbm(p * 2.1 + vec2(seeded));
  return vec2(ring * envelope, wake * envelope);
}
vec2 nestedWaveFamily(vec2 p, float seed, float offset, float cycle, float baseRate, float width) {
  vec2 outer = viscousWave(p, seed, offset, cycle, baseRate, width);
  vec2 middle = viscousWave(p, seed, offset + cycle * 0.12, cycle, baseRate * 0.98, width * 0.72);
  vec2 inner = viscousWave(p, seed, offset + cycle * 0.24, cycle, baseRate * 0.96, width * 0.5);
  return outer + middle * 0.62 + inner * 0.36;
}
vec2 clickWave(vec2 p, vec4 ripple) {
  float age = max(uTime - ripple.z, 0.0);
  float alive = step(0.0, ripple.z) * (1.0 - smoothstep(3.2, 5.4, age));
  float entrance = smoothstep(0.0, 0.72, age);
  float easedAge = age * mix(0.28, 1.0, entrance);
  float localSpeed = surfaceSpeed(p);
  float seeded = ripple.w;
  float baseWidth = mix(0.11, 0.18, hash(vec2(seeded, 14.6))) * uThickness * mix(0.45, 1.0, entrance);
  float radius = easedAge * uSpeed * mix(0.032, 0.052, hash(vec2(seeded + 5.0, 38.2))) * localSpeed;
  float drift = fbm(p * 1.9 + vec2(seeded) + age * 0.02);
  vec2 pulled = p - ripple.xy;
  pulled += 0.05 * vec2(
    fbm(p * 2.4 + age * 0.03 + seeded),
    fbm(p * 2.0 - age * 0.025 + seeded)
  );
  float distanceField = length(pulled) + (drift - 0.5) * 0.12;
  float ring = 1.0 - smoothstep(baseWidth * 0.55, baseWidth * 2.5, abs(distanceField - radius));
  float interiorDistance = max(radius - distanceField, 0.0);
  float wake = smoothstep(0.0, baseWidth * 3.2, interiorDistance);
  wake *= 1.0 - smoothstep(max(radius * 0.26, baseWidth * 2.4), max(radius * 1.08, baseWidth * 4.2), interiorDistance);
  return vec2(ring, wake) * alive * entrance;
}
void main() {
  vec2 uv = vUv;
  vec2 p = uv - 0.5;
  p.x *= uResolution.x / max(uResolution.y, 1.0);
  float t = uTime * uSpeed;
  float ridge = surfaceRidge(p);
  float localSpeed = surfaceSpeed(p);
  float localT = t * localSpeed;
  float low = fbm(p * 0.95 + vec2(localT * 0.018, -localT * 0.014));
  float mid = fbm(p * 2.0 + vec2(-localT * 0.026, localT * 0.018));
  float pull = fbm(p * 3.4 + vec2(low, mid) * 0.38 + localT * 0.012);
  vec2 waveA = mix(
    viscousWave(p, 11.2, 0.0, 28.0, 0.046, 0.16),
    nestedWaveFamily(p, 11.2, 0.0, 34.0, 0.037, 0.18),
    uNestedMode
  );
  vec2 waveB = mix(
    viscousWave(p, 47.8, 14.0, 36.0, 0.038, 0.2),
    nestedWaveFamily(p, 47.8, 17.0, 43.0, 0.032, 0.22),
    uNestedMode
  );
  vec2 waveC = viscousWave(p, 93.4, 22.0, 42.0, 0.033, 0.18) * (1.0 - uNestedMode);
  vec2 waveD = viscousWave(p, 129.6, 31.0, 46.0, 0.03, 0.22) * (1.0 - uNestedMode);
  float cWeight = smoothstep(2.0, 3.0, uRippleCount);
  float dWeight = smoothstep(3.0, 4.0, uRippleCount);
  float waves = waveA.x + waveB.x + waveC.x * cWeight + waveD.x * dWeight;
  float wake = waveA.y + waveB.y + waveC.y * cWeight + waveD.y * dWeight;
  for (int i = 0; i < 6; i++) {
    vec2 clicked = clickWave(p, uClickRipples[i]);
    waves += clicked.x;
    wake += clicked.y;
  }
  float depth = 0.84;
  depth += (low - 0.5) * 0.12;
  depth += (mid - 0.5) * 0.08;
  depth += (pull - 0.5) * 0.14 * uDepth;
  depth -= ridge * 0.04 * uDepth;
  depth += wake * 0.18 * uDepth;
  depth -= waves * 0.42 * uRipple;
  depth = smoothstep(0.18, 1.0, depth);
  vec3 baseGradient = mix(uColors[4], uColors[3], smoothstep(-0.2, 1.05, uv.y + low * 0.24));
  baseGradient = mix(baseGradient, uColors[2], smoothstep(0.15, 1.12, uv.x + mid * 0.18) * 0.26);
  vec3 color = mix(baseGradient, palette(depth), 0.74);
  float meniscus = smoothstep(0.18, 0.82, waves) * (1.0 - smoothstep(0.72, 1.0, waves));
  color = mix(color, palette(clamp(depth - 0.18, 0.0, 1.0)), meniscus * 0.36);
  float edgeMask = smoothstep(0.06, 0.62, waves) * (1.0 - smoothstep(0.58, 1.0, waves));
  float organicSplit = fbm(p * 3.1 + vec2(low, mid) * 0.8 + uTime * 0.018);
  float edgeAberration = edgeMask * (0.72 + 0.28 * organicSplit) * uChromatic;
  float depthSplit = 0.045 * edgeAberration;
  vec3 redShift = mix(baseGradient, palette(clamp(depth - depthSplit, 0.0, 1.0)), 0.74);
  vec3 blueShift = mix(baseGradient, palette(clamp(depth + depthSplit, 0.0, 1.0)), 0.74);
  vec3 refracted = vec3(redShift.r, color.g, blueShift.b);
  float fringeDrift = 0.5 + 0.5 * sin(p.x * 2.4 - p.y * 1.7 + organicSplit * 6.283 + uTime * 0.045);
  vec3 warmFringe = vec3(0.018, -0.002, -0.014);
  vec3 coolFringe = vec3(-0.012, 0.001, 0.018);
  color = mix(color, refracted, min(edgeAberration * 0.72, 0.82));
  color += mix(coolFringe, warmFringe, fringeDrift) * edgeAberration * 0.42;
  float grain = hash(gl_FragCoord.xy);
  float fine = hash(gl_FragCoord.xy * 1.37 + 8.4);
  float soft = noise(gl_FragCoord.xy * 0.42);
  float speckle = smoothstep(0.74, 1.0, hash(gl_FragCoord.xy * 0.83 + vec2(71.2)));
  float film = mix(grain, soft, smoothstep(0.5, 1.5, uNoiseStyle));
  film = mix(film, max(fine, speckle), smoothstep(1.5, 2.0, uNoiseStyle));
  color += (film - 0.5) * uNoiseIntensity;
  color *= 1.0 - soft * uNoiseIntensity * 0.12;
  float vignette = smoothstep(1.08, 0.18, length(p));
  color = mix(color * 0.94, color, vignette);
  gl_FragColor = vec4(color, 1.0);
}
`;

const DEFAULT_COLORS: [number, number, number][] = [
	[0.984, 0.357, 0.365],
	[0.988, 0.576, 0.373],
	[0.996, 0.792, 0.439],
	[0.459, 0.816, 0.875],
	[0.165, 0.212, 0.333],
];
const DEFAULT_COLORS_FLAT = new Float32Array(DEFAULT_COLORS.flat());
const EMPTY_RIPPLE = Object.freeze({ x: 0, y: 0, t: -1, seed: 0 });

type ClickRipple = { x: number; y: number; t: number; seed: number };

export const WEBGL_RIPPLE_GRADIENT_DEFAULTS = {
	noiseIntensity: 0.06,
	noiseStyle: 1.4,
	ripple: 1.0,
	depth: 1.0,
	speed: 1.0,
	thickness: 1.0,
	speedField: 1.0,
	rippleCount: 4.0,
	chromatic: 1.0,
	nestedMode: 1.0,
	glassRadius: 48.0,
	maxClickRipples: MAX_CLICK_RIPPLES,
	rippleLifetime: 6.0,
} as const;

export type WebGLRippleGradientCanvasProps = {
	className?: string;
	noiseIntensity?: number;
	noiseStyle?: number;
	ripple?: number;
	depth?: number;
	speed?: number;
	thickness?: number;
	speedField?: number;
	rippleCount?: number;
	chromatic?: number;
	nestedMode?: number;
	glassRadius?: number;
	maxClickRipples?: number;
	rippleLifetime?: number;
};

export function WebGLRippleGradientCanvas({
	className,
	noiseIntensity = WEBGL_RIPPLE_GRADIENT_DEFAULTS.noiseIntensity,
	noiseStyle = WEBGL_RIPPLE_GRADIENT_DEFAULTS.noiseStyle,
	ripple = WEBGL_RIPPLE_GRADIENT_DEFAULTS.ripple,
	depth = WEBGL_RIPPLE_GRADIENT_DEFAULTS.depth,
	speed = WEBGL_RIPPLE_GRADIENT_DEFAULTS.speed,
	thickness = WEBGL_RIPPLE_GRADIENT_DEFAULTS.thickness,
	speedField = WEBGL_RIPPLE_GRADIENT_DEFAULTS.speedField,
	rippleCount = WEBGL_RIPPLE_GRADIENT_DEFAULTS.rippleCount,
	chromatic = WEBGL_RIPPLE_GRADIENT_DEFAULTS.chromatic,
	nestedMode = WEBGL_RIPPLE_GRADIENT_DEFAULTS.nestedMode,
	glassRadius = WEBGL_RIPPLE_GRADIENT_DEFAULTS.glassRadius,
	maxClickRipples = WEBGL_RIPPLE_GRADIENT_DEFAULTS.maxClickRipples,
	rippleLifetime = WEBGL_RIPPLE_GRADIENT_DEFAULTS.rippleLifetime,
}: WebGLRippleGradientCanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const startTimeRef = useRef(0);
	const rafRef = useRef(0);
	const clickRipplesRef = useRef<ClickRipple[]>([]);
	const clickRippleUniformRef = useRef(
		new Float32Array(MAX_CLICK_RIPPLES * 4).fill(0),
	);

	useEffect(() => {
		const cappedMaxClickRipples = Math.min(
			MAX_CLICK_RIPPLES,
			Math.max(0, Math.floor(maxClickRipples)),
		);
		const canvas = canvasRef.current;
		if (!canvas) return;

		const gl = getWebGLContext(canvas);
		if (!gl) return;

		const program = createProgram(gl, FULLSCREEN_VS, FS);
		if (!program) return;

		const uResolution = gl.getUniformLocation(program, "uResolution");
		const uTime = gl.getUniformLocation(program, "uTime");
		const uColors = gl.getUniformLocation(program, "uColors");
		const uNoiseIntensity = gl.getUniformLocation(program, "uNoiseIntensity");
		const uNoiseStyle = gl.getUniformLocation(program, "uNoiseStyle");
		const uRipple = gl.getUniformLocation(program, "uRipple");
		const uDepth = gl.getUniformLocation(program, "uDepth");
		const uSpeed = gl.getUniformLocation(program, "uSpeed");
		const uThickness = gl.getUniformLocation(program, "uThickness");
		const uSpeedField = gl.getUniformLocation(program, "uSpeedField");
		const uRippleCount = gl.getUniformLocation(program, "uRippleCount");
		const uChromatic = gl.getUniformLocation(program, "uChromatic");
		const uNestedMode = gl.getUniformLocation(program, "uNestedMode");
		const uGlassRadius = gl.getUniformLocation(program, "uGlassRadius");
		const uClickRipples = gl.getUniformLocation(program, "uClickRipples");

		const buf = createFullscreenTriangleBuffer(gl);
		if (!buf) {
			gl.deleteProgram(program);
			return;
		}

		startTimeRef.current = performance.now() / 1000;

		// Uniforms that don't change frame-to-frame.
		// biome-ignore lint/correctness/useHookAtTopLevel: not a hook
		gl.useProgram(program);
		if (uColors) gl.uniform3fv(uColors, DEFAULT_COLORS_FLAT);
		if (uNoiseIntensity) gl.uniform1f(uNoiseIntensity, noiseIntensity);
		if (uNoiseStyle) gl.uniform1f(uNoiseStyle, noiseStyle);
		if (uRipple) gl.uniform1f(uRipple, ripple);
		if (uDepth) gl.uniform1f(uDepth, depth);
		if (uSpeed) gl.uniform1f(uSpeed, speed);
		if (uThickness) gl.uniform1f(uThickness, thickness);
		if (uSpeedField) gl.uniform1f(uSpeedField, speedField);
		if (uRippleCount) gl.uniform1f(uRippleCount, rippleCount);
		if (uChromatic) gl.uniform1f(uChromatic, chromatic);
		if (uNestedMode) gl.uniform1f(uNestedMode, nestedMode);
		if (uGlassRadius) gl.uniform1f(uGlassRadius, glassRadius);

		const draw = (now: number) => {
			gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);
			// biome-ignore lint/correctness/useHookAtTopLevel: not a hook
			gl.useProgram(program);
			setResolutionUniform(gl, uResolution);

			if (uTime) gl.uniform1f(uTime, now);

			if (uClickRipples) {
				const clickUniform = clickRippleUniformRef.current;
				for (let i = 0; i < MAX_CLICK_RIPPLES; i++) {
					const ripple = clickRipplesRef.current[i] ?? EMPTY_RIPPLE;
					const base = i * 4;
					clickUniform[base] = ripple.x;
					clickUniform[base + 1] = ripple.y;
					clickUniform[base + 2] = ripple.t;
					clickUniform[base + 3] = ripple.seed;
				}
				gl.uniform4fv(uClickRipples, clickUniform);
			}

			drawFullscreenTriangle(gl, program, buf);
		};

		const loop = () => {
			const now = performance.now() / 1000 - startTimeRef.current;
			const ripples = clickRipplesRef.current;
			let nextIndex = 0;
			for (let i = 0; i < ripples.length; i++) {
				if (now - ripples[i].t < rippleLifetime) {
					ripples[nextIndex] = ripples[i];
					nextIndex += 1;
				}
			}
			ripples.length = nextIndex;
			draw(now);
			rafRef.current = requestAnimationFrame(loop);
		};

		const addClickRipple = (event: PointerEvent) => {
			const rect = canvas.getBoundingClientRect();
			const x = (event.clientX - rect.left) / rect.width;
			const y = 1 - (event.clientY - rect.top) / rect.height;
			const t = performance.now() / 1000 - startTimeRef.current;

			clickRipplesRef.current.unshift({
				x: x * 2 - 1,
				y: y * 2 - 1,
				t,
				seed: Math.random() * 1000,
			});
			clickRipplesRef.current = clickRipplesRef.current.slice(
				0,
				cappedMaxClickRipples,
			);
		};

		const disconnectResize = observeCanvasPixelSize(canvas, () => {});
		canvas.addEventListener("pointerdown", addClickRipple);
		loop();

		return () => {
			disconnectResize();
			canvas.removeEventListener("pointerdown", addClickRipple);
			cancelAnimationFrame(rafRef.current);
			gl.deleteBuffer(buf);
			gl.deleteProgram(program);
		};
	}, [
		noiseIntensity,
		noiseStyle,
		ripple,
		depth,
		speed,
		thickness,
		speedField,
		rippleCount,
		chromatic,
		nestedMode,
		glassRadius,
		maxClickRipples,
		rippleLifetime,
	]);

	return <canvas ref={canvasRef} className={className} style={CANVAS_STYLE} />;
}
