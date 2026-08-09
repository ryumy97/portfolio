"use client";

import type { StaticImageData } from "next/image";
import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
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
  uploadTextureFromImage,
} from "@/lib/webgl";
import { cn } from "@/lib/utils";

export type StretchPoint = { x: number; y: number };

/**
 * Four cubic boundary curves for a Coons patch:
 * AB (a→a1→a2→b), CD (c→c1→c2→d), AC (a→ac1→ac2→c), BD (b→bd1→bd2→d).
 */
export type StretchPaths = {
  a: StretchPoint;
  a1: StretchPoint;
  a2: StretchPoint;
  b: StretchPoint;
  c: StretchPoint;
  c1: StretchPoint;
  c2: StretchPoint;
  d: StretchPoint;
  ac1: StretchPoint;
  ac2: StretchPoint;
  bd1: StretchPoint;
  bd2: StretchPoint;
};

export const WEBGL_PIXEL_STRETCH_DEFAULTS = {
  amount: 1,
  showGuides: false,
  quality: 75,
  /** Image width as a fraction of canvas width. */
  imageWidth: 0.8,
  /** Traveling wave amplitude on edge CD, in image-frame UV. */
  edgeWaveStrength: 0.01,
  /** How fast the CD edge wave travels (Hz). */
  edgeWaveFrequency: 0.5,
  /** Spatial cycles along CD (0 at ends via envelope). */
  edgeWaveCount: 2,
  /** AB→CD stretch reveal duration on mount (seconds). 0 disables. */
  revealDuration: 1.1,
  /**
   * Control points in image-frame UV (0–1 = image rect; may go outside).
   */
  paths: {
    a: { x: 0.178087, y: 0.552336 },
    a1: { x: 0.300844, y: 0.50625 },
    a2: { x: 0.321407, y: 0.483722 },
    b: { x: 0.390214, y: 0.372813 },
    c: { x: -0.028946, y: 1.192466 },
    c1: { x: 0.708578, y: 1.198637 },
    c2: { x: 0.637938, y: 1.122655 },
    d: { x: 1.097363, y: 0.973653 },
    ac1: { x: 0.130872, y: 0.659836 },
    ac2: { x: 0.286913, y: 0.699894 },
    bd1: { x: 0.351279, y: 0.551045 },
    bd2: { x: 0.8125, y: 1.040901 },
  } satisfies StretchPaths,
} as const;

export type WebGLPixelStretchCanvasProps = {
  className?: string;
  /** Full source image (background layer when a cutout is provided). */
  image: StaticImageData;
  /**
   * Transparent subject cutout drawn in front of the stretch.
   * Stretch samples from this when present.
   */
  cutout?: StaticImageData | null;
  /** Coons-patch cubics in image-frame UV (0–1 = image; may extend outside). */
  paths: StretchPaths;
  onPathsChange?: (paths: StretchPaths) => void;
  /** Mix toward the stretch behind the image (0–1). */
  amount?: number;
  /** Show curve guides, grid, and drag handles. Defaults to true. */
  showGuides?: boolean;
  /** Traveling wave amplitude on edge CD (image-frame UV). */
  edgeWaveStrength?: number;
  /** CD edge wave travel speed in Hz. */
  edgeWaveFrequency?: number;
  /** Spatial wave cycles along CD. */
  edgeWaveCount?: number;
  /** Image width as a fraction of canvas width. Defaults to 0.5. */
  imageWidth?: number;
  /** Quality passed to the Next.js image optimizer. Defaults to 75. */
  quality?: number;
  /** Extra overlay while textures load. */
  loading?: boolean;
  /**
   * Duration in seconds for the AB→CD stretch reveal when the canvas mounts.
   * Pass 0 to skip. Defaults to 1.4.
   */
  revealDuration?: number;
  /**
   * Change this value to replay the AB→CD reveal (e.g. on Reset).
   */
  revealKey?: number;
};

type StretchConfig = {
  amount: number;
  showGuides: boolean;
  paths: StretchPaths;
  imageAspect: number;
  imageWidth: number;
  edgeWaveStrength: number;
  edgeWaveFrequency: number;
  edgeWaveCount: number;
  time: number;
  /** How far the stretch has grown from AB (0) toward CD (1). */
  reveal: number;
};

type HandleId = keyof StretchPaths;

