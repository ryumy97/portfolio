"use client";

import { applyDocumentBackground, colorForPath } from "@/lib/page-color";
import { cn } from "@/lib/utils";
import {
  CANVAS_STYLE,
  createProgram,
  getWebGLContext,
  observeCanvasPixelSize,
  setResolutionUniform,
} from "@/lib/webgl";
import { usePageColor } from "@/stores/page-color";
import { usePageTransition } from "@/stores/page-transition";
import { useLayoutEffect, useRef } from "react";

/** CSS px. Circles overlap enough to cover every cell, including jitter. */
const TARGET_CELL = 32;
const VERTS_PER_PARTICLE = 6;
const FLOATS_PER_VERT = 9;
const CORNERS: Array<[number, number]> = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, -1],
  [1, 1],
  [-1, 1],
];

const VS = `
attribute vec2 a_origin;
attribute vec2 a_start;
attribute vec2 a_corner;
attribute vec3 a_life;

uniform vec2 u_resolution;
uniform vec2 u_grid;
uniform float u_time;

varying vec2 v_corner;

void main() {
  float delay = a_life.x;
  float travel = a_life.y;
  float sizeScale = a_life.z;
  float t = clamp((u_time - delay) / max(travel, 0.0001), 0.0, 1.0);
  float e = 1.0 - pow(1.0 - t, 4.0);
  v_corner = a_corner;

  vec2 pos = mix(a_start, a_origin, e);

  vec2 cell = u_resolution / max(u_grid, vec2(1.0));
  float radiusPx = length(cell) * 0.5 * sizeScale;
  vec2 offset = a_corner * radiusPx * 2.0 / u_resolution;
  gl_Position = vec4(pos + offset, 0.0, 1.0);
}
`;

const FS = `
precision mediump float;
varying vec2 v_corner;
uniform vec3 u_color;

void main() {
  if (length(v_corner) > 1.0) discard;
  gl_FragColor = vec4(u_color, 1.0);
}
`;

function fract(value: number) {
  return value - Math.floor(value);
}

function hash(i: number, j: number, salt: number) {
  return fract(Math.sin(i * 12.9898 + j * 78.233 + salt * 37.719) * 43758.5453);
}

function randomStart(): [number, number] {
  const side = Math.floor(Math.random() * 4);
  const along = (Math.random() * 2 - 1) * 1.5;
  const out = 1.15 + Math.random() * 0.75;
  if (side === 0) return [out, along];
  if (side === 1) return [-out, along];
  if (side === 2) return [along, out];
  return [along, -out];
}

function gridForCanvas(canvas: HTMLCanvasElement) {
  return {
    cols: Math.max(8, Math.ceil(canvas.clientWidth / TARGET_CELL)),
    rows: Math.max(8, Math.ceil(canvas.clientHeight / TARGET_CELL)),
  };
}

function buildParticleBuffer(cols: number, rows: number) {
  const col0 = -1;
  const row0 = -1;
  const colN = cols + 1;
  const rowN = rows + 1;
  const count = (colN - col0) * (rowN - row0);
  const rests: Array<{ x: number; y: number; sizeScale: number }> = [];

  for (let row = row0; row < rowN; row++) {
    for (let col = col0; col < colN; col++) {
      const jitterX = (hash(col, row, 1.1) - 0.5) * (2 / cols) * 0.2;
      const jitterY = (hash(col, row, 2.3) - 0.5) * (2 / rows) * 0.2;
      rests.push({
        x: (col + 0.5) * (2 / cols) - 1 + jitterX,
        y: (row + 0.5) * (2 / rows) - 1 + jitterY,
        sizeScale: 1.45 + hash(col, row, 6.1) * 0.25,
      });
    }
  }

  const starts = Array.from({ length: count }, () => randomStart());
  const order = starts.map((_, i) => i);
  order.sort((a, b) => {
    const da = starts[a][0] ** 2 + starts[a][1] ** 2;
    const db = starts[b][0] ** 2 + starts[b][1] ** 2;
    return da - db;
  });

  const restOfStart = new Int32Array(count);
  const used = new Uint8Array(count);
  for (const si of order) {
    const [sx, sy] = starts[si];
    let best = 0;
    let bestD = Number.POSITIVE_INFINITY;
    for (let ri = 0; ri < count; ri++) {
      if (used[ri]) continue;
      const dx = rests[ri].x - sx;
      const dy = rests[ri].y - sy;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = ri;
      }
    }
    used[best] = 1;
    restOfStart[si] = best;
  }

  const data = new Float32Array(count * VERTS_PER_PARTICLE * FLOATS_PER_VERT);
  let fillEnd = 0;
  let offset = 0;

  for (let i = 0; i < count; i++) {
    const [sx, sy] = starts[i];
    const rest = rests[restOfStart[i]];
    const delay = Math.random() * 0.65;
    const travel = 1.2 + Math.random() * 0.7;
    fillEnd = Math.max(fillEnd, delay + travel);

    for (const [cx, cy] of CORNERS) {
      data[offset] = rest.x;
      data[offset + 1] = rest.y;
      data[offset + 2] = sx;
      data[offset + 3] = sy;
      data[offset + 4] = cx;
      data[offset + 5] = cy;
      data[offset + 6] = delay;
      data[offset + 7] = travel;
      data[offset + 8] = rest.sizeScale;
      offset += FLOATS_PER_VERT;
    }
  }

  return { data, fillEnd, vertexCount: count * VERTS_PER_PARTICLE };
}

