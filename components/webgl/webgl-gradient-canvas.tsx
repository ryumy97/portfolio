"use client";

import type { MotionValue } from "motion";
import { useMotionValueEvent } from "motion/react";
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

const FS = `
precision mediump float;
varying vec2 vUv;
uniform vec2 u_resolution;
uniform float u_pixelSize;
uniform float u_radius;
uniform float u_progress;

float clampGradient(float x) {
	return clamp(x, 0.0, 1.0);
}

void main() {
	vec2 uv = vUv;
	vec2 normalizedPixelSize = u_pixelSize / u_resolution;

	float thickness = 0.3;
	float xProgress = mix(0.0, 1.0 / thickness, uv.x - mix(1.0, -thickness, u_progress));
	float yProgress = mix(0.0, 1.0 / thickness, uv.y - mix(1.0, -thickness, u_progress));
	float gradient = 1.0 - clampGradient((xProgress + yProgress) * 0.5);

	vec2 cellUv = fract(uv / normalizedPixelSize);
	float dist = length(cellUv - 0.5);

	float circle = 1.0 - smoothstep((u_radius - 0.01) * gradient, (u_radius + 0.01) * gradient, dist);

	vec3 color = mix(vec3(0.0), vec3(0.969, 0.365, 0.365), clampGradient(u_progress * 2.0));

	gl_FragColor = vec4(color, circle);
}
`;

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

    const gl = getWebGLContext(canvas);
    if (!gl) return;

    const program = createProgram(gl, FULLSCREEN_VS, FS);
    if (!program) return;

    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uPixelSizeLoc = gl.getUniformLocation(program, "u_pixelSize");
    const uRadiusLoc = gl.getUniformLocation(program, "u_radius");
    const uProgressLoc = gl.getUniformLocation(program, "u_progress");
    const buf = createFullscreenTriangleBuffer(gl);
    if (!buf) {
      gl.deleteProgram(program);
      return;
    }

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const draw = () => {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      // biome-ignore lint/correctness/useHookAtTopLevel: not a hook
      gl.useProgram(program);
      setResolutionUniform(gl, uResolution);
      if (uPixelSizeLoc) gl.uniform1f(uPixelSizeLoc, halftonePixelSize);
      if (uRadiusLoc) gl.uniform1f(uRadiusLoc, halftoneRadius);
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
  }, [halftonePixelSize, halftoneRadius]);

  useMotionValueEvent(progress, "change", (value) => {
    progressRef.current = value;
    drawRef.current?.();
  });

  return <canvas ref={canvasRef} className={className} style={CANVAS_STYLE} />;
}
