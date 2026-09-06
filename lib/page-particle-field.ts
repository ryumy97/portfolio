import { PAGE_COLOR, type Rgb } from "@/lib/page-color";
import {
  bindFramebuffer,
  createFramebuffer,
  createFullscreenTriangleBuffer,
  createProgram,
  deleteFramebuffer,
  drawFullscreenTriangle,
  type FramebufferTarget,
  FULLSCREEN_VS,
  getWebGLContext,
  resizeFramebuffer,
  setResolutionUniform,
} from "@/lib/webgl";

/** CSS px. Circles overlap enough to cover every cell, including jitter. */
const TARGET_CELL = 128;
const VERTS_PER_PARTICLE = 6;
const FLOATS_PER_VERT = 9;
const METABALL_RADIUS_SCALE = 3;
const METABALL_THRESHOLD = 0.42;
const METABALL_SOFTNESS = 0.01;
export const SETTLED_TIME = 1e6;
/** Incoming DOM starts when this share of particles look landed (ease-out). */
const REVEAL_FRACTION = 0.5;
const REVEAL_PATH_PROGRESS = 0.85;

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
uniform float u_ease_in;

varying vec2 v_corner;

void main() {
  float delay = a_life.x;
  float travel = a_life.y;
  float sizeScale = a_life.z;
  float t = clamp((u_time - delay) / max(travel, 0.0001), 0.0, 1.0);
  float eOut = 1.0 - pow(1.0 - t, 4.0);
  float eIn = t * t * t * t;
  float e = mix(eOut, eIn, u_ease_in);
  v_corner = a_corner;

  vec2 pos = mix(a_start, a_origin, e);

  vec2 cell = u_resolution / max(u_grid, vec2(1.0));
  float radiusPx = length(cell) * 0.5 * sizeScale * ${METABALL_RADIUS_SCALE.toFixed(2)};
  vec2 offset = a_corner * radiusPx * 2.0 / u_resolution;
  gl_Position = vec4(pos + offset, 0.0, 1.0);
}
`;

const BLOB_FS = `
precision mediump float;
varying vec2 v_corner;

void main() {
  float r2 = dot(v_corner, v_corner);
  if (r2 > 1.0) discard;
  float falloff = 1.0 - r2;
  float field = falloff * falloff;
  gl_FragColor = vec4(field, field, field, field);
}
`;

const THRESHOLD_FS = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D u_field;
uniform vec3 u_color;
uniform float u_threshold;
uniform float u_softness;

void main() {
  float density = texture2D(u_field, vUv).r;
  float alpha = smoothstep(
    u_threshold - u_softness,
    u_threshold + u_softness,
    density
  );
  if (alpha < 0.004) discard;
  gl_FragColor = vec4(u_color, alpha);
}
`;

const RING_FS = `
precision mediump float;
varying vec2 v_corner;
uniform vec3 u_color;

void main() {
  float r = length(v_corner);
  if (r > 1.0 || r < 0.86) discard;
  float lum = dot(u_color, vec3(0.299, 0.587, 0.114));
  vec3 stroke = lum > 0.5
    ? vec3(0.118, 0.118, 0.118)
    : vec3(0.976, 0.973, 0.961);
  gl_FragColor = vec4(stroke, 1.0);
}
`;

const DEBUG_PATH_VS = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const DEBUG_COLOR_FS = `
precision mediump float;
uniform vec3 u_color;
void main() {
  gl_FragColor = vec4(u_color, 1.0);
}
`;

const DEBUG_ARROW_VS = `
attribute vec2 a_tip;
attribute vec2 a_from;
attribute vec2 a_vert;
uniform vec2 u_resolution;
uniform float u_size;

void main() {
  vec2 dir = a_tip - a_from;
  float d = length(dir);
  dir = d > 0.0001 ? dir / d : vec2(1.0, 0.0);
  vec2 perp = vec2(-dir.y, dir.x);
  vec2 local = dir * a_vert.x + perp * a_vert.y;
  vec2 offset = local * u_size * 2.0 / max(u_resolution, vec2(1.0));
  gl_Position = vec4(a_tip + offset, 0.0, 1.0);
}
`;

const ARROW_SIZE_PX = 12;
const ARROW_WINGS: Array<[number, number]> = [
  [0, 0],
  [-1, 0.55],
  [-1, -0.55],
];

export type ParticleField = {
  data: Float32Array;
  vertexCount: number;
  cols: number;
  rows: number;
  color: Rgb;
};