type PlayMode = "night" | "overlay";

type FieldApi = {
  play: (mode: PlayMode) => void;
};

type Props = {
  className?: string;
};

const HomeBackgroundCanvas = ({ className }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiRef = useRef<FieldApi | null>(null);
  const generation = usePageTransition((state) => state.generation);
  const covered = usePageTransition((state) => state.covered);
  const current = usePageColor((state) => state.current);
  const previous = usePageColor((state) => state.previous);

  useLayoutEffect(() => {
    usePageColor.getState().reset(colorForPath(window.location.pathname));
  }, []);

  useLayoutEffect(() => {
    applyDocumentBackground(covered ? current : previous);
  }, [covered, current, previous]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = getWebGLContext(canvas);
    if (!gl) return;

    const program = createProgram(gl, VS, FS);
    if (!program) return;

    const buffer = gl.createBuffer();
    if (!buffer) {
      gl.deleteProgram(program);
      return;
    }

    const aOrigin = gl.getAttribLocation(program, "a_origin");
    const aStart = gl.getAttribLocation(program, "a_start");
    const aCorner = gl.getAttribLocation(program, "a_corner");
    const aLife = gl.getAttribLocation(program, "a_life");
    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uGrid = gl.getUniformLocation(program, "u_grid");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uColor = gl.getUniformLocation(program, "u_color");
    const stride = FLOATS_PER_VERT * 4;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let raf = 0;
    let running = true;
    let filled = reduceMotion;
    let fillEnd = 0;
    let vertexCount = 0;
    let cols = 0;
    let rows = 0;
    let startedAt = performance.now() / 1000;
    let overlay = true;
    let notifiedCover = false;

    const markCovered = () => {
      if (notifiedCover) return;
      notifiedCover = true;
      if (overlay) usePageTransition.getState().markCovered();
    };

    const uploadParticles = (force = false) => {
      const next = gridForCanvas(canvas);
      if (
        !force &&
        next.cols === cols &&
        next.rows === rows &&
        vertexCount > 0
      ) {
        return;
      }
      cols = next.cols;
      rows = next.rows;
      const packed = buildParticleBuffer(cols, rows);
      fillEnd = packed.fillEnd;
      vertexCount = packed.vertexCount;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, packed.data, gl.STATIC_DRAW);
    };

    const bindAttributes = () => {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(aOrigin);
      gl.vertexAttribPointer(aOrigin, 2, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(aStart);
      gl.vertexAttribPointer(aStart, 2, gl.FLOAT, false, stride, 8);
      gl.enableVertexAttribArray(aCorner);
      gl.vertexAttribPointer(aCorner, 2, gl.FLOAT, false, stride, 16);
      gl.enableVertexAttribArray(aLife);
      gl.vertexAttribPointer(aLife, 3, gl.FLOAT, false, stride, 24);
    };

    const colors = () => usePageColor.getState();

    const drawIdle = () => {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    };

    const drawParticles = (time: number) => {
      const { current } = colors();
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      // biome-ignore lint/correctness/useHookAtTopLevel: not a hook
      gl.useProgram(program);
      bindAttributes();
      setResolutionUniform(gl, uResolution);
      if (uGrid) gl.uniform2f(uGrid, cols, rows);
      if (uTime) gl.uniform1f(uTime, time);
      if (uColor) gl.uniform3f(uColor, current[0], current[1], current[2]);
      gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
    };

    const loop = () => {
      if (!running) return;
      if (vertexCount === 0) {
        raf = requestAnimationFrame(loop);
        return;
      }
      const time = performance.now() / 1000 - startedAt;
      if (time >= fillEnd) {
        filled = true;
        drawIdle();
        markCovered();
        return;
      }
      drawParticles(time);
      raf = requestAnimationFrame(loop);
    };

    const play = (mode: PlayMode) => {
      cancelAnimationFrame(raf);
      overlay = mode === "overlay";
      notifiedCover = false;
      if (reduceMotion) {
        filled = true;
        drawIdle();
        markCovered();
        return;
      }
      filled = false;
      startedAt = performance.now() / 1000;
      cols = 0;
      rows = 0;
      vertexCount = 0;
      uploadParticles(true);
      loop();
    };

    apiRef.current = { play };

    const unsubColor = usePageColor.subscribe((state, prev) => {
      if (state.current === prev.current && state.previous === prev.previous) {
        return;
      }
      if (filled || reduceMotion) drawIdle();
    });

    const disconnectResize = observeCanvasPixelSize(canvas, () => {
      if (!filled && !reduceMotion) uploadParticles();
      const time = performance.now() / 1000 - startedAt;
      if (filled || reduceMotion) {
        drawIdle();
        return;
      }
      drawParticles(time);
    });

    play("overlay");

    return () => {
      running = false;
      apiRef.current = null;
      cancelAnimationFrame(raf);
      unsubColor();
      disconnectResize();
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, []);

  useLayoutEffect(() => {
    if (generation === 0) return;
    apiRef.current?.play("overlay");
  }, [generation]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 z-40 h-svh w-full",
        className,
      )}
      style={CANVAS_STYLE}
    />
  );
};

export default HomeBackgroundCanvas;
