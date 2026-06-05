"use client";

import type { StaticImageData } from "next/image";
import { useEffect, useRef, useState } from "react";
import {
	CANVAS_STYLE,
	createFullscreenTriangleBuffer,
	createProgram,
	createScheduledDraw,
	drawFullscreenTriangle,
	FULLSCREEN_VS,
	getCanvasPixelSize,
	getOptimizedImageSrc,
	getWebGLContext,
	loadImage,
	observeCanvasPixelSize,
	setResolutionUniform,
	uploadTextureFromImage,
} from "@/lib/webgl";
import { CanvasLoader } from "@/components/canvas-loader";

export const WEBGL_CMYK_DEFAULTS = {
	pixelSize: 24,
	dotSize: 0.25,
	cyanStrength: 0.95,
	magentaStrength: 0.95,
	yellowStrength: 0.95,
	blackStrength: 1.1,
	angleC: 15,
	angleM: 45,
	angleY: 0,
	angleK: 75,
	quality: 75,
} as const;

export type WebGLCmykCanvasProps = {
	className?: string;
	/** Source image converted to CMYK halftone. */
	image: StaticImageData;
	/** Halftone cell size in screen pixels. Defaults to 8. */
	pixelSize?: number;
	/** Max dot radius within each cell (0–1). Defaults to 0.5. */
	dotSize?: number;
	/** Cyan channel dot strength. Defaults to 0.95. */
	cyanStrength?: number;
	/** Magenta channel dot strength. Defaults to 0.95. */
	magentaStrength?: number;
	/** Yellow channel dot strength. Defaults to 0.95. */
	yellowStrength?: number;
	/** Black channel dot strength. Defaults to 1.1. */
	blackStrength?: number;
	/** Cyan screen angle in degrees. Defaults to 15. */
	angleC?: number;
	/** Magenta screen angle in degrees. Defaults to 45. */
	angleM?: number;
	/** Yellow screen angle in degrees. Defaults to 0. */
	angleY?: number;
	/** Black screen angle in degrees. Defaults to 75. */
	angleK?: number;
	/** Quality passed to the Next.js image optimizer. Defaults to 75. */
	quality?: number;
};

type CmykConfig = {
	pixelSize: number;
	dotSize: number;
	cyanStrength: number;
	magentaStrength: number;
	yellowStrength: number;
	blackStrength: number;
	angleC: number;
	angleM: number;
	angleY: number;
	angleK: number;
};

const FS = `
#extension GL_OES_standard_derivatives : enable
precision mediump float;
varying vec2 vUv;
uniform vec2 uResolution;
uniform float uPixelSize;
uniform float uDotSize;
uniform float uCyanStrength;
uniform float uMagentaStrength;
uniform float uYellowStrength;
uniform float uBlackStrength;
uniform float uAngleC;
uniform float uAngleM;
uniform float uAngleY;
uniform float uAngleK;
uniform sampler2D uTexture;

mat2 rot(float deg) {
  float a = radians(deg);
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}

vec2 toGridUV(vec2 uv, float angleDeg) {
  return rot(angleDeg) * (uv * uResolution) / uPixelSize;
}

vec2 getCellCenterUV(vec2 uv, float angleDeg) {
  vec2 gridUV = toGridUV(uv, angleDeg);
  vec2 cellCenter = floor(gridUV) + 0.5;
  vec2 centerScreen = rot(-angleDeg) * cellCenter * uPixelSize;
  return centerScreen / uResolution;
}

float halftoneDot(vec2 uv, float angleDeg, float coverage) {
  vec2 gridUV = toGridUV(uv, angleDeg);
  vec2 gv = fract(gridUV) - 0.5;
  float r = uDotSize * sqrt(clamp(coverage, 0.0, 1.0));
  float aa = fwidth(length(gv));
  float d = length(gv);
  return 1.0 - smoothstep(r - aa, r + aa, d);
}

vec4 RGBtoCMYK(vec3 rgb) {
  float r = rgb.r;
  float g = rgb.g;
  float b = rgb.b;
  float k = min(1.0 - r, min(1.0 - g, 1.0 - b));
  vec3 cmy = vec3(0.0);
  float invK = 1.0 - k;

  if (invK != 0.0) {
    cmy.x = (1.0 - r - k) / invK;
    cmy.y = (1.0 - g - k) / invK;
    cmy.z = (1.0 - b - k) / invK;
  }

  return clamp(vec4(cmy, k), 0.0, 1.0);
}

void main() {
  vec2 uv = vUv;

  vec2 uvC = getCellCenterUV(uv, uAngleC);
  vec2 uvM = getCellCenterUV(uv, uAngleM);
  vec2 uvY = getCellCenterUV(uv, uAngleY);
  vec2 uvK = getCellCenterUV(uv, uAngleK);

  vec4 cmykC = RGBtoCMYK(texture2D(uTexture, uvC).rgb);
  vec4 cmykM = RGBtoCMYK(texture2D(uTexture, uvM).rgb);
  vec4 cmykY = RGBtoCMYK(texture2D(uTexture, uvY).rgb);
  vec4 cmykK = RGBtoCMYK(texture2D(uTexture, uvK).rgb);

  float dotC = halftoneDot(uv, uAngleC, cmykC.x);
  float dotM = halftoneDot(uv, uAngleM, cmykM.y);
  float dotY = halftoneDot(uv, uAngleY, cmykY.z);
  float dotK = halftoneDot(uv, uAngleK, cmykK.w);

  vec3 outColor = vec3(1.0);
  outColor.r *= (1.0 - uCyanStrength * dotC);
  outColor.g *= (1.0 - uMagentaStrength * dotM);
  outColor.b *= (1.0 - uYellowStrength * dotY);
  outColor *= (1.0 - uBlackStrength * dotK);

  gl_FragColor = vec4(outColor, 1.0);
}
`;