export type ParticleFieldRenderer = {
  upload: (
    field: Pick<ParticleField, "data" | "vertexCount" | "cols" | "rows">,
  ) => void;
  draw: (time: number, color: Rgb, debug?: boolean, easeIn?: boolean) => void;
  drawIdle: () => void;
  destroy: () => void;
};

export type GatherSide = "left" | "right";
export type ParticleOrigin = GatherSide | "all";

/** Clip space for -50vw / 50vh (left) and 150vw / 50vh (right). */
export const GATHER_CLIP: Record<GatherSide, readonly [number, number]> = {
  left: [-2, 0],
  right: [2, 0],
};

export function oppositeGather(side: GatherSide): GatherSide {
  return side === "left" ? "right" : "left";
}

function debugMotionColor(page: Rgb): Rgb {
  const coral = PAGE_COLOR.coral;
  const dist =
    Math.abs(page[0] - coral[0]) +
    Math.abs(page[1] - coral[1]) +
    Math.abs(page[2] - coral[2]);
  return dist < 0.2 ? PAGE_COLOR.cobalt : PAGE_COLOR.coral;
}

function buildDebugGeometry(data: Float32Array, vertexCount: number) {
  const count = Math.floor(vertexCount / VERTS_PER_PARTICLE);
  const path = new Float32Array(count * 4);
  const arrows = new Float32Array(count * ARROW_WINGS.length * 6);

  for (let i = 0; i < count; i++) {
    const src = i * VERTS_PER_PARTICLE * FLOATS_PER_VERT;
    const ox = data[src];
    const oy = data[src + 1];
    const sx = data[src + 2];
    const sy = data[src + 3];
    path[i * 4] = sx;
    path[i * 4 + 1] = sy;
    path[i * 4 + 2] = ox;
    path[i * 4 + 3] = oy;

    let offset = i * ARROW_WINGS.length * 6;
    for (const [vx, vy] of ARROW_WINGS) {
      arrows[offset] = ox;
      arrows[offset + 1] = oy;
      arrows[offset + 2] = sx;
      arrows[offset + 3] = sy;
      arrows[offset + 4] = vx;
      arrows[offset + 5] = vy;
      offset += 6;
    }
  }

  return {
    path,
    arrows,
    pathVertexCount: count * 2,
    arrowVertexCount: count * ARROW_WINGS.length,
  };
}

function fract(value: number) {
  return value - Math.floor(value);
}

function hash(i: number, j: number, salt: number) {
  return fract(Math.sin(i * 12.9898 + j * 78.233 + salt * 37.719) * 43758.5453);
}

function startFromGather(side: GatherSide): [number, number] {
  const [gx, gy] = GATHER_CLIP[side];
  return [
    gx + (Math.random() - 0.5) * 0.4,
    gy + (Math.random() * 2 - 1) * 1.25,
  ];
}

function randomStart(): [number, number] {
  const side = Math.floor(Math.random() * 4);
  const along = (Math.random() * 2 - 1) * 1.5;
  const out = 2 + Math.random() * 0.75;
  if (side === 0) return [out, along];
  if (side === 1) return [-out, along];
  if (side === 2) return [along, out];
  return [along, -out];
}

export function gridForCanvas(canvas: HTMLCanvasElement) {
  return {
    cols: Math.max(8, Math.ceil(canvas.clientWidth / TARGET_CELL)),
    rows: Math.max(8, Math.ceil(canvas.clientHeight / TARGET_CELL)),
  };
}

/** Clock time when any particle has traveled `progress` of its path. */
export function firstMotionTime(
  data: Float32Array,
  easeIn = false,
  progress = 0.02,
) {
  const stride = VERTS_PER_PARTICLE * FLOATS_PER_VERT;
  const count = Math.floor(data.length / stride);
  const tAt = easeIn ? progress ** 0.25 : 1 - (1 - progress) ** 0.25;
  let earliest = Number.POSITIVE_INFINITY;
  for (let i = 0; i < count; i++) {
    earliest = Math.min(
      earliest,
      data[i * stride + 6] + data[i * stride + 7] * tAt,
    );
  }
  return Number.isFinite(earliest) ? earliest : 0;
}

function easeOutQuarticTime(progress: number) {
  return 1 - (1 - progress) ** 0.25;
}