const FS = `
precision mediump float;
varying vec2 vUv;
uniform vec2 uResolution;
uniform float uImageAspect;
uniform float uImageWidth;
uniform vec2 uA;
uniform vec2 uA1;
uniform vec2 uA2;
uniform vec2 uB;
uniform vec2 uC;
uniform vec2 uC1;
uniform vec2 uC2;
uniform vec2 uD;
uniform vec2 uAC1;
uniform vec2 uAC2;
uniform vec2 uBD1;
uniform vec2 uBD2;
uniform float uAmount;
uniform float uReveal;
uniform float uGuide;
uniform float uTime;
uniform float uEdgeWaveStrength;
uniform float uEdgeWaveFrequency;
uniform float uEdgeWaveCount;
uniform sampler2D uBackground;
uniform sampler2D uCutout;
uniform float uHasCutout;

const int NEWTON_STEPS = 5;
const int GUIDE_SEGMENTS = 16;
const float PI = 3.14159265359;
const float TAU = 6.28318530718;

float cross2(vec2 a, vec2 b) {
  return a.x * b.y - a.y * b.x;
}

vec2 imageFrameSize() {
  float canvasAspect = uResolution.x / max(uResolution.y, 1.0);
  float width = clamp(uImageWidth, 1e-5, 1.0);
  float height = width * canvasAspect / max(uImageAspect, 1e-5);
  return vec2(width, height);
}

vec2 imageFrameOffset(vec2 size) {
  return (vec2(1.0) - size) * 0.5;
}

vec2 canvasToImageUv(vec2 canvasUv, vec2 size, vec2 offset) {
  return (canvasUv - offset) / max(size, vec2(1e-5));
}

float inUnitSquare(vec2 uv) {
  return step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
}

vec2 cubicBezier(vec2 p0, vec2 p1, vec2 p2, vec2 p3, float t) {
  float u = 1.0 - t;
  float uu = u * u;
  float tt = t * t;
  return uu * u * p0 + 3.0 * uu * t * p1 + 3.0 * u * tt * p2 + tt * t * p3;
}

vec2 cubicBezierDeriv(vec2 p0, vec2 p1, vec2 p2, vec2 p3, float t) {
  float u = 1.0 - t;
  return 3.0 * u * u * (p1 - p0)
    + 6.0 * u * t * (p2 - p1)
    + 3.0 * t * t * (p3 - p2);
}

vec2 invBilinearSeed(vec2 p, vec2 a, vec2 b, vec2 c, vec2 d) {
  vec2 e = b - a;
  vec2 f = c - a;
  vec2 g = a - b + d - c;
  vec2 h = p - a;

  float k2 = cross2(g, f);
  float k1 = cross2(e, f) + cross2(h, g);
  float k0 = cross2(h, e);

  float t = 0.5;
  float s = 0.5;

  if (abs(k2) < 1e-5) {
    if (abs(k1) < 1e-5) {
      return vec2(0.5, 0.5);
    }
    s = clamp(-k0 / k1, 0.0, 1.0);
    float denX = e.x + g.x * s;
    float denY = e.y + g.y * s;
    if (abs(denX) > abs(denY)) {
      t = (h.x - f.x * s) / denX;
    } else if (abs(denY) > 1e-5) {
      t = (h.y - f.y * s) / denY;
    }
  } else {
    float disc = k1 * k1 - 4.0 * k2 * k0;
    if (disc >= 0.0) {
      float sqrtDisc = sqrt(disc);
      float s1 = (-k1 - sqrtDisc) / (2.0 * k2);
      float s2 = (-k1 + sqrtDisc) / (2.0 * k2);
      s = (s1 >= 0.0 && s1 <= 1.0) ? s1 : s2;
      float denX = e.x + g.x * s;
      float denY = e.y + g.y * s;
      if (abs(denX) > abs(denY)) {
        t = (h.x - f.x * s) / denX;
      } else if (abs(denY) > 1e-5) {
        t = (h.y - f.y * s) / denY;
      }
    }
  }

  return vec2(clamp(t, 0.0, 1.0), clamp(s, 0.0, 1.0));
}

vec2 cdTangentNormal(float t) {
  vec2 tang = cubicBezierDeriv(uC, uC1, uC2, uD, t);
  float len = length(tang);
  vec2 n = len > 1e-6 ? vec2(-tang.y, tang.x) / len : vec2(0.0, 1.0);
  vec2 onCurve = cubicBezier(uC, uC1, uC2, uD, t);
  vec2 towardAb = (uA + uB) * 0.5 - onCurve;
  if (dot(n, towardAb) < 0.0) {
    n = -n;
  }
  return n;
}

// CD cubic with a traveling perpendicular wave (pinned at t=0 and t=1).
vec2 wavyCd(float t) {
  vec2 p = cubicBezier(uC, uC1, uC2, uD, t);
  if (uEdgeWaveStrength < 1e-5) {
    return p;
  }
  float envelope = sin(PI * t);
  float phase = TAU * (uEdgeWaveCount * t + uTime * uEdgeWaveFrequency);
  return p + cdTangentNormal(t) * (uEdgeWaveStrength * sin(phase) * envelope);
}

vec2 wavyCdDeriv(float t) {
  float eps = 1e-3;
  float t0 = clamp(t - eps, 0.0, 1.0);
  float t1 = clamp(t + eps, 0.0, 1.0);
  return (wavyCd(t1) - wavyCd(t0)) / max(t1 - t0, 1e-5);
}

// Bilinear Coons patch from four cubic boundaries (CD is wavy).
vec2 coonsPoint(float t, float s) {
  vec2 ab = cubicBezier(uA, uA1, uA2, uB, t);
  vec2 cd = wavyCd(t);
  vec2 ac = cubicBezier(uA, uAC1, uAC2, uC, s);
  vec2 bd = cubicBezier(uB, uBD1, uBD2, uD, s);
  vec2 corner =
    (1.0 - t) * (1.0 - s) * uA +
    t * (1.0 - s) * uB +
    (1.0 - t) * s * uC +
    t * s * uD;
  return (1.0 - s) * ab + s * cd + (1.0 - t) * ac + t * bd - corner;
}

vec4 coonsJacobian(float t, float s) {
  vec2 ab = cubicBezier(uA, uA1, uA2, uB, t);
  vec2 cd = wavyCd(t);
  vec2 ac = cubicBezier(uA, uAC1, uAC2, uC, s);
  vec2 bd = cubicBezier(uB, uBD1, uBD2, uD, s);
  vec2 abDt = cubicBezierDeriv(uA, uA1, uA2, uB, t);
  vec2 cdDt = wavyCdDeriv(t);
  vec2 acDs = cubicBezierDeriv(uA, uAC1, uAC2, uC, s);
  vec2 bdDs = cubicBezierDeriv(uB, uBD1, uBD2, uD, s);

  vec2 dRdt = (1.0 - s) * (uB - uA) + s * (uD - uC);
  vec2 dRds = (1.0 - t) * (uC - uA) + t * (uD - uB);

  vec2 dPdt = (1.0 - s) * abDt + s * cdDt - ac + bd - dRdt;
  vec2 dPds = -ab + cd + (1.0 - t) * acDs + t * bdDs - dRds;
  return vec4(dPdt, dPds);
}

// Invert Coons patch. Returns (t, s, residual).
vec3 invertCoons(vec2 p) {
  vec2 ts = invBilinearSeed(p, uA, uB, uC, uD);
  float t = ts.x;
  float s = ts.y;

  for (int i = 0; i < NEWTON_STEPS; i++) {
    vec2 f = coonsPoint(t, s) - p;
    vec4 J = coonsJacobian(t, s);
    vec2 dPdt = J.xy;
    vec2 dPds = J.zw;

    float det = cross2(dPdt, dPds);
    if (abs(det) < 1e-8) {
      break;
    }

    float dt = cross2(f, dPds) / det;
    float ds = cross2(dPdt, f) / det;
    t = clamp(t - dt, 0.0, 1.0);
    s = clamp(s - ds, 0.0, 1.0);
  }

  float residual = length(coonsPoint(t, s) - p);
  return vec3(t, s, residual);
}

float lineGuide(vec2 p, vec2 a, vec2 b, float halfWidth) {
  vec2 ab = b - a;
  float len2 = max(dot(ab, ab), 1e-6);
  float u = clamp(dot(p - a, ab) / len2, 0.0, 1.0);
  float dist = length(p - (a + ab * u));
  return 1.0 - smoothstep(0.0, halfWidth, dist);
}

float curveGuide(
  vec2 p,
  vec2 p0,
  vec2 p1,
  vec2 p2,
  vec2 p3,
  float halfWidth
) {
  float guide = 0.0;
  vec2 prev = p0;
  for (int i = 1; i <= GUIDE_SEGMENTS; i++) {
    float t = float(i) / float(GUIDE_SEGMENTS);
    vec2 next = cubicBezier(p0, p1, p2, p3, t);
    guide = max(guide, lineGuide(p, prev, next, halfWidth));
    prev = next;
  }
  return guide;
}

float wavyCdGuide(vec2 p, float halfWidth) {
  float guide = 0.0;
  vec2 prev = wavyCd(0.0);
  for (int i = 1; i <= GUIDE_SEGMENTS; i++) {
    float t = float(i) / float(GUIDE_SEGMENTS);
    vec2 next = wavyCd(t);
    guide = max(guide, lineGuide(p, prev, next, halfWidth));
    prev = next;
  }
  return guide;
}

float coonsIsoGuide(vec2 p, float halfWidth) {
  float guide = 0.0;
  // 3×3 cells → parameter lines at 0, 1/3, 2/3, 1 along t and s.
  for (int i = 0; i <= 3; i++) {
    float u = float(i) / 3.0;
    vec2 prevT = coonsPoint(0.0, u);
    vec2 prevS = coonsPoint(u, 0.0);
    for (int j = 1; j <= GUIDE_SEGMENTS; j++) {
      float v = float(j) / float(GUIDE_SEGMENTS);
      vec2 nextT = coonsPoint(v, u);
      vec2 nextS = coonsPoint(u, v);
      guide = max(guide, lineGuide(p, prevT, nextT, halfWidth));
      guide = max(guide, lineGuide(p, prevS, nextS, halfWidth));
      prevT = nextT;
      prevS = nextS;
    }
  }
  return guide;
}

vec4 alphaOver(vec4 src, vec4 dst) {
  float outA = src.a + dst.a * (1.0 - src.a);
  vec3 outRgb = outA > 1e-5
    ? (src.rgb * src.a + dst.rgb * dst.a * (1.0 - src.a)) / outA
    : vec3(0.0);
  return vec4(outRgb, outA);
}

void main() {
  vec2 size = imageFrameSize();
  vec2 offset = imageFrameOffset(size);
  vec2 imageUv = canvasToImageUv(vUv, size, offset);
  float onImage = inUnitSquare(imageUv);

  float pixel = 1.5 / max(min(uResolution.x, uResolution.y), 1.0);

  // Cheap AABB cull before the expensive Coons invert (include cubic handles).
  float pad = uEdgeWaveStrength + pixel * 8.0;
  float minX = min(min(min(uA.x, uA1.x), min(uA2.x, uB.x)),
    min(min(min(uC.x, uC1.x), min(uC2.x, uD.x)),
      min(min(uAC1.x, uAC2.x), min(uBD1.x, uBD2.x)))) - pad;
  float maxX = max(max(max(uA.x, uA1.x), max(uA2.x, uB.x)),
    max(max(max(uC.x, uC1.x), max(uC2.x, uD.x)),
      max(max(uAC1.x, uAC2.x), max(uBD1.x, uBD2.x)))) + pad;
  float minY = min(min(min(uA.y, uA1.y), min(uA2.y, uB.y)),
    min(min(min(uC.y, uC1.y), min(uC2.y, uD.y)),
      min(min(uAC1.y, uAC2.y), min(uBD1.y, uBD2.y)))) - pad;
  float maxY = max(max(max(uA.y, uA1.y), max(uA2.y, uB.y)),
    max(max(max(uC.y, uC1.y), max(uC2.y, uD.y)),
      max(max(uAC1.y, uAC2.y), max(uBD1.y, uBD2.y)))) + pad;
  float inBounds = step(minX, vUv.x) * step(vUv.x, maxX)
    * step(minY, vUv.y) * step(vUv.y, maxY);

  float t = 0.0;
  float s = 0.0;
  float residual = 1e5;
  float inside = 0.0;
  if (inBounds > 0.5 && uAmount > 1e-4 && uReveal > 1e-4) {
    vec3 tsR = invertCoons(vUv);
    t = tsR.x;
    s = tsR.y;
    residual = tsR.z;
    inside = step(0.0, t) * step(t, 1.0) * step(0.0, s) * step(s, 1.0)
      * step(residual, pixel * 4.0);
  }

  vec2 sampleCanvas = cubicBezier(uA, uA1, uA2, uB, t);
  vec2 sampleImageUv = canvasToImageUv(sampleCanvas, size, offset);
  float sampleValid = inUnitSquare(sampleImageUv);

  // Grow the fill from AB (s=0) toward CD (s=1) as uReveal increases.
  float revealMask = step(s, uReveal);

  // Back → middle → front: scene, AB→CD stretch, cutout.
  vec4 color = vec4(0.0);

  vec4 cutoutFg = texture2D(uCutout, clamp(imageUv, 0.0, 1.0));
  cutoutFg.a *= onImage;

  vec4 background = texture2D(uBackground, clamp(imageUv, 0.0, 1.0));
  if (uHasCutout > 0.5) {
    // Punch the subject out of the full image so it can't ghost under soft mattes.
    background.a *= onImage * (1.0 - cutoutFg.a);
  } else {
    background.a = 0.0;
  }
  color = alphaOver(background, color);

  vec4 stretched = uHasCutout > 0.5
    ? texture2D(uCutout, clamp(sampleImageUv, 0.0, 1.0))
    : texture2D(uBackground, clamp(sampleImageUv, 0.0, 1.0));
  // Hide stretch under the opaque cutout so it can't form a second subject layer.
  float underCutout = uHasCutout > 0.5 ? (1.0 - cutoutFg.a) : 1.0;
  // Keep the stretch inside the background image frame.
  stretched.a *= inside * uAmount * sampleValid * revealMask * underCutout * onImage;
  color = alphaOver(stretched, color);

  if (uHasCutout > 0.5) {
    color = alphaOver(cutoutFg, color);
  } else {
    vec4 foreground = texture2D(uBackground, clamp(imageUv, 0.0, 1.0));
    foreground.a *= onImage;
    color = alphaOver(foreground, color);
  }

  float guides = 0.0;
  if (uGuide > 0.5) {
    guides =
      curveGuide(vUv, uA, uA1, uA2, uB, pixel) +
      wavyCdGuide(vUv, pixel) +
      curveGuide(vUv, uA, uAC1, uAC2, uC, pixel) +
      curveGuide(vUv, uB, uBD1, uBD2, uD, pixel) +
      coonsIsoGuide(vUv, pixel * 0.75) * 0.45 +
      lineGuide(vUv, uA, uA1, pixel * 0.5) * 0.3 +
      lineGuide(vUv, uA2, uB, pixel * 0.5) * 0.3 +
      lineGuide(vUv, uC, uC1, pixel * 0.5) * 0.3 +
      lineGuide(vUv, uC2, uD, pixel * 0.5) * 0.3 +
      lineGuide(vUv, uA, uAC1, pixel * 0.5) * 0.3 +
      lineGuide(vUv, uAC2, uC, pixel * 0.5) * 0.3 +
      lineGuide(vUv, uB, uBD1, pixel * 0.5) * 0.3 +
      lineGuide(vUv, uBD2, uD, pixel * 0.5) * 0.3;
  }
  color = alphaOver(
    vec4(1.0, 1.0, 1.0, clamp(guides, 0.0, 1.0) * 0.7),
    color
  );

  gl_FragColor = color;
}
`;

