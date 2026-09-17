import type { Rgb } from "@/lib/page-color";
import { createProgram, getWebGLContext } from "@/lib/webgl";

const RING_COUNT = 16;
const CURVE_STEPS = 12;
const CURVE_TENSION = 6;
const SPRING_PASSES = 3;
const SUBSTEPS = 3;
const STIFFNESS = 36;
const DAMPING = 2 * Math.sqrt(STIFFNESS) * 1.05;
const NEIGHBOR_STRENGTH = 0.22;
const SKIP_STRENGTH = 0.09;
const PRESSURE = 0.035;
const COVER_PAD = Math.SQRT2 * 1.06;
const SEED_RADIUS_FRACTION = 0.07;
const EXIT_DURATION = 1.45;
const ENTER_DURATION = 0.88;
const EXPAND_DURATION = 1.4;
const EXIT_SETTLE = 0.45;
const ENTER_SETTLE = 0.35;
const EXPAND_SETTLE = 0.55;
const LOBE_ENV_FLOOR = 0.22;
const LEAVE_PROGRESS = 0.02;
const MAX_DT = 1 / 40;
const PUSH_BIAS = 1.4;
const PUSH_PAD = 24;
const PUSH_GAIN = 0.55;

const VS = `
attribute vec2 a_pos;

void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FS = `
precision mediump float;
uniform vec3 u_color;