/** Time when `fraction` of particles have reached rest (delay + travel). */
export function coverageTime(arrivals: number[], fraction = 0.5) {
  if (arrivals.length === 0) return 0;
  const sorted = arrivals.slice().sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil(sorted.length * fraction) - 1);
  return sorted[index] ?? 0;
}

export function retargetParticleBuffer(data: Float32Array, side: GatherSide) {
  const copy = data.slice();
  const count = Math.floor(
    copy.length / (VERTS_PER_PARTICLE * FLOATS_PER_VERT),
  );
  let fillEnd = 0;

  for (let i = 0; i < count; i++) {
    const src = i * VERTS_PER_PARTICLE * FLOATS_PER_VERT;
    const restX = copy[src];
    const restY = copy[src + 1];
    const delay = 0;
    const travel = 0.7 + Math.random() * 0.4;
    fillEnd = Math.max(fillEnd, delay + travel);
    const [gx, gy] = startFromGather(side);

    for (let v = 0; v < VERTS_PER_PARTICLE; v++) {
      const offset = (i * VERTS_PER_PARTICLE + v) * FLOATS_PER_VERT;
      copy[offset] = gx;
      copy[offset + 1] = gy;
      copy[offset + 2] = restX;
      copy[offset + 3] = restY;
      copy[offset + 6] = delay;
      copy[offset + 7] = travel;
    }
  }

  return {
    data: copy,
    fillEnd,
    motionAt: firstMotionTime(copy, true),
  };
}

export function buildParticleBuffer(
  cols: number,
  rows: number,
  from: ParticleOrigin,
) {
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
        sizeScale: 1.8 + hash(col, row, 6.1) * 0.4,
      });
    }
  }

  const starts = Array.from({ length: count }, () =>
    from === "all" ? randomStart() : startFromGather(from),
  );
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
  const arrivals: number[] = [];
  let fillEnd = 0;
  let offset = 0;

  for (let i = 0; i < count; i++) {
    const [sx, sy] = starts[i];
    const rest = rests[restOfStart[i]];
    const delay = 0;
    const travel = 1.2 + Math.random() * 0.7;
    const arrival = delay + travel;
    arrivals.push(delay + travel * easeOutQuarticTime(REVEAL_PATH_PROGRESS));
    fillEnd = Math.max(fillEnd, arrival);

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

  return {
    data,
    fillEnd,
    revealAt: coverageTime(arrivals, REVEAL_FRACTION),
    vertexCount: count * VERTS_PER_PARTICLE,
  };
}