/** Cap fragment-shader resolution — Coons invert is expensive per pixel. */
const MAX_RENDER_SIDE = 1080;
/** Sustained CD edge-wave redraw rate (intro reveal runs uncapped). */
const WAVE_FRAME_MS = 1000 / 30;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function capPixelSize(size: { w: number; h: number }) {
  const side = Math.max(size.w, size.h);
  if (side <= MAX_RENDER_SIDE) return size;
  const scale = MAX_RENDER_SIDE / side;
  return {
    w: Math.max(1, Math.floor(size.w * scale)),
    h: Math.max(1, Math.floor(size.h * scale)),
  };
}

function imageAspectRatio(image: StaticImageData) {
  return image.width / Math.max(image.height, 1);
}

/** Pixel size for an image whose width is `imageWidth` × canvas width. */
function imageTextureSize(
  canvasW: number,
  imageAspect: number,
  imageWidth: number,
) {
  const w = Math.max(1, Math.round(canvasW * clamp01(imageWidth)));
  const h = Math.max(1, Math.round(w / Math.max(imageAspect, 1e-5)));
  return { w, h };
}

type ImageFrame = {
  size: StretchPoint;
  offset: StretchPoint;
};

/** Image rect in canvas UV for the current canvas / image aspects. */
function getImageFrame(
  canvasAspect: number,
  imageAspect: number,
  imageWidth: number,
): ImageFrame {
  const width = Math.min(1, Math.max(1e-5, imageWidth));
  const height = (width * canvasAspect) / Math.max(imageAspect, 1e-5);
  return {
    size: { x: width, y: height },
    offset: { x: (1 - width) * 0.5, y: (1 - height) * 0.5 },
  };
}

