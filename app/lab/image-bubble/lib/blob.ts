import {
  type BlobJointConfigs,
  type JointKind,
  type RangeSpringConfig,
} from "./joint-config";
import { Particle } from "./particle";
import { clipToBlobOutline, drawCoverImage } from "./canvas-image";
import { traceSmoothBlobOutline } from "./render-path";

function getUniformBridgeSteps(count: number) {
  const minStep = 3;
  const maxStep = Math.floor(count / 2);
  if (maxStep < minStep) return [];

  const span = maxStep - minStep;
  if (span === 0) return [maxStep];

  const stepCount = span + 1;
  if (stepCount <= 8) {
    return Array.from({ length: stepCount }, (_, index) => minStep + index);
  }

  const samples = Math.max(4, Math.ceil(count / 6));
  const steps = new Set<number>();

  for (let index = 0; index < samples; index++) {
    const t = samples === 1 ? 1 : index / (samples - 1);
    steps.add(Math.round(minStep + t * span));
  }

  steps.add(maxStep);
  return [...steps].sort((a, b) => a - b);
}

function bridgeStrengthScale(step: number, maxStep: number) {
  if (maxStep <= 0) return 1;
  return (step / maxStep) * 2;
}

class DistanceJoint {
  minLengthRatio: number;
  maxLengthRatio: number;
  compressStrength: number;
  extendStrength: number;

  constructor(
    readonly a: Particle,
    readonly b: Particle,
    readonly spawnRest: number,
    config: RangeSpringConfig,
    readonly kind: JointKind,
    readonly strengthScale = 1,
  ) {
    this.minLengthRatio = config.minLengthRatio;
    this.maxLengthRatio = config.maxLengthRatio;
    this.compressStrength = config.compressStrength * strengthScale;
    this.extendStrength = config.extendStrength * strengthScale;
  }

  get minLength() {
    return this.spawnRest * this.minLengthRatio;
  }

  get maxLength() {
    return this.spawnRest * this.maxLengthRatio;
  }

  applyConfig(config: RangeSpringConfig) {
    this.minLengthRatio = config.minLengthRatio;
    this.maxLengthRatio = config.maxLengthRatio;
    this.compressStrength = config.compressStrength * this.strengthScale;
    this.extendStrength = config.extendStrength * this.strengthScale;
  }

  solve() {
    const particleSpring = (this.a.spring + this.b.spring) * 0.5;
    const dx = this.b.x - this.a.x;
    const dy = this.b.y - this.a.y;
    const dist = (dx * dx + dy * dy) ** 0.5;
    if (dist <= 1e-6) return;

    let strength = 0;
    let targetLength = 0;

    if (dist < this.minLength) {
      targetLength = this.minLength;
      strength = this.compressStrength * particleSpring;
    } else if (dist > this.maxLength) {
      targetLength = this.maxLength;
      strength = this.extendStrength * particleSpring;
    } else {
      return;
    }

    const diff = ((dist - targetLength) / dist) * strength * 0.5;
    const offsetX = dx * diff;
    const offsetY = dy * diff;

    this.a.x += offsetX;
    this.a.y += offsetY;
    this.b.x -= offsetX;
    this.b.y -= offsetY;
  }
}

function restLength(a: Particle, b: Particle) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return (dx * dx + dy * dy) ** 0.5;
}

function createJoint(
  a: Particle,
  b: Particle,
  config: RangeSpringConfig,
  kind: JointKind,
  strengthScale = 1,
) {
  return new DistanceJoint(a, b, restLength(a, b), config, kind, strengthScale);
}