/**
 * CMYK halftone print effect with per-channel screen angles.
 */
export function WebGLCmykCanvas({
	className,
	image,
	pixelSize = WEBGL_CMYK_DEFAULTS.pixelSize,
	dotSize = WEBGL_CMYK_DEFAULTS.dotSize,
	cyanStrength = WEBGL_CMYK_DEFAULTS.cyanStrength,
	magentaStrength = WEBGL_CMYK_DEFAULTS.magentaStrength,
	yellowStrength = WEBGL_CMYK_DEFAULTS.yellowStrength,
	blackStrength = WEBGL_CMYK_DEFAULTS.blackStrength,
	angleC = WEBGL_CMYK_DEFAULTS.angleC,
	angleM = WEBGL_CMYK_DEFAULTS.angleM,
	angleY = WEBGL_CMYK_DEFAULTS.angleY,
	angleK = WEBGL_CMYK_DEFAULTS.angleK,
	quality = WEBGL_CMYK_DEFAULTS.quality,
}: WebGLCmykCanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const drawRef = useRef<(() => void) | null>(null);
	const invalidate = useRef(createScheduledDraw(drawRef));
	const [isLoadingTexture, setIsLoadingTexture] = useState(false);
	const configRef = useRef<CmykConfig>({
		pixelSize,
		dotSize,
		cyanStrength,
		magentaStrength,
		yellowStrength,
		blackStrength,
		angleC,
		angleM,
		angleY,
		angleK,
	});

	useEffect(() => {
		configRef.current = {
			pixelSize,
			dotSize,
			cyanStrength,
			magentaStrength,
			yellowStrength,
			blackStrength,
			angleC,
			angleM,
			angleY,
			angleK,
		};

		invalidate.current();
	}, [
		pixelSize,
		dotSize,
		cyanStrength,
		magentaStrength,
		yellowStrength,
		blackStrength,
		angleC,
		angleM,
		angleY,
		angleK,
	]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		let cancelled = false;
		let program: WebGLProgram | null = null;
		let buf: WebGLBuffer | null = null;
		let texture: WebGLTexture | null = null;
		let textureLoadId = 0;
		let loadedTextureSize = { w: 0, h: 0 };

		const gl = getWebGLContext(canvas);
		if (!gl) return;

		gl.getExtension("OES_standard_derivatives");

		const reloadTexture = async (w: number, h: number) => {
			if (w <= 0 || h <= 0) return;

			const loadId = ++textureLoadId;
			setIsLoadingTexture(true);
			const src = getOptimizedImageSrc(image, w, h, quality);
			let imageElement: HTMLImageElement;
			try {
				imageElement = await loadImage(src);
			} finally {
				// Only clear loading for the latest request (avoid flicker on resize).
				if (!cancelled && loadId === textureLoadId) setIsLoadingTexture(false);
			}
			if (cancelled || loadId !== textureLoadId) return;

			if (texture) gl.deleteTexture(texture);
			texture = uploadTextureFromImage(gl, imageElement);
			loadedTextureSize = { w, h };
			invalidate.current();
		};

		program = createProgram(gl, FULLSCREEN_VS, FS);
		if (!program) return;

		const uResolution = gl.getUniformLocation(program, "uResolution");
		const uPixelSizeLoc = gl.getUniformLocation(program, "uPixelSize");
		const uDotSizeLoc = gl.getUniformLocation(program, "uDotSize");
		const uCyanStrengthLoc = gl.getUniformLocation(program, "uCyanStrength");
		const uMagentaStrengthLoc = gl.getUniformLocation(
			program,
			"uMagentaStrength",
		);
		const uYellowStrengthLoc = gl.getUniformLocation(
			program,
			"uYellowStrength",
		);
		const uBlackStrengthLoc = gl.getUniformLocation(program, "uBlackStrength");
		const uAngleCLoc = gl.getUniformLocation(program, "uAngleC");
		const uAngleMLoc = gl.getUniformLocation(program, "uAngleM");
		const uAngleYLoc = gl.getUniformLocation(program, "uAngleY");
		const uAngleKLoc = gl.getUniformLocation(program, "uAngleK");
		const uTextureLoc = gl.getUniformLocation(program, "uTexture");

		buf = createFullscreenTriangleBuffer(gl);
		if (!buf) {
			gl.deleteProgram(program);
			return;
		}

		const draw = () => {
			if (!texture) return;

			const config = configRef.current;
			gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
			gl.clearColor(1, 1, 1, 1);
			gl.clear(gl.COLOR_BUFFER_BIT);
			// biome-ignore lint/correctness/useHookAtTopLevel: not a hook
			gl.useProgram(program);
			setResolutionUniform(gl, uResolution);
			if (uPixelSizeLoc) gl.uniform1f(uPixelSizeLoc, config.pixelSize);
			if (uDotSizeLoc) gl.uniform1f(uDotSizeLoc, config.dotSize);
			if (uCyanStrengthLoc) gl.uniform1f(uCyanStrengthLoc, config.cyanStrength);
			if (uMagentaStrengthLoc)
				gl.uniform1f(uMagentaStrengthLoc, config.magentaStrength);
			if (uYellowStrengthLoc)
				gl.uniform1f(uYellowStrengthLoc, config.yellowStrength);
			if (uBlackStrengthLoc)
				gl.uniform1f(uBlackStrengthLoc, config.blackStrength);
			if (uAngleCLoc) gl.uniform1f(uAngleCLoc, config.angleC);
			if (uAngleMLoc) gl.uniform1f(uAngleMLoc, config.angleM);
			if (uAngleYLoc) gl.uniform1f(uAngleYLoc, config.angleY);
			if (uAngleKLoc) gl.uniform1f(uAngleKLoc, config.angleK);

			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, texture);
			if (uTextureLoc) gl.uniform1i(uTextureLoc, 0);

			drawFullscreenTriangle(gl, program, buf);
		};

		drawRef.current = draw;

		const disconnectResize = observeCanvasPixelSize(canvas, (size) => {
			const sizeChanged =
				size.w !== loadedTextureSize.w || size.h !== loadedTextureSize.h;

			if (sizeChanged) {
				reloadTexture(size.w, size.h);
			} else {
				invalidate.current();
			}
		});

		const { w, h } = getCanvasPixelSize(canvas);
		if (w > 0 && h > 0) reloadTexture(w, h);

		return () => {
			cancelled = true;
			setIsLoadingTexture(false);
			disconnectResize();
			drawRef.current = null;
			if (buf) gl.deleteBuffer(buf);
			if (texture) gl.deleteTexture(texture);
			if (program) gl.deleteProgram(program);
		};
	}, [image, quality]);

	return (
		<div className="relative h-full w-full">
			<canvas ref={canvasRef} className={className} style={CANVAS_STYLE} />
			<CanvasLoader active={isLoadingTexture} />
		</div>
	);
}