function imageToCanvas(point: StretchPoint, frame: ImageFrame): StretchPoint {
  return {
    x: frame.offset.x + point.x * frame.size.x,
    y: frame.offset.y + point.y * frame.size.y,
  };
}

function canvasToImage(point: StretchPoint, frame: ImageFrame): StretchPoint {
  return {
    x: (point.x - frame.offset.x) / frame.size.x,
    y: (point.y - frame.offset.y) / frame.size.y,
  };
}

function pathsToCanvas(paths: StretchPaths, frame: ImageFrame): StretchPaths {
  return {
    a: imageToCanvas(paths.a, frame),
    a1: imageToCanvas(paths.a1, frame),
    a2: imageToCanvas(paths.a2, frame),
    b: imageToCanvas(paths.b, frame),
    c: imageToCanvas(paths.c, frame),
    c1: imageToCanvas(paths.c1, frame),
    c2: imageToCanvas(paths.c2, frame),
    d: imageToCanvas(paths.d, frame),
    ac1: imageToCanvas(paths.ac1, frame),
    ac2: imageToCanvas(paths.ac2, frame),
    bd1: imageToCanvas(paths.bd1, frame),
    bd2: imageToCanvas(paths.bd2, frame),
  };
}

function toCssPoint(point: StretchPoint) {
  return {
    left: `${point.x * 100}%`,
    top: `${(1 - point.y) * 100}%`,
  };
}

