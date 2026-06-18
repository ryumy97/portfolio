import { dyno, type GsplatModifier, type SplatMesh } from "@sparkjsdev/spark";
import { type Camera, Vector3 } from "three";

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
  sin,
  cos,
  split,
  combine,
  max,
  clamp,
  mix,
  pow,
  length,
  dynoConst,
  dynoFloat,
} = dyno;

const WORLD_CENTER = new Vector3();
const VIEW_CENTER = new Vector3();

const DEPTH_SAMPLE_TARGET = 5000;
const DEPTH_RANGE_PADDING = 0.02;

export const VORTEX_DEFAULTS = {
  fieldStrength: 0.05,
  speed: 2,
  frequencyScale: 4,
  nearFieldStrength: 0.01,
  minDepthScale: 0.04,
  farOpacity: 0.04,
  opacityPulse: 0.25,
  colorShift: 0.4,
} as const;

export const VORTEX_REVEAL_DEFAULTS = {
  delayMs: 500,
  staggerMs: 3000,
  growMs: 1000,
  distanceScale: 1,
} as const;

export type VortexSettings = {
  [K in keyof typeof VORTEX_DEFAULTS]: number;
};

export type VortexRevealSettings = {
  [K in keyof typeof VORTEX_REVEAL_DEFAULTS]: number;
};

export type VortexOptions = VortexSettings & {
  minDepth?: number;
  maxDepth?: number;
  camera?: Camera;
  reveal?: Partial<VortexRevealSettings>;
};

export type VortexController = {
  tick: () => void;
  startReveal: (clockTimeSeconds: number) => void;
  isRevealComplete: (clockTimeSeconds: number) => boolean;
  detach: () => void;
  setSettings: (settings: Partial<VortexSettings>) => void;
};