export function createParticleFieldRenderer(
  canvas: HTMLCanvasElement,
): ParticleFieldRenderer | null {
  const gl = getWebGLContext(canvas);
  if (!gl) return null;

  const blobProgram = createProgram(gl, VS, BLOB_FS);
  const ringProgram = createProgram(gl, VS, RING_FS);
  const thresholdProgram = createProgram(gl, FULLSCREEN_VS, THRESHOLD_FS);
  const pathProgram = createProgram(gl, DEBUG_PATH_VS, DEBUG_COLOR_FS);
  const arrowProgram = createProgram(gl, DEBUG_ARROW_VS, DEBUG_COLOR_FS);
  if (
    !blobProgram ||
    !ringProgram ||
    !thresholdProgram ||
    !pathProgram ||
    !arrowProgram
  ) {
    if (blobProgram) gl.deleteProgram(blobProgram);
    if (ringProgram) gl.deleteProgram(ringProgram);
    if (thresholdProgram) gl.deleteProgram(thresholdProgram);
    if (pathProgram) gl.deleteProgram(pathProgram);
    if (arrowProgram) gl.deleteProgram(arrowProgram);
    return null;
  }

  const buffer = gl.createBuffer();
  const pathBuffer = gl.createBuffer();
  const arrowBuffer = gl.createBuffer();
  const fullscreenBuffer = createFullscreenTriangleBuffer(gl);
  if (!buffer || !pathBuffer || !arrowBuffer || !fullscreenBuffer) {
    if (buffer) gl.deleteBuffer(buffer);
    if (pathBuffer) gl.deleteBuffer(pathBuffer);
    if (arrowBuffer) gl.deleteBuffer(arrowBuffer);
    if (fullscreenBuffer) gl.deleteBuffer(fullscreenBuffer);
    gl.deleteProgram(blobProgram);
    gl.deleteProgram(ringProgram);
    gl.deleteProgram(thresholdProgram);
    gl.deleteProgram(pathProgram);
    gl.deleteProgram(arrowProgram);
    return null;
  }

  let fieldTarget: FramebufferTarget | null = createFramebuffer(gl, 1, 1);
  if (!fieldTarget) {
    gl.deleteBuffer(buffer);
    gl.deleteBuffer(pathBuffer);
    gl.deleteBuffer(arrowBuffer);
    gl.deleteBuffer(fullscreenBuffer);
    gl.deleteProgram(blobProgram);
    gl.deleteProgram(ringProgram);
    gl.deleteProgram(thresholdProgram);
    gl.deleteProgram(pathProgram);
    gl.deleteProgram(arrowProgram);
    return null;
  }

  const stride = FLOATS_PER_VERT * 4;
  const blobAOrigin = gl.getAttribLocation(blobProgram, "a_origin");
  const blobAStart = gl.getAttribLocation(blobProgram, "a_start");
  const blobACorner = gl.getAttribLocation(blobProgram, "a_corner");
  const blobALife = gl.getAttribLocation(blobProgram, "a_life");
  const blobUResolution = gl.getUniformLocation(blobProgram, "u_resolution");
  const blobUGrid = gl.getUniformLocation(blobProgram, "u_grid");
  const blobUTime = gl.getUniformLocation(blobProgram, "u_time");
  const blobUEaseIn = gl.getUniformLocation(blobProgram, "u_ease_in");

  const ringAOrigin = gl.getAttribLocation(ringProgram, "a_origin");
  const ringAStart = gl.getAttribLocation(ringProgram, "a_start");
  const ringACorner = gl.getAttribLocation(ringProgram, "a_corner");
  const ringALife = gl.getAttribLocation(ringProgram, "a_life");
  const ringUResolution = gl.getUniformLocation(ringProgram, "u_resolution");
  const ringUGrid = gl.getUniformLocation(ringProgram, "u_grid");
  const ringUTime = gl.getUniformLocation(ringProgram, "u_time");
  const ringUEaseIn = gl.getUniformLocation(ringProgram, "u_ease_in");
  const ringUColor = gl.getUniformLocation(ringProgram, "u_color");

  const uField = gl.getUniformLocation(thresholdProgram, "u_field");
  const uThresholdColor = gl.getUniformLocation(thresholdProgram, "u_color");
  const uThreshold = gl.getUniformLocation(thresholdProgram, "u_threshold");
  const uSoftness = gl.getUniformLocation(thresholdProgram, "u_softness");

  const aPathPos = gl.getAttribLocation(pathProgram, "a_pos");
  const uPathColor = gl.getUniformLocation(pathProgram, "u_color");

  const aArrowTip = gl.getAttribLocation(arrowProgram, "a_tip");
  const aArrowFrom = gl.getAttribLocation(arrowProgram, "a_from");
  const aArrowVert = gl.getAttribLocation(arrowProgram, "a_vert");
  const uArrowResolution = gl.getUniformLocation(arrowProgram, "u_resolution");
  const uArrowSize = gl.getUniformLocation(arrowProgram, "u_size");
  const uArrowColor = gl.getUniformLocation(arrowProgram, "u_color");
  const arrowStride = 6 * 4;

  let vertexCount = 0;
  let pathVertexCount = 0;
  let arrowVertexCount = 0;
  let cols = 0;
  let rows = 0;

  const bindParticleAttributes = (
    aOrigin: number,
    aStart: number,
    aCorner: number,
    aLife: number,
  ) => {
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

  const ensureFieldTarget = (width: number, height: number) => {
    if (width < 1 || height < 1) return false;
    if (!fieldTarget) {
      fieldTarget = createFramebuffer(gl, width, height);
      return fieldTarget !== null;
    }
    resizeFramebuffer(gl, fieldTarget, width, height);
    return true;
  };

  const drawDebug = (color: Rgb) => {
    const motion = debugMotionColor(color);
    // biome-ignore lint/correctness/useHookAtTopLevel: not a hook
    gl.useProgram(pathProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, pathBuffer);
    gl.enableVertexAttribArray(aPathPos);
    gl.vertexAttribPointer(aPathPos, 2, gl.FLOAT, false, 0, 0);
    if (uPathColor) gl.uniform3f(uPathColor, motion[0], motion[1], motion[2]);
    gl.drawArrays(gl.LINES, 0, pathVertexCount);

    // biome-ignore lint/correctness/useHookAtTopLevel: not a hook
    gl.useProgram(arrowProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, arrowBuffer);
    gl.enableVertexAttribArray(aArrowTip);
    gl.vertexAttribPointer(aArrowTip, 2, gl.FLOAT, false, arrowStride, 0);
    gl.enableVertexAttribArray(aArrowFrom);
    gl.vertexAttribPointer(aArrowFrom, 2, gl.FLOAT, false, arrowStride, 8);
    gl.enableVertexAttribArray(aArrowVert);
    gl.vertexAttribPointer(aArrowVert, 2, gl.FLOAT, false, arrowStride, 16);
    setResolutionUniform(gl, uArrowResolution);
    if (uArrowSize) gl.uniform1f(uArrowSize, ARROW_SIZE_PX);
    if (uArrowColor) gl.uniform3f(uArrowColor, motion[0], motion[1], motion[2]);
    gl.drawArrays(gl.TRIANGLES, 0, arrowVertexCount);
  };

  return {
    upload(field) {
      cols = field.cols;
      rows = field.rows;
      vertexCount = field.vertexCount;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, field.data, gl.STATIC_DRAW);

      const debug = buildDebugGeometry(field.data, field.vertexCount);
      pathVertexCount = debug.pathVertexCount;
      arrowVertexCount = debug.arrowVertexCount;
      gl.bindBuffer(gl.ARRAY_BUFFER, pathBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, debug.path, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, arrowBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, debug.arrows, gl.STATIC_DRAW);
    },
    draw(time, color, debug = false, easeIn = false) {
      if (vertexCount === 0) return;
      const width = gl.drawingBufferWidth;
      const height = gl.drawingBufferHeight;
      if (!ensureFieldTarget(width, height) || !fieldTarget) return;

      bindFramebuffer(gl, fieldTarget);
      gl.viewport(0, 0, width, height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.blendEquation(gl.FUNC_ADD);
      // biome-ignore lint/correctness/useHookAtTopLevel: not a hook
      gl.useProgram(blobProgram);
      bindParticleAttributes(blobAOrigin, blobAStart, blobACorner, blobALife);
      setResolutionUniform(gl, blobUResolution);
      if (blobUGrid) gl.uniform2f(blobUGrid, cols, rows);
      if (blobUTime) gl.uniform1f(blobUTime, time);
      if (blobUEaseIn) gl.uniform1f(blobUEaseIn, easeIn ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
      gl.disable(gl.BLEND);

      bindFramebuffer(gl, null);
      gl.viewport(0, 0, width, height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      // biome-ignore lint/correctness/useHookAtTopLevel: not a hook
      gl.useProgram(thresholdProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fieldTarget.texture);
      if (uField) gl.uniform1i(uField, 0);
      if (uThresholdColor) {
        gl.uniform3f(uThresholdColor, color[0], color[1], color[2]);
      }
      if (uThreshold) gl.uniform1f(uThreshold, METABALL_THRESHOLD);
      if (uSoftness) gl.uniform1f(uSoftness, METABALL_SOFTNESS);
      drawFullscreenTriangle(gl, thresholdProgram, fullscreenBuffer);
      gl.bindTexture(gl.TEXTURE_2D, null);

      if (debug) {
        // biome-ignore lint/correctness/useHookAtTopLevel: not a hook
        gl.useProgram(ringProgram);
        bindParticleAttributes(ringAOrigin, ringAStart, ringACorner, ringALife);
        setResolutionUniform(gl, ringUResolution);
        if (ringUGrid) gl.uniform2f(ringUGrid, cols, rows);
        if (ringUTime) gl.uniform1f(ringUTime, time);
        if (ringUEaseIn) gl.uniform1f(ringUEaseIn, easeIn ? 1 : 0);
        if (ringUColor) gl.uniform3f(ringUColor, color[0], color[1], color[2]);
        gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
        drawDebug(color);
      }
    },
    drawIdle() {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    },
    destroy() {
      if (fieldTarget) deleteFramebuffer(gl, fieldTarget);
      gl.deleteBuffer(buffer);
      gl.deleteBuffer(pathBuffer);
      gl.deleteBuffer(arrowBuffer);
      gl.deleteBuffer(fullscreenBuffer);
      gl.deleteProgram(blobProgram);
      gl.deleteProgram(ringProgram);
      gl.deleteProgram(thresholdProgram);
      gl.deleteProgram(pathProgram);
      gl.deleteProgram(arrowProgram);
    },
  };
}