function eventToCanvasUv(
  event: { clientX: number; clientY: number },
  el: HTMLElement,
): StretchPoint {
  const rect = el.getBoundingClientRect();
  return {
    x: clamp01((event.clientX - rect.left) / Math.max(rect.width, 1)),
    y: clamp01(1 - (event.clientY - rect.top) / Math.max(rect.height, 1)),
  };
}

const HANDLES: {
  id: HandleId;
  label: string;
  path: "AB" | "CD" | "AC" | "BD";
  kind: "end" | "control";
}[] = [
  { id: "a", label: "A", path: "AB", kind: "end" },
  { id: "a1", label: "A1", path: "AB", kind: "control" },
  { id: "a2", label: "A2", path: "AB", kind: "control" },
  { id: "b", label: "B", path: "AB", kind: "end" },
  { id: "c", label: "C", path: "CD", kind: "end" },
  { id: "c1", label: "C1", path: "CD", kind: "control" },
  { id: "c2", label: "C2", path: "CD", kind: "control" },
  { id: "d", label: "D", path: "CD", kind: "end" },
  { id: "ac1", label: "AC1", path: "AC", kind: "control" },
  { id: "ac2", label: "AC2", path: "AC", kind: "control" },
  { id: "bd1", label: "BD1", path: "BD", kind: "control" },
  { id: "bd2", label: "BD2", path: "BD", kind: "control" },
];

/**
 * Samples pixels along cubic Bézier AB and stretches them across a Coons
 * patch bounded by cubics AB, CD, AC, and BD.
 */