void main() {
  gl_FragColor = vec4(u_color, 1.0);
}
`;

export type ParticleField = {
  color: Rgb;
};

export type MotionTimes = {
  fillEnd: number;
  revealAt: number;
  motionAt: number;
};

export type ParticleFieldRenderer = {
  prepareExpand: () => MotionTimes;
  prepareEnter: (from: GatherSide) => MotionTimes;
  prepareExit: (side: GatherSide) => MotionTimes;
  prepareHandoff: (exitSide: GatherSide, enterFrom: GatherSide) => MotionTimes;
  draw: (time: number, color: Rgb, outgoingColor?: Rgb | null) => void;
  drawSettled: (color: Rgb) => void;
  drawIdle: () => void;
  destroy: () => void;
};

export type GatherSide = "left" | "right";
export type ParticleOrigin = GatherSide | "all";

export function oppositeGather(side: GatherSide): GatherSide {
  return side === "left" ? "right" : "left";
}

type Pose = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
};

type Motion = {
  kind: "expand" | "enter" | "exit";
  side: GatherSide;
  duration: number;
  easeIn: boolean;
  pushed?: boolean;
};

type SoftBlob = {
  x: Float32Array;
  y: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
};

function pixelToClip(
  x: number,
  y: number,
  width: number,
  height: number,
): [number, number] {
  return [(x / width) * 2 - 1, 1 - (y / height) * 2];
}

function coverPose(width: number, height: number): Pose {
  return {
    cx: width * 0.5,
    cy: height * 0.5,
    rx: width * 0.5 * COVER_PAD,
    ry: height * 0.5 * COVER_PAD,
  };
}

function seedPose(width: number, height: number): Pose {
  const radius = Math.min(width, height) * SEED_RADIUS_FRACTION;
  return {
    cx: width * 0.5,
    cy: height * 0.5,
    rx: radius,
    ry: radius,
  };
}

function gatherPose(
  side: GatherSide | "bottom",
  width: number,
  height: number,
  kind: "enter" | "exit" = "exit",
): Pose {
  const seed = seedPose(width, height);
  const cover = coverPose(width, height);
  const travel =
    kind === "enter" ? seed.rx * 2.4 : Math.max(cover.rx, seed.rx) * 1.15;
  if (side === "bottom") {
    return {
      cx: width * 0.5,
      cy: height + travel,
      rx: seed.rx,
      ry: seed.ry,
    };
  }
  return {
    cx: side === "left" ? -travel : width + travel,
    cy: height * 0.5,
    rx: seed.rx,
    ry: seed.ry,
  };
}

function mixPose(from: Pose, to: Pose, e: number): Pose {
  return {
    cx: from.cx + (to.cx - from.cx) * e,
    cy: from.cy + (to.cy - from.cy) * e,
    rx: from.rx + (to.rx - from.rx) * e,
    ry: from.ry + (to.ry - from.ry) * e,
  };
}

function settleTail(kind: Motion["kind"]) {
  if (kind === "exit") return EXIT_SETTLE;
  if (kind === "enter") return ENTER_SETTLE;
  return EXPAND_SETTLE;
}

function motionTimes(
  duration: number,
  easeIn: boolean,
  kind: Motion["kind"],
): MotionTimes {
  const fillEnd = duration + settleTail(kind);
  return {
    fillEnd,
    revealAt: fillEnd,
    motionAt: easeIn ? duration * LEAVE_PROGRESS ** 0.25 : fillEnd,
  };
}

function smootherstep(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
}

function curveProgress(time: number, duration: number, _kind: Motion["kind"]) {
  return smootherstep(time / Math.max(duration, 1e-4));
}

function ellipseRadius(rx: number, ry: number, angle: number) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return 1 / Math.hypot(c / Math.max(rx, 1e-4), s / Math.max(ry, 1e-4));
}

function ringAngle(index: number) {
  return (index / RING_COUNT) * Math.PI * 2;
}

function hash01(index: number, salt: number) {
  const x = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function travelDir(from: Pose, to: Pose): [number, number] {
  const dx = to.cx - from.cx;
  const dy = to.cy - from.cy;
  const len = Math.hypot(dx, dy);
  if (len < 1) return [0, 0];
  return [dx / len, dy / len];
}

function motionEnvelope(time: number, duration: number, kind: Motion["kind"]) {
  const floor = kind === "exit" ? 0.1 : LOBE_ENV_FLOOR;
  if (time >= duration) {
    return floor * (1 - smootherstep((time - duration) / settleTail(kind)));
  }
  const t = Math.min(1, Math.max(0, time / duration));
  return floor + (1 - floor) * Math.sin(Math.PI * t);
}

function particleEase(
  time: number,
  duration: number,
  index: number,
  kind: Motion["kind"],
  ux: number,
  uy: number,
) {
  const angle = ringAngle(index);
  let lag = hash01(index, 1.37) * (kind === "expand" ? 0.08 : 0.02);
  if (kind === "expand") {
    lag += 0.08 * (0.5 + 0.5 * Math.sin(2 * angle + 0.7));
    const facing = Math.cos(angle) * ux + Math.sin(angle) * uy;
    lag += (1 - facing) * 0.04;
  } else if (kind === "enter") {
    const facing = Math.cos(angle) * ux + Math.sin(angle) * uy;
    lag += (1 - facing) * 0.04;
  }
  return curveProgress(time - lag * duration, duration, kind);
}

function blobPoint(
  pose: Pose,
  index: number,
  env: number,
  ux: number,
  uy: number,
  stretch: number,
): [number, number] {
  const angle = ringAngle(index);
  let radius = ellipseRadius(pose.rx, pose.ry, angle);
  radius *=
    1 +
    env *
      (0.12 * Math.sin(2 * angle + 0.55) +
        0.06 * Math.sin(3 * angle + 1.85) +
        0.03 * Math.sin(5 * angle + 0.4));
  let lx = Math.cos(angle) * radius;
  let ly = Math.sin(angle) * radius;
  if (stretch !== 1) {
    if (ux !== 0 || uy !== 0) {
      const along = lx * ux + ly * uy;
      const px = lx - along * ux;
      const py = ly - along * uy;
      const squash = 1 / Math.sqrt(Math.max(stretch, 0.4));
      lx = along * ux * stretch + px * squash;
      ly = along * uy * stretch + py * squash;
    } else {
      const ca = Math.cos(0.55);
      const sa = Math.sin(0.55);
      const ax = lx * ca + ly * sa;
      const ay = -lx * sa + ly * ca;
      const sx = stretch;
      const sy = 1 / Math.sqrt(Math.max(sx, 0.4));
      const bx = ax * sx;
      const by = ay * sy;
      lx = bx * ca - by * sa;
      ly = bx * sa + by * ca;
    }
  }
  return [pose.cx + lx, pose.cy + ly];
}

function fieldStretch(
  env: number,
  ux: number,
  uy: number,
  kind: Motion["kind"] = "expand",
) {
  if (kind === "exit") return 1 + env * 0.05;
  const traveling = ux !== 0 || uy !== 0;
  return 1 + env * (traveling ? 0.18 : 0.12);
}

function deformGain(kind: Motion["kind"]) {
  return kind === "exit" ? 0 : 1;
}

function poseAt(
  from: Pose,
  to: Pose,
  motion: Motion,
  time: number,
  index?: number,
): Pose {
  const [ux, uy] = travelDir(from, to);
  const ease =
    index === undefined
      ? curveProgress(time, motion.duration, motion.kind)
      : particleEase(time, motion.duration, index, motion.kind, ux, uy);
  if (motion.kind === "exit") {
    const sizeE = ease ** 1.35;
    return {
      cx: from.cx + (to.cx - from.cx) * ease,
      cy: from.cy + (to.cy - from.cy) * ease,
      rx: from.rx + (to.rx - from.rx) * sizeE,
      ry: from.ry + (to.ry - from.ry) * sizeE,
    };
  }
  return mixPose(from, to, ease);
}

function particleTarget(
  from: Pose,
  to: Pose,
  motion: Motion,
  time: number,
  index: number,
): [number, number] {
  const [ux, uy] = travelDir(from, to);
  const env =
    motionEnvelope(time, motion.duration, motion.kind) *
    deformGain(motion.kind);
  const pose = poseAt(from, to, motion, time, index);
  return blobPoint(
    pose,
    index,
    env,
    ux,
    uy,
    fieldStretch(env, ux, uy, motion.kind),
  );
}

function placeRing(blob: SoftBlob, pose: Pose, env = 0) {
  const stretch = fieldStretch(env, 0, 0);
  for (let i = 0; i < RING_COUNT; i++) {
    const [x, y] = blobPoint(pose, i, env, 0, 0, stretch);
    blob.x[i] = x;
    blob.y[i] = y;
    blob.vx[i] = 0;
    blob.vy[i] = 0;
  }
}

function centroid(blob: SoftBlob): [number, number] {
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < RING_COUNT; i++) {
    cx += blob.x[i];
    cy += blob.y[i];
  }
  return [cx / RING_COUNT, cy / RING_COUNT];
}

function signedArea(blob: SoftBlob) {
  let area = 0;
  for (let i = 0; i < RING_COUNT; i++) {
    const j = (i + 1) % RING_COUNT;
    area += blob.x[i] * blob.y[j] - blob.x[j] * blob.y[i];
  }
  return area * 0.5;
}

function solvePair(
  blob: SoftBlob,
  i: number,
  j: number,
  rest: number,
  strength: number,
) {
  const dx = blob.x[j] - blob.x[i];
  const dy = blob.y[j] - blob.y[i];
  const dist = Math.hypot(dx, dy);
  if (dist <= 1e-6) return;
  const diff = ((dist - rest) / dist) * strength * 0.5;
  blob.x[i] += dx * diff;
  blob.y[i] += dy * diff;
  blob.x[j] -= dx * diff;
  blob.y[j] -= dy * diff;
}

function neighborRest(
  from: Pose,
  to: Pose,
  motion: Motion,
  time: number,
  i: number,
  step: number,
) {
  const [ax, ay] = particleTarget(from, to, motion, time, i);
  const [bx, by] = particleTarget(
    from,
    to,
    motion,
    time,
    (i + step) % RING_COUNT,
  );
  return Math.hypot(bx - ax, by - ay);
}

function ringIndex(index: number) {
  return (index + RING_COUNT) % RING_COUNT;
}

function cubicPoint(
  x1: number,
  y1: number,
  c1x: number,
  c1y: number,
  c2x: number,
  c2y: number,
  x2: number,
  y2: number,
  t: number,
): [number, number] {
  const u = 1 - t;
  const uu = u * u;
  const tt = t * t;
  return [
    uu * u * x1 + 3 * uu * t * c1x + 3 * u * tt * c2x + tt * t * x2,
    uu * u * y1 + 3 * uu * t * c1y + 3 * u * tt * c2y + tt * t * y2,
  ];
}

function segmentCurve(xs: ArrayLike<number>, ys: ArrayLike<number>, i: number) {
  const i0 = ringIndex(i - 1);
  const i1 = ringIndex(i);
  const i2 = ringIndex(i + 1);
  const i3 = ringIndex(i + 2);
  const x1 = xs[i1];
  const y1 = ys[i1];
  const x2 = xs[i2];
  const y2 = ys[i2];
  return {
    x1,
    y1,
    x2,
    y2,
    c1x: x1 + (x2 - xs[i0]) / CURVE_TENSION,
    c1y: y1 + (y2 - ys[i0]) / CURVE_TENSION,
    c2x: x2 - (xs[i3] - x1) / CURVE_TENSION,
    c2y: y2 - (ys[i3] - y1) / CURVE_TENSION,
  };
}

function motionPose(
  motion: Motion,
  width: number,
  height: number,
): { from: Pose; to: Pose } {
  const cover = coverPose(width, height);
  if (motion.kind === "expand") {
    return { from: gatherPose("bottom", width, height, "enter"), to: cover };
  }
  if (motion.kind === "enter") {
    return { from: gatherPose(motion.side, width, height, "enter"), to: cover };
  }
  return { from: cover, to: gatherPose(motion.side, width, height, "exit") };
}

function pointInBlob(blob: SoftBlob, px: number, py: number) {
  let inside = false;
  for (let i = 0; i < RING_COUNT; i++) {
    const j = (i + 1) % RING_COUNT;
    const yi = blob.y[i];
    const yj = blob.y[j];
    const across = yi > py !== yj > py;
    if (!across) continue;
    const xi = blob.x[i];
    const t = (py - yi) / (yj - yi || 1e-6);
    if (px < xi + t * (blob.x[j] - xi)) inside = !inside;
  }
  return inside;
}

function blobExtent(blob: SoftBlob): [number, number, number] {
  const [cx, cy] = centroid(blob);
  let radius = 0;
  for (let i = 0; i < RING_COUNT; i++) {
    radius = Math.max(radius, Math.hypot(blob.x[i] - cx, blob.y[i] - cy));
  }
  return [cx, cy, radius];
}

function pushBlob(
  leaving: SoftBlob,
  incoming: SoftBlob,
  ux: number,
  uy: number,
) {
  const [icx, icy, ir] = blobExtent(incoming);
  const solid = ir + PUSH_PAD;
  if (solid < 8) return;

  for (let i = 0; i < RING_COUNT; i++) {
    const dx = leaving.x[i] - icx;
    const dy = leaving.y[i] - icy;
    const dist = Math.hypot(dx, dy);
    const engulfed =
      dist < solid || pointInBlob(incoming, leaving.x[i], leaving.y[i]);
    if (!engulfed) continue;

    let nx: number;
    let ny: number;
    if (dist < 1e-3) {
      nx = ux;
      ny = uy;
    } else {
      nx = dx / dist + ux * PUSH_BIAS;
      ny = dy / dist + uy * PUSH_BIAS;
    }
    const n = Math.hypot(nx, ny) || 1;
    nx /= n;
    ny /= n;
    const overlap = Math.max(solid - dist, PUSH_PAD);
    const corr = overlap * PUSH_GAIN;
    leaving.x[i] += nx * corr;
    leaving.y[i] += ny * corr;
    const along = leaving.vx[i] * nx + leaving.vy[i] * ny;
    const want = overlap * 6;
    if (along < want) {
      leaving.vx[i] += nx * (want - along);
      leaving.vy[i] += ny * (want - along);
    }
  }
}

function stepBlob(
  blob: SoftBlob,
  motion: Motion,
  width: number,
  height: number,
  time: number,
  dt: number,
  pusher?: SoftBlob,
) {
  const steps = SUBSTEPS;
  const h = dt / steps;
  for (let step = 1; step <= steps; step++) {
    integrateBlob(blob, motion, width, height, time - dt + h * step, h);
  }
  if (!pusher || !motion.pushed) return;
  const { from, to } = motionPose(motion, width, height);
  const [ux, uy] = travelDir(from, to);
  pushBlob(blob, pusher, ux, uy);
}

function integrateBlob(
  blob: SoftBlob,
  motion: Motion,
  width: number,
  height: number,
  time: number,
  dt: number,
) {
  const { from, to } = motionPose(motion, width, height);
  const pose = poseAt(from, to, motion, time);
  const collecting = motion.kind === "exit";
  const pushed = Boolean(motion.pushed);
  const stiffness = pushed ? 10 : collecting ? 40 : STIFFNESS;
  const damping = pushed
    ? 2 * Math.sqrt(Math.max(stiffness, 16)) * 1.15
    : collecting
      ? 2 * Math.sqrt(stiffness) * 1.05
      : DAMPING;
  const neighbor = pushed ? 0.3 : collecting ? 0.26 : NEIGHBOR_STRENGTH;
  const skip = pushed ? 0.14 : collecting ? 0.11 : SKIP_STRENGTH;
  const [cx, cy] = centroid(blob);
  const area = signedArea(blob);
  const targetArea = Math.PI * pose.rx * pose.ry;
  const inflate = (targetArea - area) * PRESSURE;

  for (let i = 0; i < RING_COUNT; i++) {
    const [tx, ty] = particleTarget(from, to, motion, time, i);
    const nx = blob.x[i] - cx;
    const ny = blob.y[i] - cy;
    const n = Math.hypot(nx, ny) || 1;
    const ax =
      stiffness * (tx - blob.x[i]) - damping * blob.vx[i] + (nx / n) * inflate;
    const ay =
      stiffness * (ty - blob.y[i]) - damping * blob.vy[i] + (ny / n) * inflate;
    blob.vx[i] += ax * dt;
    blob.vy[i] += ay * dt;
    blob.x[i] += blob.vx[i] * dt;
    blob.y[i] += blob.vy[i] * dt;
  }

  for (let pass = SPRING_PASSES; pass--; ) {
    for (let i = 0; i < RING_COUNT; i++) {
      solvePair(
        blob,
        i,
        (i + 1) % RING_COUNT,
        neighborRest(from, to, motion, time, i, 1),
        neighbor,
      );
      solvePair(
        blob,
        i,
        (i + 2) % RING_COUNT,
        neighborRest(from, to, motion, time, i, 2),
        skip,
      );
    }
  }
}

function createBlob(): SoftBlob {
  return {
    x: new Float32Array(RING_COUNT),
    y: new Float32Array(RING_COUNT),
    vx: new Float32Array(RING_COUNT),
    vy: new Float32Array(RING_COUNT),
  };
}

function copyBlob(from: SoftBlob, to: SoftBlob) {
  to.x.set(from.x);
  to.y.set(from.y);
  to.vx.set(from.vx);
  to.vy.set(from.vy);
}

function scaleBlob(blob: SoftBlob, sx: number, sy: number) {
  for (let i = 0; i < RING_COUNT; i++) {
    blob.x[i] *= sx;
    blob.y[i] *= sy;
    blob.vx[i] *= sx;
    blob.vy[i] *= sy;
  }
}

export function createParticleFieldRenderer(
  canvas: HTMLCanvasElement,
): ParticleFieldRenderer | null {
  const gl = getWebGLContext(canvas);
  if (!gl) return null;

  const program = createProgram(gl, VS, FS);
  if (!program) return null;

  const buffer = gl.createBuffer();
  if (!buffer) {
    gl.deleteProgram(program);
    return null;
  }

  const aPos = gl.getAttribLocation(program, "a_pos");
  const uColor = gl.getUniformLocation(program, "u_color");
  const blob = createBlob();
  const leavingBlob = createBlob();
  const mesh = new Float32Array(RING_COUNT * CURVE_STEPS * 6);
  let vertCount = 0;

  let motion: Motion | null = null;
  let leavingMotion: Motion | null = null;
  let lastTime = 0;
  let hasTime = false;
  let simWidth = 0;
  let simHeight = 0;

  const size = () => ({
    width: gl.drawingBufferWidth,
    height: gl.drawingBufferHeight,
  });

  const syncSize = (width: number, height: number) => {
    if (simWidth > 0 && (simWidth !== width || simHeight !== height)) {
      const sx = width / simWidth;
      const sy = height / simHeight;
      scaleBlob(blob, sx, sy);
      scaleBlob(leavingBlob, sx, sy);
    }
    simWidth = width;
    simHeight = height;
  };

  const fillMesh = (source: SoftBlob, width: number, height: number) => {
    const [cx, cy] = centroid(source);
    const [ccx, ccy] = pixelToClip(cx, cy, width, height);
    let offset = 0;
    for (let i = 0; i < RING_COUNT; i++) {
      const curve = segmentCurve(source.x, source.y, i);
      let [px, py] = pixelToClip(curve.x1, curve.y1, width, height);
      for (let step = 1; step <= CURVE_STEPS; step++) {
        const [qx, qy] = cubicPoint(
          curve.x1,
          curve.y1,
          curve.c1x,
          curve.c1y,
          curve.c2x,
          curve.c2y,
          curve.x2,
          curve.y2,
          step / CURVE_STEPS,
        );
        const [sx, sy] = pixelToClip(qx, qy, width, height);
        mesh[offset] = ccx;
        mesh[offset + 1] = ccy;
        mesh[offset + 2] = px;
        mesh[offset + 3] = py;
        mesh[offset + 4] = sx;
        mesh[offset + 5] = sy;
        offset += 6;
        px = sx;
        py = sy;
      }
    }
    vertCount = RING_COUNT * CURVE_STEPS * 3;
  };

  const paint = (color: Rgb, width: number, height: number, clear: boolean) => {
    gl.viewport(0, 0, width, height);
    if (clear) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      mesh.subarray(0, vertCount * 2),
      gl.DYNAMIC_DRAW,
    );
    // biome-ignore lint/correctness/useHookAtTopLevel: not a hook
    gl.useProgram(program);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    if (uColor) gl.uniform3f(uColor, color[0], color[1], color[2]);
    gl.disable(gl.BLEND);
    gl.drawArrays(gl.TRIANGLES, 0, vertCount);
  };

  const finishMotion = (active: Motion | null, time: number) => {
    if (!active) return null;
    if (time >= active.duration + settleTail(active.kind)) return null;
    return active;
  };

  const render = (
    color: Rgb,
    time: number,
    dt: number,
    outgoingColor: Rgb | null,
  ) => {
    const { width, height } = size();
    if (width < 1 || height < 1) return;
    syncSize(width, height);
    if (motion && dt > 0) {
      stepBlob(blob, motion, width, height, time, dt);
    }
    if (leavingMotion && dt > 0) {
      stepBlob(
        leavingBlob,
        leavingMotion,
        width,
        height,
        time,
        dt,
        motion ? blob : undefined,
      );
    }
    const drawLeaving = Boolean(leavingMotion && outgoingColor);
    fillMesh(drawLeaving ? leavingBlob : blob, width, height);
    paint(
      drawLeaving && outgoingColor ? outgoingColor : color,
      width,
      height,
      true,
    );
    if (drawLeaving) {
      fillMesh(blob, width, height);
      paint(color, width, height, false);
    }
    leavingMotion = finishMotion(leavingMotion, time);
    motion = finishMotion(motion, time);
  };

  return {
    prepareExpand() {
      const { width, height } = size();
      leavingMotion = null;
      motion = {
        kind: "expand",
        side: "left",
        duration: EXPAND_DURATION,
        easeIn: false,
      };
      placeRing(
        blob,
        gatherPose("bottom", width, height, "enter"),
        LOBE_ENV_FLOOR,
      );
      hasTime = false;
      lastTime = 0;
      simWidth = width;
      simHeight = height;
      return motionTimes(EXPAND_DURATION, false, "expand");
    },
    prepareEnter(fromSide) {
      const { width, height } = size();
      leavingMotion = null;
      motion = {
        kind: "enter",
        side: fromSide,
        duration: ENTER_DURATION,
        easeIn: false,
      };
      placeRing(
        blob,
        gatherPose(fromSide, width, height, "enter"),
        LOBE_ENV_FLOOR,
      );
      hasTime = false;
      lastTime = 0;
      simWidth = width;
      simHeight = height;
      return motionTimes(ENTER_DURATION, false, "enter");
    },
    prepareExit(side) {
      const { width, height } = size();
      leavingMotion = null;
      motion = {
        kind: "exit",
        side,
        duration: EXIT_DURATION,
        easeIn: true,
      };
      hasTime = true;
      lastTime = 0;
      simWidth = width;
      simHeight = height;
      return motionTimes(EXIT_DURATION, true, "exit");
    },
    prepareHandoff(exitSide, enterFrom) {
      const { width, height } = size();
      copyBlob(blob, leavingBlob);
      leavingMotion = {
        kind: "exit",
        side: exitSide,
        duration: EXIT_DURATION,
        easeIn: true,
        pushed: true,
      };
      motion = {
        kind: "enter",
        side: enterFrom,
        duration: ENTER_DURATION,
        easeIn: false,
      };
      placeRing(
        blob,
        gatherPose(enterFrom, width, height, "enter"),
        LOBE_ENV_FLOOR,
      );
      hasTime = false;
      lastTime = 0;
      simWidth = width;
      simHeight = height;
      const enter = motionTimes(ENTER_DURATION, false, "enter");
      const exit = motionTimes(EXIT_DURATION, true, "exit");
      return {
        fillEnd: Math.max(enter.fillEnd, exit.fillEnd),
        revealAt: enter.fillEnd,
        motionAt: 0,
      };
    },
    draw(time, color, outgoingColor = null) {
      const dt = hasTime ? Math.min(MAX_DT, Math.max(0, time - lastTime)) : 0;
      lastTime = time;
      hasTime = true;
      render(color, time, dt, outgoingColor ?? null);
    },
    drawSettled(color) {
      const { width, height } = size();
      if (width < 1 || height < 1) return;
      leavingMotion = null;
      motion = null;
      hasTime = false;
      lastTime = 0;
      simWidth = width;
      simHeight = height;
      placeRing(blob, coverPose(width, height));
      render(color, 0, 0, null);
    },
    drawIdle() {
      leavingMotion = null;
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    },
    destroy() {
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    },
  };
}