function createStructuralJoints(
  particles: Particle[],
  jointConfigs: BlobJointConfigs,
) {
  const count = particles.length;
  const joints: DistanceJoint[] = [];
  const bridgeSteps = getUniformBridgeSteps(count);
  const oppositeStep = Math.floor(count / 2);

  for (let i = 0; i < count; i++) {
    const a = particles[i];
    if (!a) continue;

    const neighbor = particles[(i + 1) % count];
    if (neighbor) {
      joints.push(createJoint(a, neighbor, jointConfigs.neighbor, "neighbor"));
    }

    if (count > 2) {
      const skipOne = particles[(i + 2) % count];
      if (skipOne) {
        joints.push(createJoint(a, skipOne, jointConfigs.skipOne, "skipOne"));
      }
    }

    for (const step of bridgeSteps) {
      if (count <= step) continue;
      if (step === oppositeStep && i >= oppositeStep) continue;

      const bridge = particles[(i + step) % count];
      if (bridge) {
        joints.push(
          createJoint(
            a,
            bridge,
            jointConfigs.bridge,
            "bridge",
            bridgeStrengthScale(step, oppositeStep),
          ),
        );
      }
    }
  }

  return joints;
}

export function particleCountForBlobRadius(
  blobRadius: number,
  particleRadius: number,
  minCount = 8,
) {
  const count = Math.round((Math.PI * blobRadius) / particleRadius) * 1.5;
  return Math.max(minCount, count);
}

export class Blob {
  readonly particles: Particle[];
  private readonly joints: DistanceJoint[];

  constructor(
    particles: Particle[],
    joints: DistanceJoint[],
    readonly color: string,
  ) {
    this.particles = particles;
    this.joints = joints;
  }

  static create(
    cx: number,
    cy: number,
    radius: number,
    count: number,
    particleRadius: number,
    color: string,
    spring = 0.5,
    damp = 0.98,
    jointConfigs: BlobJointConfigs,
  ) {
    const particles = Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      return new Particle(
        cx + Math.cos(angle) * radius,
        cy + Math.sin(angle) * radius,
        particleRadius,
        spring,
        damp,
      );
    });

    const joints = createStructuralJoints(particles, jointConfigs);

    return new Blob(particles, joints, color);
  }

  syncSettings(spring: number, damp: number, jointConfigs: BlobJointConfigs) {
    for (const particle of this.particles) {
      particle.spring = spring;
      particle.damp = damp;
    }

    for (const joint of this.joints) {
      joint.applyConfig(jointConfigs[joint.kind]);
    }
  }

  integrate(gravity: number) {
    for (const particle of this.particles) {
      particle.integrate(gravity);
    }
  }

  solveSprings(passes: number) {
    for (let pass = passes; pass--; ) {
      for (const joint of this.joints) {
        joint.solve();
      }
    }
  }

  constrain(left: number, top: number, right: number, bottom: number) {
    for (const particle of this.particles) {
      particle.constrain(left, top, right, bottom);
    }
  }

  pushFromPointer(x: number, y: number, radius: number, passes = 6) {
    for (let pass = passes; pass--; ) {
      for (const particle of this.particles) {
        particle.collidePointer(x, y, radius);
      }
    }
  }

  pushFromPointerSweep(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    radius: number,
    passes = 6,
  ) {
    for (let pass = passes; pass--; ) {
      for (const particle of this.particles) {
        particle.collidePointerSweep(fromX, fromY, toX, toY, radius);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.particles.length < 3) return;

    ctx.fillStyle = this.color;
    traceSmoothBlobOutline(ctx, this.particles);
    ctx.fill();
  }

  drawMaskedImage(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    width: number,
    height: number,
  ) {
    if (this.particles.length < 3) return;

    ctx.save();
    clipToBlobOutline(ctx, this.particles);
    drawCoverImage(ctx, image, width, height);
    ctx.restore();

    ctx.save();
    traceSmoothBlobOutline(ctx, this.particles);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  drawDebug(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = "rgba(59, 130, 246, 0.55)";
    ctx.lineWidth = 1;

    for (const joint of this.joints) {
      ctx.beginPath();
      ctx.moveTo(joint.a.x, joint.a.y);
      ctx.lineTo(joint.b.x, joint.b.y);
      ctx.stroke();
    }

    for (const particle of this.particles) {
      particle.draw(ctx);
    }
  }
}

export type { BlobJointConfigs } from "./joint-config";
