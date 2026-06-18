import { dyno, type GsplatModifier, type SplatMesh } from "@sparkjsdev/spark";
import { Vector3, type Camera } from "three";

const {
  Gsplat,
  dynoBlock,
  splitGsplat,
  combineGsplat,
  add,
  mul,
  sub,
  div,
  neg,
  split,
  max,
  clamp,
  dynoConst,
  dynoFloat,
} = dyno;

const WORLD_CENTER = new Vector3();
const VIEW_CENTER = new Vector3();

const DEPTH_SAMPLE_TARGET = 5000;
const DEPTH_RANGE_PADDING = 0.02;

export type StaggerRevealOptions = {
  delayMs?: number;
  staggerMs?: number;
  growMs?: number;
  minDepth?: number;
  maxDepth?: number;
  camera?: Camera;
};

export type StaggerRevealController = {
  start: (clockTimeSeconds: number) => void;
  tick: () => void;
  isComplete: (clockTimeSeconds: number) => boolean;
  detach: () => void;
};

export function computeSplatDepthRange(
  splatMesh: SplatMesh,
  camera: Camera,
): { minDepth: number; maxDepth: number } {
  const numSplats = splatMesh.numSplats;
  if (numSplats <= 0) {
    return { minDepth: 0, maxDepth: 1 };
  }

  const stride = Math.max(1, Math.floor(numSplats / DEPTH_SAMPLE_TARGET));

  camera.updateWorldMatrix(true, false);
  splatMesh.updateWorldMatrix(true, false);

  const viewMatrix = camera.matrixWorldInverse;

  let minDepth = Number.POSITIVE_INFINITY;
  let maxDepth = Number.NEGATIVE_INFINITY;

  splatMesh.forEachSplat((index, center) => {
    if (index % stride !== 0) return;

    WORLD_CENTER.copy(center).applyMatrix4(splatMesh.matrixWorld);
    VIEW_CENTER.copy(WORLD_CENTER).applyMatrix4(viewMatrix);
    const depth = -VIEW_CENTER.z;

    if (!Number.isFinite(depth)) return;

    minDepth = Math.min(minDepth, depth);
    maxDepth = Math.max(maxDepth, depth);
  });

  if (!Number.isFinite(minDepth)) {
    return { minDepth: 0, maxDepth: 1 };
  }

  const span = Math.max(maxDepth - minDepth, 1e-3);
  const padding = span * DEPTH_RANGE_PADDING;

  return {
    minDepth: minDepth - padding,
    maxDepth: maxDepth + padding,
  };
}

function makeStaggerRevealModifier({
  time,
  revealStartTime,
  minDepth,
  maxDepth,
  worldToView,
  delay,
  staggerSpread,
  growDuration,
}: {
  time: SplatMesh["context"]["time"];
  revealStartTime: ReturnType<typeof dynoFloat>;
  minDepth: ReturnType<typeof dynoFloat>;
  maxDepth: ReturnType<typeof dynoFloat>;
  worldToView: SplatMesh["context"]["worldToView"];
  delay: ReturnType<typeof dynoFloat>;
  staggerSpread: ReturnType<typeof dynoFloat>;
  growDuration: ReturnType<typeof dynoFloat>;
}): GsplatModifier {
  return dynoBlock({ gsplat: Gsplat }, { gsplat: Gsplat }, ({ gsplat }) => {
    if (!gsplat) {
      throw new Error("No gsplat input");
    }

    const { center, scales, opacity } = splitGsplat(gsplat).outputs;
    const zero = dynoConst("float", 0);
    const one = dynoConst("float", 1);
    const elapsed = sub(time, revealStartTime);
    const viewCenter = worldToView.apply(center);
    const depth = neg(split(viewCenter).outputs.z);
    const range = max(sub(maxDepth, minDepth), dynoConst("float", 1e-6));
    const order = clamp(div(sub(depth, minDepth), range), zero, one);
    const startTime = add(delay, mul(order, staggerSpread));
    const linearT = clamp(
      div(sub(elapsed, startTime), growDuration),
      zero,
      one,
    );
    const inv = sub(one, linearT);
    const eased = sub(one, mul(mul(inv, inv), inv));

    return {
      gsplat: combineGsplat({
        gsplat,
        scales: mul(scales, eased),
        opacity: mul(opacity, eased),
      }),
    };
  });
}

export function attachStaggerReveal(
  splatMesh: SplatMesh,
  {
    delayMs = 500,
    staggerMs = 3000,
    growMs = 350,
    minDepth,
    maxDepth,
    camera,
  }: StaggerRevealOptions = {},
): StaggerRevealController {
  if (!camera) {
    throw new Error("attachStaggerReveal requires a camera");
  }

  const depthRange =
    minDepth !== undefined && maxDepth !== undefined
      ? { minDepth, maxDepth }
      : computeSplatDepthRange(splatMesh, camera);

  const revealStartTime = dynoFloat(Number.POSITIVE_INFINITY);
  const dynoMinDepth = dynoFloat(depthRange.minDepth);
  const dynoMaxDepth = dynoFloat(depthRange.maxDepth);
  const delay = dynoFloat(delayMs / 1000);
  const staggerSpread = dynoFloat(staggerMs / 1000);
  const growDuration = dynoFloat(growMs / 1000);
  const totalDurationSec = delayMs / 1000 + staggerMs / 1000 + growMs / 1000;

  splatMesh.enableWorldToView = true;

  const modifier = makeStaggerRevealModifier({
    time: splatMesh.context.time,
    revealStartTime,
    minDepth: dynoMinDepth,
    maxDepth: dynoMaxDepth,
    worldToView: splatMesh.context.worldToView,
    delay,
    staggerSpread,
    growDuration,
  });

  splatMesh.worldModifier = modifier;
  splatMesh.updateGenerator();

  return {
    start: (clockTimeSeconds: number) => {
      revealStartTime.value = clockTimeSeconds;
      splatMesh.updateVersion();
    },
    tick: () => {
      splatMesh.updateVersion();
    },
    isComplete: (clockTimeSeconds: number) => {
      if (!Number.isFinite(revealStartTime.value)) return false;
      return clockTimeSeconds - revealStartTime.value >= totalDurationSec;
    },
    detach: () => {
      splatMesh.worldModifier = undefined;
      splatMesh.updateGenerator();
    },
  };
}