type VortexUniforms = {
  fieldStrength: ReturnType<typeof dynoFloat>;
  nearFieldStrength: ReturnType<typeof dynoFloat>;
  frequency: ReturnType<typeof dynoFloat>;
  speed: ReturnType<typeof dynoFloat>;
  opacityPulse: ReturnType<typeof dynoFloat>;
  minDepthScale: ReturnType<typeof dynoFloat>;
  farOpacity: ReturnType<typeof dynoFloat>;
  colorShift: ReturnType<typeof dynoFloat>;
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

type FloatDyno = dyno.DynoVal<"float">;

function sampleFlowField({
  x,
  y,
  z,
  t,
  frequency,
}: {
  x: FloatDyno;
  y: FloatDyno;
  z: FloatDyno;
  t: FloatDyno;
  frequency: FloatDyno;
}) {
  const c067 = dynoConst("float", 0.67);
  const c083 = dynoConst("float", 0.83);
  const c107 = dynoConst("float", 1.07);

  const fieldX = add(
    sin(add(mul(z, frequency), t)),
    cos(add(mul(y, frequency), mul(t, c083))),
  );
  const fieldY = add(
    sin(add(mul(x, frequency), mul(t, c107))),
    cos(add(mul(z, frequency), mul(t, c067))),
  );

  return { fieldX, fieldY };
}

function makeVortexModifier({
  time,
  uniforms,
  revealStartTime,
  revealDelay,
  revealStaggerSpread,
  revealGrowDuration,
  revealDistance,
  minDepth,
  maxDepth,
  worldToView,
}: {
  time: SplatMesh["context"]["time"];
  uniforms: VortexUniforms;
  revealStartTime: ReturnType<typeof dynoFloat>;
  revealDelay: ReturnType<typeof dynoFloat>;
  revealStaggerSpread: ReturnType<typeof dynoFloat>;
  revealGrowDuration: ReturnType<typeof dynoFloat>;
  revealDistance: ReturnType<typeof dynoFloat>;
  minDepth: ReturnType<typeof dynoFloat>;
  maxDepth: ReturnType<typeof dynoFloat>;
  worldToView: SplatMesh["context"]["worldToView"];
}): GsplatModifier {
  const {
    fieldStrength,
    nearFieldStrength,
    frequency,
    speed,
    opacityPulse,
    minDepthScale,
    farOpacity,
    colorShift,
  } = uniforms;

  const c05 = dynoConst("float", 0.5);
  const c12 = dynoConst("float", 1.2);
  const c15 = dynoConst("float", 1.5);
  const c2 = dynoConst("float", 2);
  const c21 = dynoConst("float", 2.1);
  const coolR = dynoConst("float", 0.4);
  const coolG = dynoConst("float", 0.58);
  const coolB = dynoConst("float", 1.6);

  return dynoBlock({ gsplat: Gsplat }, { gsplat: Gsplat }, ({ gsplat }) => {
    if (!gsplat) {
      throw new Error("No gsplat input");
    }

    const { center, scales, opacity, rgb } = splitGsplat(gsplat).outputs;
    const { r, g, b } = split(rgb).outputs;
    const zero = dynoConst("float", 0);
    const half = dynoConst("float", 0.5);
    const one = dynoConst("float", 1);

    const viewCenter = worldToView.apply(center);
    const depth = neg(split(viewCenter).outputs.z);
    const range = max(sub(maxDepth, minDepth), dynoConst("float", 1e-6));
    const depthT = clamp(div(sub(depth, minDepth), range), zero, one);
    const depthEffect = pow(depthT, c2);

    const revealElapsed = sub(time, revealStartTime);
    const revealStart = add(revealDelay, mul(depthT, revealStaggerSpread));
    const revealLinearT = clamp(
      div(sub(revealElapsed, revealStart), revealGrowDuration),
      zero,
      one,
    );
    const revealInv = sub(one, revealLinearT);
    const revealEased = sub(one, mul(mul(revealInv, revealInv), revealInv));
    const centerLen = max(length(center), dynoConst("float", 1e-3));
    const radialDir = div(center, centerLen);
    const revealOffset = mul(
      radialDir,
      mul(revealDistance, sub(one, revealEased)),
    );
    const revealedCenter = add(center, revealOffset);
    const { x: rx, y: ry, z: rz } = split(revealedCenter).outputs;

    const t = mul(time, speed);
    const coarse = sampleFlowField({ x: rx, y: ry, z: rz, t, frequency });
    const fine = sampleFlowField({
      x: rx,
      y: ry,
      z: rz,
      t: mul(t, c21),
      frequency: mul(frequency, c21),
    });

    const fieldX = add(coarse.fieldX, mul(fine.fieldX, c05));
    const fieldY = add(coarse.fieldY, mul(fine.fieldY, c05));
    const planarField = combine({
      vectorType: "vec3",
      x: fieldX,
      y: fieldY,
      z: zero,
    });
    const fieldMag = max(length(planarField), dynoConst("float", 1e-3));

    const fieldInfluence = mix(nearFieldStrength, fieldStrength, depthEffect);
    const flowX = mul(div(fieldX, fieldMag), fieldInfluence);
    const flowY = mul(div(fieldY, fieldMag), fieldInfluence);

    const vortexCenter = combine({
      vector: revealedCenter,
      vectorType: "vec3",
      x: add(rx, flowX),
      y: add(ry, flowY),
    });

    const flowShimmer = add(
      mul(clamp(div(fieldMag, c2), zero, one), half),
      half,
    );
    const colorMix = mul(pow(depthT, c12), colorShift);
    const depthOpacity = mix(one, farOpacity, pow(depthT, c15));
    const depthScale = mix(one, minDepthScale, pow(depthT, c15));
    const vortexOpacity = mul(
      opacity,
      mul(
        depthOpacity,
        add(one, mul(opacityPulse, mul(flowShimmer, depthEffect))),
      ),
    );
    const vortexScales = mul(scales, depthScale);
    const vortexRgb = combine({
      vector: rgb,
      vectorType: "vec3",
      r: mul(r, mix(one, coolR, colorMix)),
      g: mul(g, mix(one, coolG, colorMix)),
      b: mul(b, mix(one, coolB, colorMix)),
    });

    return {
      gsplat: combineGsplat({
        gsplat,
        center: vortexCenter,
        scales: vortexScales,
        opacity: vortexOpacity,
        rgb: vortexRgb,
      }),
    };
  });
}

function applyVortexSettings(
  uniforms: VortexUniforms,
  sceneSpan: number,
  settings: VortexSettings,
) {
  const absoluteFieldStrength = settings.fieldStrength * sceneSpan;
  const baseFrequency = (Math.PI * 2.5) / sceneSpan;

  uniforms.fieldStrength.value = absoluteFieldStrength;
  uniforms.nearFieldStrength.value =
    settings.nearFieldStrength * absoluteFieldStrength;
  uniforms.frequency.value = baseFrequency * settings.frequencyScale;
  uniforms.speed.value = settings.speed;
  uniforms.opacityPulse.value = settings.opacityPulse;
  uniforms.minDepthScale.value = settings.minDepthScale;
  uniforms.farOpacity.value = settings.farOpacity;
  uniforms.colorShift.value = settings.colorShift;
}

export function attachVortex(
  splatMesh: SplatMesh,
  { minDepth, maxDepth, camera, reveal, ...settings }: VortexOptions,
): VortexController {
  if (!camera) {
    throw new Error("attachVortex requires a camera");
  }

  const box = splatMesh.getBoundingBox(true);
  const spanX = Math.max(box.max.x - box.min.x, 1e-3);
  const spanY = Math.max(box.max.y - box.min.y, 1e-3);
  const spanZ = Math.max(box.max.z - box.min.z, 1e-3);
  const sceneSpan = Math.max(spanX, spanY, spanZ);

  const depthRange =
    minDepth !== undefined && maxDepth !== undefined
      ? { minDepth, maxDepth }
      : computeSplatDepthRange(splatMesh, camera);

  const resolvedSettings: VortexSettings = {
    ...VORTEX_DEFAULTS,
    ...settings,
  };

  const resolvedReveal: VortexRevealSettings = {
    ...VORTEX_REVEAL_DEFAULTS,
    ...reveal,
  };

  const revealStartTime = dynoFloat(Number.POSITIVE_INFINITY);
  const revealDelay = dynoFloat(resolvedReveal.delayMs / 1000);
  const revealStaggerSpread = dynoFloat(resolvedReveal.staggerMs / 1000);
  const revealGrowDuration = dynoFloat(resolvedReveal.growMs / 1000);
  const revealDistance = dynoFloat(sceneSpan * resolvedReveal.distanceScale);
  const revealTotalDurationSec =
    resolvedReveal.delayMs / 1000 +
    resolvedReveal.staggerMs / 1000 +
    resolvedReveal.growMs / 1000;

  const uniforms: VortexUniforms = {
    fieldStrength: dynoFloat(0),
    nearFieldStrength: dynoFloat(0),
    frequency: dynoFloat(0),
    speed: dynoFloat(resolvedSettings.speed),
    opacityPulse: dynoFloat(resolvedSettings.opacityPulse),
    minDepthScale: dynoFloat(resolvedSettings.minDepthScale),
    farOpacity: dynoFloat(resolvedSettings.farOpacity),
    colorShift: dynoFloat(resolvedSettings.colorShift),
  };

  applyVortexSettings(uniforms, sceneSpan, resolvedSettings);

  splatMesh.enableWorldToView = true;

  const modifier = makeVortexModifier({
    time: splatMesh.context.time,
    uniforms,
    revealStartTime,
    revealDelay,
    revealStaggerSpread,
    revealGrowDuration,
    revealDistance,
    minDepth: dynoFloat(depthRange.minDepth),
    maxDepth: dynoFloat(depthRange.maxDepth),
    worldToView: splatMesh.context.worldToView,
  });

  splatMesh.worldModifier = modifier;
  splatMesh.updateGenerator();

  let currentSettings = resolvedSettings;

  return {
    tick: () => {
      splatMesh.updateVersion();
    },
    startReveal: (clockTimeSeconds: number) => {
      revealStartTime.value = clockTimeSeconds;
      splatMesh.updateVersion();
    },
    isRevealComplete: (clockTimeSeconds: number) => {
      if (!Number.isFinite(revealStartTime.value)) return false;
      return clockTimeSeconds - revealStartTime.value >= revealTotalDurationSec;
    },
    setSettings: (partial) => {
      currentSettings = { ...currentSettings, ...partial };
      applyVortexSettings(uniforms, sceneSpan, currentSettings);
      splatMesh.updateVersion();
    },
    detach: () => {
      splatMesh.worldModifier = undefined;
      splatMesh.updateGenerator();
    },
  };
}
