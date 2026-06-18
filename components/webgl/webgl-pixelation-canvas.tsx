"use client";

import {
  type MotionValue,
  useMotionValue,
  useMotionValueEvent,
} from "motion/react";
import type { StaticImageData } from "next/image";
import { useEffect, useRef, useState } from "react";
import { CanvasLoader } from "@/components/canvas-loader";
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
  snapPixelCellSize,
  uploadTextureFromImage,
} from "@/lib/webgl";

export const WEBGL_PIXELATION_DEFAULTS = {
  pixelSize: 64,
  radius: 1,
  quality: 75,
} as const;

export type WebGLPixelationCanvasProps = {
  className?: string;
  /** Source image sampled into the pixel grid. */
  image: StaticImageData;
  /** Size of each pixel cell in screen pixels. Defaults to 64. */
  pixelSize?: number | MotionValue<number>;
  /** Dot radius in cell UV space (0–1). Defaults to 1. */
  radius?: number | MotionValue<number>;
  /** Quality passed to the Next.js image optimizer. Defaults to 75. */
  quality?: number;
};

type PixelationConfig = {
  pixelSize: number;
  radius: number;
};

function useScheduleOnMotionValue(
  source: MotionValue<number> | undefined,
  schedule: () => void,
) {
  const idle = useMotionValue(0);
  const target = source ?? idle;

  useMotionValueEvent(target, "change", () => {
    if (source) schedule();
  });
}

const FS = `
precision mediump float;
varying vec2 vUv;
uniform vec2 uResolution;
uniform vec2 uPixelSize;
uniform float uRadius;
uniform sampler2D uTexture;

vec2 hexCellCenter(vec2 cellIndex) {
  return vec2(
    cellIndex.x + 0.5,
    cellIndex.y + 0.5 + 0.5 * mod(cellIndex.x, 2.0)
  );
}

void main() {
  vec2 uv = vUv;
  vec2 normalizedPixelSize = uPixelSize / uResolution;
  float col = floor(uv.x / normalizedPixelSize.x);

  // Odd columns use a grid shifted down by half a cell.
  vec2 gridUv = uv;
  if (mod(col, 2.0) >= 0.5) {
    gridUv.y -= 0.5 * normalizedPixelSize.y;
  }

  vec2 cellIndex = floor(gridUv / normalizedPixelSize);
  vec2 uvPixel = normalizedPixelSize * cellIndex;

  vec4 color = texture2D(uTexture, uvPixel);

  vec2 cellUv = fract(gridUv / normalizedPixelSize);
  float dist = length(cellUv - 0.5);

  float circle = smoothstep(uRadius - 0.01, uRadius + 0.01, dist);

  color = mix(color, vec4(0.0, 0.0, 0.0, 1.0), circle);
  gl_FragColor = color;
}
`;

/**
 * Pixelates a texture on a grid and masks each cell with a circular dot
 * (black outside the radius).
 */
export function WebGLPixelationCanvas({
  className,
  image,
  pixelSize = WEBGL_PIXELATION_DEFAULTS.pixelSize,
  radius = WEBGL_PIXELATION_DEFAULTS.radius,
  quality = WEBGL_PIXELATION_DEFAULTS.quality,
}: WebGLPixelationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef<(() => void) | null>(null);
  const invalidate = useRef(createScheduledDraw(drawRef));
  const configRef = useRef<PixelationConfig>({
    pixelSize: typeof pixelSize === "number" ? pixelSize : pixelSize.get(),
    radius: typeof radius === "number" ? radius : radius.get(),
  });
  const [isLoadingTexture, setIsLoadingTexture] = useState(false);

  const pixelSizePropRef = useRef(pixelSize);
  const radiusPropRef = useRef(radius);
  const pixelSizeMotion = typeof pixelSize === "number" ? undefined : pixelSize;
  const radiusMotion = typeof radius === "number" ? undefined : radius;

  useEffect(() => {
    pixelSizePropRef.current = pixelSize;
    radiusPropRef.current = radius;
  }, [pixelSize, radius]);

  useEffect(() => {
    const nextPixelSize = typeof pixelSize === "number" ? pixelSize : null;
    const nextRadius = typeof radius === "number" ? radius : null;
    if (nextPixelSize === null && nextRadius === null) return;

    configRef.current = {
      pixelSize: nextPixelSize ?? configRef.current.pixelSize,
      radius: nextRadius ?? configRef.current.radius,
    };
    invalidate.current();
  }, [pixelSize, radius]);

  useScheduleOnMotionValue(pixelSizeMotion, () => invalidate.current());
  useScheduleOnMotionValue(radiusMotion, () => invalidate.current());

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
    const uRadiusLoc = gl.getUniformLocation(program, "uRadius");
    const uTextureLoc = gl.getUniformLocation(program, "uTexture");

    buf = createFullscreenTriangleBuffer(gl);
    if (!buf) {
      gl.deleteProgram(program);
      return;
    }

    const draw = () => {
      if (!texture) return;

      const pixelSizeProp = pixelSizePropRef.current;
      const radiusProp = radiusPropRef.current;
      const pixelSizeTarget =
        typeof pixelSizeProp === "number"
          ? configRef.current.pixelSize
          : pixelSizeProp.get();
      const radiusTarget =
        typeof radiusProp === "number"
          ? configRef.current.radius
          : radiusProp.get();

      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      // biome-ignore lint/correctness/useHookAtTopLevel: not a hook
      gl.useProgram(program);
      setResolutionUniform(gl, uResolution);
      if (uPixelSizeLoc) {
        const w = gl.drawingBufferWidth;
        const h = gl.drawingBufferHeight;
        gl.uniform2f(
          uPixelSizeLoc,
          snapPixelCellSize(w, pixelSizeTarget),
          snapPixelCellSize(h, pixelSizeTarget),
        );
      }
      if (uRadiusLoc) gl.uniform1f(uRadiusLoc, radiusTarget);

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
