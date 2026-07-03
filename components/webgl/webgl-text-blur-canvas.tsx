"use client";

import { useEffect, useRef } from "react";
import {
  BLUR_MASK_MIX_FS,
  COMPOSITE_FS,
  KAWASE_BLUR_FS,
  NOISE_BLUR_H_FS,
  NOISE_BLUR_V_FS,
  NOISE_MAP_FS,
} from "@/app/lab/thermal-blur/lib/shaders";
import { createTextCanvas } from "@/app/lab/thermal-blur/lib/text-texture";
import {
  bindFramebuffer,
  CANVAS_STYLE,
  createFramebuffer,
  createFullscreenTriangleBuffer,
  createProgram,
  deleteFramebuffer,
  drawFullscreenTriangle,
  type FramebufferTarget,
  FULLSCREEN_VS,
  getWebGLContext,
  observeCanvasPixelSize,
  resizeFramebuffer,
  updateTextureFromCanvas,
  uploadTextureFromCanvas,
} from "@/lib/webgl";

type DebugPass = "noise" | "kawase" | "maskMix" | "composite";

const PASS_THROUGH_FS = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTexture;

void main() {
  float value = texture2D(uTexture, vUv).r;
  gl_FragColor = vec4(vec3(value), 1.0);
}
`;

const KAWASE_PASS_COUNT = 8;
const KAWASE_PASS_SCALES = Array.from(
  { length: KAWASE_PASS_COUNT },
  (_, index) => 0.4 + (index / (KAWASE_PASS_COUNT - 1)) * 2.0,
);

export const WEBGL_THERMAL_BLUR_DEFAULTS = {
  text: "Thermal",
  blur: 5,
  drip: 1.2,
  speed: 0.85,
  noiseScale: 4,
  blurThreshold: 0.38,
  blurSoftness: 0.18,
  pointerRadius: 0.06,
  pointerStrength: 0.9,
  pointerLerp: 5,
} as const;

export type WebGLTextBlurCanvasProps = {
  className?: string;
  text?: string;
  blur?: number;
  drip?: number;
  speed?: number;
  noiseScale?: number;
  blurThreshold?: number;
  blurSoftness?: number;
  pointerRadius?: number;
  pointerStrength?: number;
  pointerLerp?: number;
  debug?: boolean;
};

type ThermalBlurConfig = {
  text: string;
  blur: number;
  drip: number;
  speed: number;
  noiseScale: number;
  blurThreshold: number;
  blurSoftness: number;
  pointerRadius: number;
  pointerStrength: number;
  pointerLerp: number;
};

type PointerState = {
  x: number;
  y: number;
};

type NoiseMapProgram = {
  program: WebGLProgram;
  uResolution: WebGLUniformLocation | null;
  uTime: WebGLUniformLocation | null;
  uNoiseScale: WebGLUniformLocation | null;
  uMouse: WebGLUniformLocation | null;
  uPointerRadius: WebGLUniformLocation | null;
  uPointerStrength: WebGLUniformLocation | null;
};

type CompositeProgram = {
  program: WebGLProgram;
  uTexture: WebGLUniformLocation | null;
};

type PreviewProgram = {
  program: WebGLProgram;
  uTexture: WebGLUniformLocation | null;
};

type NoiseBlurProgram = {
  program: WebGLProgram;
  uResolution: WebGLUniformLocation | null;
  uTexture: WebGLUniformLocation | null;
};

type KawaseBlurProgram = {
  program: WebGLProgram;
  uResolution: WebGLUniformLocation | null;
  uTexture: WebGLUniformLocation | null;
  uOffset: WebGLUniformLocation | null;
  uAngle: WebGLUniformLocation | null;
};

type MaskMixProgram = {
  program: WebGLProgram;
  uResolution: WebGLUniformLocation | null;
  uTexture: WebGLUniformLocation | null;
  uBlurred: WebGLUniformLocation | null;
  uNoiseMap: WebGLUniformLocation | null;
  uTime: WebGLUniformLocation | null;
  uDrip: WebGLUniformLocation | null;
  uBlurThreshold: WebGLUniformLocation | null;
  uBlurSoftness: WebGLUniformLocation | null;
};

function getNoiseMapUniforms(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
): NoiseMapProgram {
  return {
    program,
    uResolution: gl.getUniformLocation(program, "uResolution"),
    uTime: gl.getUniformLocation(program, "uTime"),
    uNoiseScale: gl.getUniformLocation(program, "uNoiseScale"),
    uMouse: gl.getUniformLocation(program, "uMouse"),
    uPointerRadius: gl.getUniformLocation(program, "uPointerRadius"),
    uPointerStrength: gl.getUniformLocation(program, "uPointerStrength"),
  };
}

function getCompositeUniforms(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
): CompositeProgram {
  return {
    program,
    uTexture: gl.getUniformLocation(program, "uTexture"),
  };
}

function getPreviewUniforms(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
): PreviewProgram {
  return {
    program,
    uTexture: gl.getUniformLocation(program, "uTexture"),
  };
}

function getNoiseBlurUniforms(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
): NoiseBlurProgram {
  return {
    program,
    uResolution: gl.getUniformLocation(program, "uResolution"),
    uTexture: gl.getUniformLocation(program, "uTexture"),
  };
}

function getKawaseUniforms(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
): KawaseBlurProgram {
  return {
    program,
    uResolution: gl.getUniformLocation(program, "uResolution"),
    uTexture: gl.getUniformLocation(program, "uTexture"),
    uOffset: gl.getUniformLocation(program, "uOffset"),
    uAngle: gl.getUniformLocation(program, "uAngle"),
  };
}

function getMaskMixUniforms(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
): MaskMixProgram {
  return {
    program,
    uResolution: gl.getUniformLocation(program, "uResolution"),
    uTexture: gl.getUniformLocation(program, "uTexture"),
    uBlurred: gl.getUniformLocation(program, "uBlurred"),
    uNoiseMap: gl.getUniformLocation(program, "uNoiseMap"),
    uTime: gl.getUniformLocation(program, "uTime"),
    uDrip: gl.getUniformLocation(program, "uDrip"),
    uBlurThreshold: gl.getUniformLocation(program, "uBlurThreshold"),
    uBlurSoftness: gl.getUniformLocation(program, "uBlurSoftness"),
  };
}

export function WebGLTextBlurCanvas({
  className,
  text = WEBGL_THERMAL_BLUR_DEFAULTS.text,
  blur = WEBGL_THERMAL_BLUR_DEFAULTS.blur,
  drip = WEBGL_THERMAL_BLUR_DEFAULTS.drip,
  speed = WEBGL_THERMAL_BLUR_DEFAULTS.speed,
  noiseScale = WEBGL_THERMAL_BLUR_DEFAULTS.noiseScale,
  blurThreshold = WEBGL_THERMAL_BLUR_DEFAULTS.blurThreshold,
  blurSoftness = WEBGL_THERMAL_BLUR_DEFAULTS.blurSoftness,
  pointerRadius = WEBGL_THERMAL_BLUR_DEFAULTS.pointerRadius,
  pointerStrength = WEBGL_THERMAL_BLUR_DEFAULTS.pointerStrength,
  pointerLerp = WEBGL_THERMAL_BLUR_DEFAULTS.pointerLerp,
  debug = false,
}: WebGLTextBlurCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const noiseCanvasRef = useRef<HTMLCanvasElement>(null);
  const kawaseCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskMixCanvasRef = useRef<HTMLCanvasElement>(null);
  const compositeCanvasRef = useRef<HTMLCanvasElement>(null);
  const startTimeRef = useRef(0);
  const rafRef = useRef(0);
  const pointerRef = useRef<PointerState>({ x: 0.5, y: 0.5 });
  const pointerTargetRef = useRef<PointerState>({ x: 0.5, y: 0.5 });
  const textCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const textTextureRef = useRef<WebGLTexture | null>(null);
  const configRef = useRef<ThermalBlurConfig>({
    text,
    blur,
    drip,
    speed,
    noiseScale,
    blurThreshold,
    blurSoftness,
    pointerRadius,
    pointerStrength,
    pointerLerp,
  });

  useEffect(() => {
    configRef.current = {
      text,
      blur,
      drip,
      speed,
      noiseScale,
      blurThreshold,
      blurSoftness,
      pointerRadius,
      pointerStrength,
      pointerLerp,
    };
  }, [
    text,
    blur,
    drip,
    speed,
    noiseScale,
    blurThreshold,
    blurSoftness,
    pointerRadius,
    pointerStrength,
    pointerLerp,
  ]);

  useEffect(() => {
    const previewPasses: Array<{
      pass: DebugPass;
      canvas: HTMLCanvasElement | null;
    }> = [
      { pass: "noise", canvas: noiseCanvasRef.current },
      { pass: "kawase", canvas: kawaseCanvasRef.current },
      { pass: "maskMix", canvas: maskMixCanvasRef.current },
      { pass: "composite", canvas: compositeCanvasRef.current },
    ];

    const activeCanvases = debug
      ? previewPasses.filter(
          (
            entry,
          ): entry is {
            pass: DebugPass;
            canvas: HTMLCanvasElement;
          } => entry.canvas !== null,
        )
      : canvasRef.current
        ? [{ pass: "composite" as const, canvas: canvasRef.current }]
        : [];

    if (activeCanvases.length === 0) return;

    let cancelled = false;
    startTimeRef.current = performance.now() / 1000;

    const renderers = activeCanvases
      .map(({ canvas, pass }) => {
        const gl = getWebGLContext(canvas);
        if (!gl) return null;

        const noiseMapProgram = createProgram(gl, FULLSCREEN_VS, NOISE_MAP_FS);
        const noiseBlurHProgram = createProgram(
          gl,
          FULLSCREEN_VS,
          NOISE_BLUR_H_FS,
        );
        const noiseBlurVProgram = createProgram(
          gl,
          FULLSCREEN_VS,
          NOISE_BLUR_V_FS,
        );
        const kawaseBlurProgram = createProgram(
          gl,
          FULLSCREEN_VS,
          KAWASE_BLUR_FS,
        );
        const maskMixProgram = createProgram(
          gl,
          FULLSCREEN_VS,
          BLUR_MASK_MIX_FS,
        );
        const compositeProgram = createProgram(gl, FULLSCREEN_VS, COMPOSITE_FS);
        const previewProgram = createProgram(
          gl,
          FULLSCREEN_VS,
          PASS_THROUGH_FS,
        );
        if (
          !noiseMapProgram ||
          !noiseBlurHProgram ||
          !noiseBlurVProgram ||
          !kawaseBlurProgram ||
          !maskMixProgram ||
          !compositeProgram ||
          !previewProgram
        ) {
          return null;
        }

        const noiseMap = getNoiseMapUniforms(gl, noiseMapProgram);
        const noiseBlurH = getNoiseBlurUniforms(gl, noiseBlurHProgram);
        const noiseBlurV = getNoiseBlurUniforms(gl, noiseBlurVProgram);
        const kawaseBlur = getKawaseUniforms(gl, kawaseBlurProgram);
        const maskMix = getMaskMixUniforms(gl, maskMixProgram);
        const composite = getCompositeUniforms(gl, compositeProgram);
        const preview = getPreviewUniforms(gl, previewProgram);

        const buf = createFullscreenTriangleBuffer(gl);
        if (!buf) return null;

        let width = 0;
        let height = 0;
        let fboNoise: FramebufferTarget | null = null;
        let fboNoiseSmooth: FramebufferTarget | null = null;
        let fboBlurH: FramebufferTarget | null = null;
        let fboHeat: FramebufferTarget | null = null;
        let textTexture: WebGLTexture | null = null;

        const ensureTargets = (w: number, h: number) => {
          if (w <= 0 || h <= 0) return;
          if (w === width && h === height) return;

          width = w;
          height = h;

          if (!fboNoise) fboNoise = createFramebuffer(gl, w, h);
          else resizeFramebuffer(gl, fboNoise, w, h);

          if (!fboNoiseSmooth) fboNoiseSmooth = createFramebuffer(gl, w, h);
          else resizeFramebuffer(gl, fboNoiseSmooth, w, h);

          if (!fboBlurH) fboBlurH = createFramebuffer(gl, w, h);
          else resizeFramebuffer(gl, fboBlurH, w, h);

          if (!fboHeat) fboHeat = createFramebuffer(gl, w, h);
          else resizeFramebuffer(gl, fboHeat, w, h);

          const textCanvas = createTextCanvas({
            text: configRef.current.text,
            width: w,
            height: h,
          });
          textCanvasRef.current = textCanvas;

          if (textTexture) {
            updateTextureFromCanvas(gl, textTexture, textCanvas);
          } else {
            textTexture = uploadTextureFromCanvas(gl, textCanvas);
          }
        };

        const bindTextureUnit = (
          unit: number,
          location: WebGLUniformLocation | null,
          texture: WebGLTexture,
        ) => {
          gl.activeTexture(gl.TEXTURE0 + unit);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          if (location) gl.uniform1i(location, unit);
        };

        const renderNoiseMap = (
          time: number,
          config: ThermalBlurConfig,
          pointer: PointerState,
        ) => {
          if (!fboNoise) return;

          bindFramebuffer(gl, fboNoise);
          gl.viewport(0, 0, fboNoise.width, fboNoise.height);
          gl.clearColor(0, 0, 0, 1);
          gl.clear(gl.COLOR_BUFFER_BIT);
          // biome-ignore lint/correctness/useHookAtTopLevel: WebGL API call, not React hook
          gl.useProgram(noiseMap.program);
          if (noiseMap.uResolution) {
            gl.uniform2f(noiseMap.uResolution, fboNoise.width, fboNoise.height);
          }
          if (noiseMap.uTime) gl.uniform1f(noiseMap.uTime, time);
          if (noiseMap.uNoiseScale) {
            gl.uniform1f(noiseMap.uNoiseScale, config.noiseScale);
          }
          if (noiseMap.uMouse)
            gl.uniform2f(noiseMap.uMouse, pointer.x, pointer.y);
          if (noiseMap.uPointerRadius) {
            gl.uniform1f(noiseMap.uPointerRadius, config.pointerRadius);
          }
          if (noiseMap.uPointerStrength) {
            gl.uniform1f(noiseMap.uPointerStrength, config.pointerStrength);
          }
          drawFullscreenTriangle(gl, noiseMap.program, buf);
        };

        const renderNoiseBlurPass = (
          target: FramebufferTarget,
          shader: NoiseBlurProgram,
          sourceTexture: WebGLTexture,
        ) => {
          bindFramebuffer(gl, target);
          gl.viewport(0, 0, target.width, target.height);
          gl.clearColor(0, 0, 0, 1);
          gl.clear(gl.COLOR_BUFFER_BIT);
          // biome-ignore lint/correctness/useHookAtTopLevel: WebGL API call, not React hook
          gl.useProgram(shader.program);
          if (shader.uResolution) {
            gl.uniform2f(shader.uResolution, target.width, target.height);
          }
          bindTextureUnit(0, shader.uTexture, sourceTexture);
          drawFullscreenTriangle(gl, shader.program, buf);
        };

        const renderSmoothedNoiseMap = () => {
          if (!fboNoise || !fboNoiseSmooth) return;

          renderNoiseBlurPass(fboNoiseSmooth, noiseBlurH, fboNoise.texture);
          renderNoiseBlurPass(fboNoise, noiseBlurV, fboNoiseSmooth.texture);
        };

        const renderKawasePass = (
          target: FramebufferTarget,
          sourceTexture: WebGLTexture,
          offset: number,
          angle: number,
        ) => {
          bindFramebuffer(gl, target);
          gl.viewport(0, 0, target.width, target.height);
          gl.clearColor(0, 0, 0, 1);
          gl.clear(gl.COLOR_BUFFER_BIT);
          // biome-ignore lint/correctness/useHookAtTopLevel: WebGL API call, not React hook
          gl.useProgram(kawaseBlur.program);
          if (kawaseBlur.uResolution) {
            gl.uniform2f(kawaseBlur.uResolution, target.width, target.height);
          }
          if (kawaseBlur.uOffset) gl.uniform1f(kawaseBlur.uOffset, offset);
          if (kawaseBlur.uAngle) gl.uniform1f(kawaseBlur.uAngle, angle);
          bindTextureUnit(0, kawaseBlur.uTexture, sourceTexture);
          drawFullscreenTriangle(gl, kawaseBlur.program, buf);
        };

        const renderMaskMix = (
          target: FramebufferTarget,
          config: ThermalBlurConfig,
          time: number,
          sharpTexture: WebGLTexture,
          blurredTexture: WebGLTexture,
          noiseTexture: WebGLTexture,
        ) => {
          bindFramebuffer(gl, target);
          gl.viewport(0, 0, target.width, target.height);
          gl.clearColor(0, 0, 0, 1);
          gl.clear(gl.COLOR_BUFFER_BIT);
          // biome-ignore lint/correctness/useHookAtTopLevel: WebGL API call, not React hook
          gl.useProgram(maskMix.program);
          if (maskMix.uResolution) {
            gl.uniform2f(maskMix.uResolution, target.width, target.height);
          }
          bindTextureUnit(0, maskMix.uTexture, sharpTexture);
          bindTextureUnit(1, maskMix.uBlurred, blurredTexture);
          bindTextureUnit(2, maskMix.uNoiseMap, noiseTexture);
          if (maskMix.uBlurThreshold) {
            gl.uniform1f(maskMix.uBlurThreshold, config.blurThreshold);
          }
          if (maskMix.uBlurSoftness) {
            gl.uniform1f(maskMix.uBlurSoftness, config.blurSoftness);
          }
          if (maskMix.uTime) gl.uniform1f(maskMix.uTime, time);
          if (maskMix.uDrip) gl.uniform1f(maskMix.uDrip, config.drip);
          drawFullscreenTriangle(gl, maskMix.program, buf);
        };

        const renderKawaseBlur = (config: ThermalBlurConfig, time: number) => {
          if (!textTexture || !fboBlurH || !fboHeat || !fboNoise) return;

          const baseOffset = config.blur * (fboBlurH.width / 1000) * 0.28;
          let readTexture: WebGLTexture = textTexture;

          for (let i = 0; i < KAWASE_PASS_SCALES.length; i++) {
            const writeTarget =
              readTexture === fboBlurH.texture ? fboHeat : fboBlurH;
            renderKawasePass(
              writeTarget,
              readTexture,
              baseOffset * KAWASE_PASS_SCALES[i],
              i * 0.52,
            );
            readTexture = writeTarget.texture;
          }

          if (readTexture === fboHeat.texture) {
            renderKawasePass(
              fboBlurH,
              readTexture,
              baseOffset * KAWASE_PASS_SCALES[KAWASE_PASS_SCALES.length - 1],
              KAWASE_PASS_SCALES.length * 0.52,
            );
            readTexture = fboBlurH.texture;
          }

          renderMaskMix(
            fboHeat,
            config,
            time,
            textTexture,
            readTexture,
            fboNoise.texture,
          );
        };

        const draw = (time: number) => {
          if (
            cancelled ||
            !textTexture ||
            !fboNoise ||
            !fboNoiseSmooth ||
            !fboBlurH ||
            !fboHeat
          )
            return;

          const config = configRef.current;
          const animatedTime = time * config.speed;
          renderNoiseMap(animatedTime, config, pointerRef.current);
          renderSmoothedNoiseMap();
          renderKawaseBlur(config, animatedTime);

          bindFramebuffer(gl, null);
          gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
          if (pass === "composite") {
            gl.clearColor(1, 1, 1, 1);
          } else {
            gl.clearColor(0, 0, 0, 1);
          }
          gl.clear(gl.COLOR_BUFFER_BIT);

          if (pass === "noise") {
            // biome-ignore lint/correctness/useHookAtTopLevel: WebGL API call, not React hook
            gl.useProgram(preview.program);
            bindTextureUnit(0, preview.uTexture, fboNoise.texture);
          } else if (pass === "kawase") {
            // biome-ignore lint/correctness/useHookAtTopLevel: WebGL API call, not React hook
            gl.useProgram(preview.program);
            bindTextureUnit(0, preview.uTexture, fboBlurH.texture);
          } else if (pass === "maskMix") {
            // biome-ignore lint/correctness/useHookAtTopLevel: WebGL API call, not React hook
            gl.useProgram(preview.program);
            bindTextureUnit(0, preview.uTexture, fboHeat.texture);
          } else {
            // biome-ignore lint/correctness/useHookAtTopLevel: WebGL API call, not React hook
            gl.useProgram(composite.program);
            bindTextureUnit(0, composite.uTexture, fboHeat.texture);
          }

          drawFullscreenTriangle(
            gl,
            pass === "composite" ? composite.program : preview.program,
            buf,
          );
        };

        const cleanup = () => {
          if (textTexture) gl.deleteTexture(textTexture);
          if (fboNoise) deleteFramebuffer(gl, fboNoise);
          if (fboNoiseSmooth) deleteFramebuffer(gl, fboNoiseSmooth);
          if (fboBlurH) deleteFramebuffer(gl, fboBlurH);
          if (fboHeat) deleteFramebuffer(gl, fboHeat);
          gl.deleteProgram(noiseMapProgram);
          gl.deleteProgram(noiseBlurHProgram);
          gl.deleteProgram(noiseBlurVProgram);
          gl.deleteProgram(kawaseBlurProgram);
          gl.deleteProgram(maskMixProgram);
          gl.deleteProgram(compositeProgram);
          gl.deleteProgram(previewProgram);
          gl.deleteBuffer(buf);
        };

        return { canvas, pass, ensureTargets, draw, cleanup };
      })
      .filter(
        (renderer): renderer is NonNullable<typeof renderer> =>
          renderer !== null,
      );

    if (renderers.length === 0) return;

    let lastFrameTime = performance.now() / 1000;

    const stepPointer = (delta: number) => {
      const pointer = pointerRef.current;
      const target = pointerTargetRef.current;
      const t = 1 - Math.exp(-configRef.current.pointerLerp * delta);
      pointer.x += (target.x - pointer.x) * t;
      pointer.y += (target.y - pointer.y) * t;
    };

    const loop = () => {
      const now = performance.now() / 1000;
      const delta = Math.min(now - lastFrameTime, 0.05);
      lastFrameTime = now;
      stepPointer(delta);

      const time = now - startTimeRef.current;
      for (const renderer of renderers) {
        renderer.draw(time);
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    const updatePointer = (event: PointerEvent) => {
      const targetCanvas = event.currentTarget;
      if (!(targetCanvas instanceof HTMLCanvasElement)) return;
      const rect = targetCanvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      pointerTargetRef.current = {
        x: (event.clientX - rect.left) / rect.width,
        y: 1 - (event.clientY - rect.top) / rect.height,
      };
    };

    const disconnectResizeHandlers = activeCanvases.map(({ canvas }) =>
      observeCanvasPixelSize(canvas, (size) => {
        const matched = renderers.find(
          (renderer) => renderer.canvas === canvas,
        );
        matched?.ensureTargets(size.w, size.h);
      }),
    );

    for (const { canvas } of activeCanvases) {
      canvas.addEventListener("pointermove", updatePointer);
      canvas.addEventListener("pointerdown", updatePointer);
      canvas.addEventListener("pointerenter", updatePointer);
    }

    loop();

    return () => {
      cancelled = true;
      for (const disconnect of disconnectResizeHandlers) disconnect();
      for (const { canvas } of activeCanvases) {
        canvas.removeEventListener("pointermove", updatePointer);
        canvas.removeEventListener("pointerdown", updatePointer);
        canvas.removeEventListener("pointerenter", updatePointer);
      }
      cancelAnimationFrame(rafRef.current);
      for (const renderer of renderers) renderer.cleanup();
      textCanvasRef.current = null;
      textTextureRef.current = null;
    };
  }, [debug]);

  if (debug) {
    const debugCanvases: Array<{
      label: string;
      ref: typeof noiseCanvasRef;
      lightBackground?: boolean;
    }> = [
      { label: "1. NOISE_MAP_FS (smoothed)", ref: noiseCanvasRef },
      { label: "2. KAWASE_BLUR_FS", ref: kawaseCanvasRef },
      { label: "3. BLUR_MASK_MIX_FS", ref: maskMixCanvasRef },
      {
        label: "4. COMPOSITE_FS",
        ref: compositeCanvasRef,
        lightBackground: true,
      },
    ];

    return (
      <div className="grid h-full w-full grid-cols-1 gap-4 p-4 md:grid-cols-2">
        {debugCanvases.map(({ label, ref, lightBackground }) => (
          <div
            key={label}
            className="flex min-h-0 min-w-0 flex-col gap-2 rounded-lg border border-border/60 bg-background/40 p-3"
          >
            <p className="text-xs text-muted-foreground">{label}</p>
            <div
              className={`relative flex-1 overflow-hidden rounded-md border border-border/40 ${lightBackground ? "bg-white" : "bg-black"}`}
            >
              <canvas
                ref={ref}
                className="absolute inset-0 h-full w-full"
                style={CANVAS_STYLE}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <canvas ref={canvasRef} className={className} style={CANVAS_STYLE} />;
}