export function WebGLPixelStretchCanvas({
  className,
  image,
  cutout = null,
  paths,
  onPathsChange,
  amount = WEBGL_PIXEL_STRETCH_DEFAULTS.amount,
  showGuides = WEBGL_PIXEL_STRETCH_DEFAULTS.showGuides,
  edgeWaveStrength = WEBGL_PIXEL_STRETCH_DEFAULTS.edgeWaveStrength,
  edgeWaveFrequency = WEBGL_PIXEL_STRETCH_DEFAULTS.edgeWaveFrequency,
  edgeWaveCount = WEBGL_PIXEL_STRETCH_DEFAULTS.edgeWaveCount,
  imageWidth = WEBGL_PIXEL_STRETCH_DEFAULTS.imageWidth,
  quality = WEBGL_PIXEL_STRETCH_DEFAULTS.quality,
  loading = false,
  revealDuration = WEBGL_PIXEL_STRETCH_DEFAULTS.revealDuration,
  revealKey = 0,
}: WebGLPixelStretchCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const drawRef = useRef<(() => void) | null>(null);
  const invalidate = useRef(createScheduledDraw(drawRef));
  const dragRef = useRef<HandleId | null>(null);
  const imageAspect = imageAspectRatio(image);
  const frameRef = useRef<ImageFrame>(
    getImageFrame(1, imageAspect, imageWidth),
  );
  const [frame, setFrame] = useState<ImageFrame>(() =>
    getImageFrame(1, imageAspect, imageWidth),
  );
  const configRef = useRef<StretchConfig>({
    amount,
    showGuides,
    paths,
    imageAspect,
    imageWidth,
    edgeWaveStrength,
    edgeWaveFrequency,
    edgeWaveCount,
    time: 0,
    reveal: revealDuration > 0 ? 0 : 1,
  });
  const [isLoadingTexture, setIsLoadingTexture] = useState(false);
  const animStartRef = useRef(0);
  const introPlayedRef = useRef(revealDuration <= 0);
  const revealGenerationRef = useRef(0);

  // Reset reveal before paint so Reset never flashes a full stretch frame.
  useLayoutEffect(() => {
    void revealKey;
    if (revealDuration <= 0) {
      introPlayedRef.current = true;
      configRef.current.reveal = 1;
      return;
    }
    introPlayedRef.current = false;
    configRef.current.reveal = 0;
    revealGenerationRef.current += 1;
  }, [revealKey, revealDuration]);

  useEffect(() => {
    configRef.current = {
      ...configRef.current,
      amount,
      showGuides,
      paths,
      imageAspect,
      imageWidth,
      edgeWaveStrength,
      edgeWaveFrequency,
      edgeWaveCount,
    };
    invalidate.current();
  }, [
    amount,
    showGuides,
    paths,
    imageAspect,
    imageWidth,
    edgeWaveStrength,
    edgeWaveFrequency,
    edgeWaveCount,
  ]);

  // Grow stretch from AB → CD once textures are ready; keep looping for CD edge wave after.
  useEffect(() => {
    void revealKey;
    if (isLoadingTexture) return;

    const generation = revealGenerationRef.current;
    const waveActive = edgeWaveStrength > 1e-4 && edgeWaveFrequency > 1e-4;
    const needsReveal = revealDuration > 0 && !introPlayedRef.current;
    if (!waveActive && !needsReveal) {
      configRef.current.reveal = 1;
      if (!waveActive) configRef.current.time = 0;
      invalidate.current();
      return;
    }

    let raf = 0;
    let running = true;
    let lastWaveFrameAt = 0;
    const wallStart = performance.now() / 1000;
    animStartRef.current = wallStart;
    if (needsReveal) configRef.current.reveal = 0;

    const paint = () => {
      drawRef.current?.();
    };

    const tick = (nowMs: number) => {
      if (!running) return;
      // A newer Reset started — stop this loop.
      if (generation !== revealGenerationRef.current) return;

      const now = nowMs / 1000;
      const revealing = needsReveal && !introPlayedRef.current;

      if (document.visibilityState === "visible") {
        if (revealing) {
          // Linear fill — easing parks near CD then snaps the last sliver.
          const t = Math.min(1, (now - wallStart) / revealDuration);
          configRef.current.reveal = t;
          if (t >= 1) {
            configRef.current.reveal = 1;
            introPlayedRef.current = true;
          }
          if (waveActive) {
            configRef.current.time = now - animStartRef.current;
          }
          paint();
        } else if (waveActive && nowMs - lastWaveFrameAt >= WAVE_FRAME_MS) {
          lastWaveFrameAt = nowMs;
          configRef.current.reveal = 1;
          configRef.current.time = now - animStartRef.current;
          paint();
        } else if (!waveActive) {
          configRef.current.reveal = 1;
          paint();
        }
      }

      const revealDone = introPlayedRef.current || revealDuration <= 0;

      if (document.visibilityState === "visible") {
        if (!revealDone || waveActive) {
          raf = requestAnimationFrame(tick);
        } else {
          configRef.current.reveal = 1;
          paint();
          raf = 0;
        }
      } else {
        raf = 0;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible" && running && raf === 0) {
        const now = performance.now() / 1000;
        animStartRef.current = now - configRef.current.time;
        lastWaveFrameAt = 0;
        raf = requestAnimationFrame(tick);
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [
    isLoadingTexture,
    edgeWaveStrength,
    edgeWaveFrequency,
    revealDuration,
    revealKey,
  ]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const updateFrame = () => {
      const rect = root.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const next = getImageFrame(
        rect.width / rect.height,
        imageAspect,
        imageWidth,
      );
      frameRef.current = next;
      setFrame(next);
      invalidate.current();
    };

    updateFrame();
    const observer = new ResizeObserver(updateFrame);
    observer.observe(root);
    return () => observer.disconnect();
  }, [imageAspect, imageWidth]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    let program: WebGLProgram | null = null;
    let buf: WebGLBuffer | null = null;
    let backgroundTexture: WebGLTexture | null = null;
    let cutoutTexture: WebGLTexture | null = null;
    let textureLoadId = 0;
    let loadedTextureSize = { w: 0, h: 0 };
    let hasCutout = false;

    const gl = getWebGLContext(canvas);
    if (!gl) return;

    const aspect = imageAspectRatio(image);

    const reloadTextures = async (canvasW: number) => {
      if (canvasW <= 0) return;

      const { w, h } = imageTextureSize(canvasW, aspect, imageWidth);
      if (
        w === loadedTextureSize.w &&
        h === loadedTextureSize.h &&
        backgroundTexture &&
        (!cutout || cutoutTexture)
      ) {
        invalidate.current();
        return;
      }

      const loadId = ++textureLoadId;
      setIsLoadingTexture(true);
      try {
        const bgSrc = getOptimizedImageSrc(image, w, h, quality);
        const bgElement = await loadImage(bgSrc);
        if (cancelled || loadId !== textureLoadId) return;

        if (backgroundTexture) gl.deleteTexture(backgroundTexture);
        backgroundTexture = uploadTextureFromImage(gl, bgElement);

        if (cutout) {
          // Load the source PNG directly so alpha is preserved (optimizer can drop it).
          const cutoutElement = await loadImage(cutout.src);
          if (cancelled || loadId !== textureLoadId) return;
          if (cutoutTexture) gl.deleteTexture(cutoutTexture);
          cutoutTexture = uploadTextureFromImage(gl, cutoutElement);
          hasCutout = Boolean(cutoutTexture);
        } else {
          if (cutoutTexture) {
            gl.deleteTexture(cutoutTexture);
            cutoutTexture = null;
          }
          hasCutout = false;
        }

        loadedTextureSize = { w, h };
        invalidate.current();
      } finally {
        if (!cancelled && loadId === textureLoadId) setIsLoadingTexture(false);
      }
    };

    program = createProgram(gl, FULLSCREEN_VS, FS);
    if (!program) return;

    const uResolution = gl.getUniformLocation(program, "uResolution");
    const uImageAspect = gl.getUniformLocation(program, "uImageAspect");
    const uImageWidth = gl.getUniformLocation(program, "uImageWidth");
    const uA = gl.getUniformLocation(program, "uA");
    const uA1 = gl.getUniformLocation(program, "uA1");
    const uA2 = gl.getUniformLocation(program, "uA2");
    const uB = gl.getUniformLocation(program, "uB");
    const uC = gl.getUniformLocation(program, "uC");
    const uC1 = gl.getUniformLocation(program, "uC1");
    const uC2 = gl.getUniformLocation(program, "uC2");
    const uD = gl.getUniformLocation(program, "uD");
    const uAC1 = gl.getUniformLocation(program, "uAC1");
    const uAC2 = gl.getUniformLocation(program, "uAC2");
    const uBD1 = gl.getUniformLocation(program, "uBD1");
    const uBD2 = gl.getUniformLocation(program, "uBD2");
    const uAmount = gl.getUniformLocation(program, "uAmount");
    const uReveal = gl.getUniformLocation(program, "uReveal");
    const uGuide = gl.getUniformLocation(program, "uGuide");
    const uTime = gl.getUniformLocation(program, "uTime");
    const uEdgeWaveStrength = gl.getUniformLocation(
      program,
      "uEdgeWaveStrength",
    );
    const uEdgeWaveFrequency = gl.getUniformLocation(
      program,
      "uEdgeWaveFrequency",
    );
    const uEdgeWaveCount = gl.getUniformLocation(program, "uEdgeWaveCount");
    const uBackground = gl.getUniformLocation(program, "uBackground");
    const uCutout = gl.getUniformLocation(program, "uCutout");
    const uHasCutout = gl.getUniformLocation(program, "uHasCutout");

    buf = createFullscreenTriangleBuffer(gl);
    if (!buf) {
      gl.deleteProgram(program);
      return;
    }

    const draw = () => {
      if (!backgroundTexture) return;

      const config = configRef.current;
      const canvasAspect =
        gl.drawingBufferWidth / Math.max(gl.drawingBufferHeight, 1);
      const drawFrame = getImageFrame(
        canvasAspect,
        config.imageAspect,
        config.imageWidth,
      );
      const p = pathsToCanvas(config.paths, drawFrame);

      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      // biome-ignore lint/correctness/useHookAtTopLevel: not a hook
      gl.useProgram(program);
      setResolutionUniform(gl, uResolution);
      if (uImageAspect) gl.uniform1f(uImageAspect, config.imageAspect);
      if (uImageWidth) gl.uniform1f(uImageWidth, config.imageWidth);
      if (uA) gl.uniform2f(uA, p.a.x, p.a.y);
      if (uA1) gl.uniform2f(uA1, p.a1.x, p.a1.y);
      if (uA2) gl.uniform2f(uA2, p.a2.x, p.a2.y);
      if (uB) gl.uniform2f(uB, p.b.x, p.b.y);
      if (uC) gl.uniform2f(uC, p.c.x, p.c.y);
      if (uC1) gl.uniform2f(uC1, p.c1.x, p.c1.y);
      if (uC2) gl.uniform2f(uC2, p.c2.x, p.c2.y);
      if (uD) gl.uniform2f(uD, p.d.x, p.d.y);
      if (uAC1) gl.uniform2f(uAC1, p.ac1.x, p.ac1.y);
      if (uAC2) gl.uniform2f(uAC2, p.ac2.x, p.ac2.y);
      if (uBD1) gl.uniform2f(uBD1, p.bd1.x, p.bd1.y);
      if (uBD2) gl.uniform2f(uBD2, p.bd2.x, p.bd2.y);
      if (uAmount) gl.uniform1f(uAmount, config.amount);
      if (uReveal) gl.uniform1f(uReveal, config.reveal);
      if (uGuide) gl.uniform1f(uGuide, config.showGuides ? 1 : 0);
      if (uTime) gl.uniform1f(uTime, config.time);
      // Edge-wave strength is authored in image UV; scale into canvas UV.
      const edgeScale = (drawFrame.size.x + drawFrame.size.y) * 0.5;
      if (uEdgeWaveStrength) {
        gl.uniform1f(uEdgeWaveStrength, config.edgeWaveStrength * edgeScale);
      }
      if (uEdgeWaveFrequency) {
        gl.uniform1f(uEdgeWaveFrequency, config.edgeWaveFrequency);
      }
      if (uEdgeWaveCount) {
        gl.uniform1f(uEdgeWaveCount, config.edgeWaveCount);
      }

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, backgroundTexture);
      if (uBackground) gl.uniform1i(uBackground, 0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, cutoutTexture ?? backgroundTexture);
      if (uCutout) gl.uniform1i(uCutout, 1);
      if (uHasCutout) gl.uniform1f(uHasCutout, hasCutout ? 1 : 0);

      drawFullscreenTriangle(gl, program, buf);
    };

    drawRef.current = draw;
    invalidate.current();

    const disconnectResize = observeCanvasPixelSize(canvas, (size) => {
      const capped = capPixelSize(size);
      if (canvas.width !== capped.w || canvas.height !== capped.h) {
        canvas.width = capped.w;
        canvas.height = capped.h;
      }
      reloadTextures(capped.w);
    });

    const capped = capPixelSize(getCanvasPixelSize(canvas));
    if (capped.w > 0) {
      canvas.width = capped.w;
      canvas.height = capped.h;
      reloadTextures(capped.w);
    }

    return () => {
      cancelled = true;
      setIsLoadingTexture(false);
      disconnectResize();
      drawRef.current = null;
      if (buf) gl.deleteBuffer(buf);
      if (backgroundTexture) gl.deleteTexture(backgroundTexture);
      if (cutoutTexture) gl.deleteTexture(cutoutTexture);
      if (program) gl.deleteProgram(program);
    };
  }, [image, cutout, quality, imageWidth]);

  const moveHandle = (id: HandleId, imagePoint: StretchPoint) => {
    if (!onPathsChange) return;
    onPathsChange({ ...paths, [id]: imagePoint });
  };

  const onHandlePointerDown = (
    id: HandleId,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = id;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onHandlePointerMove = (
    id: HandleId,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    if (dragRef.current !== id || !rootRef.current) return;
    const canvasUv = eventToCanvasUv(event, rootRef.current);
    moveHandle(id, canvasToImage(canvasUv, frameRef.current));
  };

  const onHandlePointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (dragRef.current == null) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  // Handles stay at oscillation centers (rest positions); mesh uses animated paths.
  const canvasPaths = pathsToCanvas(paths, frame);

  return (
    <div ref={rootRef} className="relative h-full w-full touch-none">
      <canvas ref={canvasRef} className={className} style={CANVAS_STYLE} />
      <CanvasLoader active={isLoadingTexture || loading} />
      {showGuides
        ? HANDLES.map(({ id, label, path, kind }) => (
            <button
              key={id}
              type="button"
              aria-label={`Move ${kind === "end" ? "endpoint" : "control"} ${label} on cubic ${path}`}
              className={cn(
                "absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-white/90 shadow-sm active:cursor-grabbing",
                kind === "end" ? "size-3.5" : "size-2.5",
                path === "AB" || path === "AC" ? "bg-primary" : "bg-secondary",
              )}
              style={toCssPoint(canvasPaths[id])}
              onPointerDown={(event) => onHandlePointerDown(id, event)}
              onPointerMove={(event) => onHandlePointerMove(id, event)}
              onPointerUp={onHandlePointerUp}
              onPointerCancel={onHandlePointerUp}
            />
          ))
        : null}
    </div>
  );
}
