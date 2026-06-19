const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type Force = { x: number; y: number };

export class BlobPoint {
  x: number;
  y: number;
  oldx: number;
  oldy: number;
  nextx: number;
  nexty: number;
  delayedx: number;
  delayedy: number;
  radius: number;
  damping: number;
  friction: number;

  constructor({
    x,
    y,
    radius,
    damping,
    friction,
  }: {
    x: number;
    y: number;
    radius?: number;
    damping?: number;
    friction?: number;
  }) {
    this.x = x;
    this.y = y;
    this.oldx = x;
    this.oldy = y;
    this.nextx = x;
    this.nexty = y;
    this.delayedx = x;
    this.delayedy = y;
    this.radius = radius ?? 10;
    this.damping = damping ?? 0.9;
    this.friction = friction ?? 0.1;
  }

  addForce(x: number, y: number, instant = false) {
    this.nextx += x;
    this.nexty += y;
    if (instant) {
      this.delayedx = lerp(this.delayedx, this.nextx, 0.25);
      this.delayedy = lerp(this.delayedy, this.nexty, 0.25);
    }
  }

  repel(
    otherX: number,
    otherY: number,
    radius = 1,
    strength = 1,
  ): Force | null {
    const diffx = this.x - otherX;
    const diffy = this.y - otherY;
    const mag = diffx * diffx + diffy * diffy;
    const combinedRadius = radius + this.radius;
    const minDist = combinedRadius * combinedRadius;

    if (mag > 0 && mag < minDist) {
      const magSqrt = 1 / Math.sqrt(mag);
      const forceX = diffx * magSqrt * strength;
      const forceY = diffy * magSqrt * strength;
      this.addForce(forceX, forceY);
      return { x: forceX, y: forceY };
    }

    return null;
  }

  collide(otherX: number, otherY: number, radius: number) {
    const diffx = otherX - this.x;
    const diffy = otherY - this.y;
    const diffMag = Math.sqrt(diffx * diffx + diffy * diffy);
    const combinedRadius = radius + this.radius;

    if (diffMag < combinedRadius) {
      const forceMag = diffMag - combinedRadius;
      const invMag = 1 / diffMag;
      this.addForce(diffx * invMag * forceMag, diffy * invMag * forceMag, true);
    }
  }

  constrain(left: number, top: number, right: number, bottom: number) {
    const { x, y, oldx, oldy, friction, radius } = this;
    const vx = (x - oldx) * friction;
    const vy = (y - oldy) * friction;

    left += radius;
    top += radius;
    right -= radius;
    bottom -= radius;

    if (x > right) {
      this.x = right;
      this.oldx = x + vx;
    } else if (x < left) {
      this.x = left;
      this.oldx = x + vx;
    }
    if (y > bottom) {
      this.y = bottom;
      this.oldy = y + vy;
    } else if (y < top) {
      this.y = top;
      this.oldy = y + vy;
    }
  }

  update(dt = 1) {
    const vx = this.x - this.oldx;
    const vy = this.y - this.oldy;
    this.oldx = this.x - vx * this.damping * (1 - dt);
    this.oldy = this.y - vy * this.damping * (1 - dt);
    this.x = this.nextx + vx * this.damping * dt;
    this.y = this.nexty + vy * this.damping * dt;
    this.delayedx = lerp(this.delayedx, this.x, 0.1);
    this.delayedy = lerp(this.delayedy, this.y, 0.1);
    this.nextx = this.x;
    this.nexty = this.y;
  }
}

export class BlobJoint {
  pointA: BlobPoint;
  pointB: BlobPoint;
  len: number;
  strength: number;

  constructor(
    pointA: BlobPoint,
    pointB: BlobPoint,
    len: number,
    strength: number,
  ) {
    this.pointA = pointA;
    this.pointB = pointB;
    this.len = len;
    this.strength = strength;
  }

  update(dt = 1) {
    const diffx = this.pointA.x - this.pointB.x;
    const diffy = this.pointA.y - this.pointB.y;
    const mag = Math.sqrt(diffx * diffx + diffy * diffy);
    const diffMag = this.len - mag;

    if (mag > 0) {
      const invMag = 1 / mag;
      const forceX = diffx * invMag * diffMag * this.strength * 0.5 * dt;
      const forceY = diffy * invMag * diffMag * this.strength * 0.5 * dt;
      this.pointA.addForce(forceX, forceY);
      this.pointB.addForce(-forceX, -forceY);
    }
  }
}

export type BlobSimulation = {
  points: BlobPoint[];
  joints: BlobJoint[];
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  imageIndex: number;
};

const GRAVITY = 0.14;
const POINT_GRAVITY = 0.06;
const BLOB_VELOCITY_DAMPING = 0.992;
const BLOB_BOUNCE = 0.32;
const BLOB_CENTER_RESTITUTION = 0.42;
const CROSS_BLOB_CONTACT_RADIUS = 32;
const CROSS_BLOB_COLLISION_STRENGTH = 0.85;
const POINTER_BALL_RADIUS = 72;
const POINTER_LERP = 0.18;
const POINTER_BALL_RESTITUTION = 0.38;
const POINTER_BALL_PUSH_PASSES = 3;
const POINTER_BALL_PUSH_STRENGTH = 1.08;
const POINTER_BALL_VELOCITY_TRANSFER = 0.62;
const POINTER_BALL_BLOB_TRANSFER = 0.14;

export type PointerBall = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
};

export type BlobScene = {
  blobs: BlobSimulation[];
  pointerBall: PointerBall;
};

export function createBlobSimulation(radius: number): BlobSimulation {
  const points: BlobPoint[] = [];
  const joints: BlobJoint[] = [];

  const pointCount = 80;

  for (let i = 0; i < pointCount; i++) {
    const angle = (i / pointCount) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    points.push(new BlobPoint({ x, y, damping: 0.99 }));
  }

  const l = points.length;
  for (let i = 0; i < l; i++) {
    const pointA = points[i];
    const pointB = points[(i + 1) % l];
    const pointC = points[(i + 2) % l];
    const pointD = points[Math.floor(i + l / 2) % l];
    joints.push(new BlobJoint(pointA, pointB, 10, 0.75));
    joints.push(new BlobJoint(pointA, pointC, 20, 0.5));
    joints.push(new BlobJoint(pointA, pointD, radius * 2, 0.0125));
  }

  return {
    points,
    joints,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius,
    imageIndex: 0,
  };
}

const BLOB_COUNT = 3;

function getBlobLayout(width: number, height: number) {
  return [
    { x: -width * 0.24, y: 0, imageIndex: 0 },
    { x: width * 0.16, y: -height * 0.18, imageIndex: 1 },
    { x: width * 0.16, y: height * 0.18, imageIndex: 2 },
  ] as const;
}

export function createBlobScene(width: number, height: number): BlobScene {
  const radius = Math.min(width, height) * 0.17;
  const layout = getBlobLayout(width, height).slice(0, BLOB_COUNT);

  return {
    blobs: layout.map(({ x, y, imageIndex }) => ({
      ...createBlobSimulation(radius),
      x,
      y,
      imageIndex,
    })),
    pointerBall: createPointerBall(width / 2, height / 2),
  };
}

function createPointerBall(x: number, y: number): PointerBall {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    radius: POINTER_BALL_RADIUS,
  };
}

function resolveBlobCenterCollision(
  blobA: BlobSimulation,
  blobB: BlobSimulation,
) {
  const diffx = blobB.x - blobA.x;
  const diffy = blobB.y - blobA.y;
  const distSq = diffx * diffx + diffy * diffy;
  const minDist = blobA.radius + blobB.radius;

  if (distSq === 0) {
    blobA.x -= minDist * 0.25;
    blobB.x += minDist * 0.25;
    return;
  }

  if (distSq >= minDist * minDist) return;

  const dist = Math.sqrt(distSq);
  const overlap = minDist - dist;
  const nx = diffx / dist;
  const ny = diffy / dist;
  const separation = overlap * 0.5;

  blobA.x -= nx * separation;
  blobA.y -= ny * separation;
  blobB.x += nx * separation;
  blobB.y += ny * separation;

  const relVx = blobB.vx - blobA.vx;
  const relVy = blobB.vy - blobA.vy;
  const relNormal = relVx * nx + relVy * ny;

  if (relNormal >= 0) return;

  const impulse = (-(1 + BLOB_CENTER_RESTITUTION) * relNormal) / 2;
  blobA.vx -= nx * impulse;
  blobA.vy -= ny * impulse;
  blobB.vx += nx * impulse;
  blobB.vy += ny * impulse;
}

function resolveBlobCenterCollisions(blobs: BlobSimulation[]) {
  for (let pass = 0; pass < 3; pass++) {
    for (let a = 0; a < blobs.length; a++) {
      for (let b = a + 1; b < blobs.length; b++) {
        resolveBlobCenterCollision(blobs[a], blobs[b]);
      }
    }
  }
}

function collideCrossBlobPoints(
  pointA: BlobPoint,
  offsetAX: number,
  offsetAY: number,
  pointB: BlobPoint,
  offsetBX: number,
  offsetBY: number,
) {
  const worldAx = pointA.x + offsetAX;
  const worldAy = pointA.y + offsetAY;
  const worldBx = pointB.x + offsetBX;
  const worldBy = pointB.y + offsetBY;

  const diffx = worldBx - worldAx;
  const diffy = worldBy - worldAy;
  const diffMag = Math.sqrt(diffx * diffx + diffy * diffy);
  const combinedRadius = CROSS_BLOB_CONTACT_RADIUS * 2;

  if (diffMag <= 0 || diffMag >= combinedRadius) return;

  const forceMag = (diffMag - combinedRadius) * CROSS_BLOB_COLLISION_STRENGTH;
  const invMag = 1 / diffMag;
  const forceX = diffx * invMag * forceMag;
  const forceY = diffy * invMag * forceMag;

  pointA.addForce(forceX, forceY, true);
  pointB.addForce(-forceX, -forceY, true);
}

function applyCrossBlobPointCollisions(
  blobA: BlobSimulation,
  blobB: BlobSimulation,
) {
  for (const pointA of blobA.points) {
    for (const pointB of blobB.points) {
      collideCrossBlobPoints(
        pointA,
        blobA.x,
        blobA.y,
        pointB,
        blobB.x,
        blobB.y,
      );
    }
  }
}

function stepBlobJoints(simulation: BlobSimulation) {
  for (let i = 0, l = simulation.joints.length; i < l; i++) {
    simulation.joints[i].update(1);
  }
}

function stepBlobPointForces(simulation: BlobSimulation) {
  const { points } = simulation;

  for (let i = 0, l = points.length; i < l; i++) {
    const pointA = points[i];
    const dist = Math.sqrt(pointA.x * pointA.x + pointA.y * pointA.y);

    if (dist > 0.01) {
      pointA.addForce(-(pointA.x / dist) * 0.1, -(pointA.y / dist) * 0.1);
    }

    pointA.addForce(0, POINT_GRAVITY);

    for (let j = i + 1; j < l; j++) {
      const pointB = points[j];
      const force = pointA.repel(pointB.x, pointB.y, 100, 0.1);
      if (force) {
        pointB.addForce(-force.x, -force.y);
      }
    }
  }
}

function pushBlobPointsFromRigidBall(
  blob: BlobSimulation,
  ball: PointerBall,
  ballVx: number,
  ballVy: number,
  hw: number,
  hh: number,
) {
  let contactCount = 0;
  let centerPushX = 0;
  let centerPushY = 0;

  for (let pass = 0; pass < POINTER_BALL_PUSH_PASSES; pass++) {
    for (const point of blob.points) {
      const worldX = hw + blob.x + point.x;
      const worldY = hh + blob.y + point.y;
      const diffx = worldX - ball.x;
      const diffy = worldY - ball.y;
      const dist = Math.sqrt(diffx * diffx + diffy * diffy);
      const combined = ball.radius + point.radius;

      if (dist >= combined || dist === 0) continue;

      const overlap = combined - dist;
      const nx = diffx / dist;
      const ny = diffy / dist;
      const pushX = nx * overlap * POINTER_BALL_PUSH_STRENGTH;
      const pushY = ny * overlap * POINTER_BALL_PUSH_STRENGTH;

      point.x += pushX;
      point.y += pushY;
      point.nextx = point.x;
      point.oldx =
        point.x - ballVx * POINTER_BALL_VELOCITY_TRANSFER - pushX * 0.2;
      point.oldy =
        point.y - ballVy * POINTER_BALL_VELOCITY_TRANSFER - pushY * 0.2;
      point.delayedx = point.x;
      point.delayedy = point.y;

      if (pass === 0) {
        contactCount += 1;
        centerPushX += nx * overlap;
        centerPushY += ny * overlap;
      }
    }
  }

  if (contactCount === 0) return;

  blob.vx += ballVx * POINTER_BALL_BLOB_TRANSFER + centerPushX * 0.05;
  blob.vy += ballVy * POINTER_BALL_BLOB_TRANSFER + centerPushY * 0.05;
}

function constrainPointerBall(
  ball: PointerBall,
  width: number,
  height: number,
) {
  const r = ball.radius;

  if (ball.x < r) {
    ball.x = r;
    ball.vx *= -POINTER_BALL_RESTITUTION;
  } else if (ball.x > width - r) {
    ball.x = width - r;
    ball.vx *= -POINTER_BALL_RESTITUTION;
  }

  if (ball.y < r) {
    ball.y = r;
    ball.vy *= -POINTER_BALL_RESTITUTION;
  } else if (ball.y > height - r) {
    ball.y = height - r;
    ball.vy *= -POINTER_BALL_RESTITUTION;
  }
}

function stepPointerBall(
  ball: PointerBall,
  targetX: number,
  targetY: number,
  active: boolean,
  width: number,
  height: number,
) {
  const prevX = ball.x;
  const prevY = ball.y;

  if (active) {
    ball.x = lerp(ball.x, targetX, POINTER_LERP);
    ball.y = lerp(ball.y, targetY, POINTER_LERP);
  }

  constrainPointerBall(ball, width, height);

  ball.vx = ball.x - prevX;
  ball.vy = ball.y - prevY;
}

function stepBlobPointIntegration(
  simulation: BlobSimulation,
  bounds: { left: number; top: number; right: number; bottom: number },
) {
  for (const point of simulation.points) {
    point.update(0.5);
    point.constrain(bounds.left, bounds.top, bounds.right, bounds.bottom);
  }
}

function applyBlobGravity(blob: BlobSimulation, hw: number, hh: number) {
  blob.vy += GRAVITY;
  blob.x += blob.vx;
  blob.y += blob.vy;

  const margin = blob.radius * 1.05;
  const left = -hw + margin;
  const right = hw - margin;
  const top = -hh + margin;
  const bottom = hh - margin;

  if (blob.x < left) {
    blob.x = left;
    blob.vx *= -BLOB_BOUNCE;
  } else if (blob.x > right) {
    blob.x = right;
    blob.vx *= -BLOB_BOUNCE;
  }

  if (blob.y < top) {
    blob.y = top;
    blob.vy *= -BLOB_BOUNCE;
  } else if (blob.y > bottom) {
    blob.y = bottom;
    blob.vy *= -BLOB_BOUNCE;
  }

  blob.vx *= BLOB_VELOCITY_DAMPING;
  blob.vy *= BLOB_VELOCITY_DAMPING;
}

export function stepBlobScene(
  scene: BlobScene,
  width: number,
  height: number,
  pointerX: number,
  pointerY: number,
  pointerActive: boolean,
) {
  const hw = width / 2;
  const hh = height / 2;
  const { pointerBall } = scene;

  for (const blob of scene.blobs) {
    applyBlobGravity(blob, hw, hh);
  }

  resolveBlobCenterCollisions(scene.blobs);

  stepPointerBall(
    pointerBall,
    pointerX,
    pointerY,
    pointerActive,
    width,
    height,
  );

  const ballVx = pointerBall.vx;
  const ballVy = pointerBall.vy;

  for (const blob of scene.blobs) {
    stepBlobJoints(blob);
  }

  for (let a = 0; a < scene.blobs.length; a++) {
    for (let b = a + 1; b < scene.blobs.length; b++) {
      applyCrossBlobPointCollisions(scene.blobs[a], scene.blobs[b]);
    }
  }

  for (const blob of scene.blobs) {
    stepBlobPointForces(blob);
    pushBlobPointsFromRigidBall(blob, pointerBall, ballVx, ballVy, hw, hh);
    stepBlobPointIntegration(blob, {
      left: -hw - blob.x,
      top: -hh - blob.y,
      right: hw - blob.x,
      bottom: hh - blob.y,
    });
  }

  resolveBlobCenterCollisions(scene.blobs);
}

export function drawClosedBlobCurve(
  ctx: CanvasRenderingContext2D,
  points: BlobPoint[],
) {
  const len = points.length;
  if (len < 3) return;

  ctx.beginPath();

  for (let i = 0; i < len; i++) {
    const p0 = points[(i - 1 + len) % len];
    const p1 = points[i];
    const p2 = points[(i + 1) % len];
    const p3 = points[(i + 2) % len];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    if (i === 0) {
      ctx.moveTo(p1.x, p1.y);
    }
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }

  ctx.closePath();
}

export function clipToCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
}

export function clipToBlob(ctx: CanvasRenderingContext2D, points: BlobPoint[]) {
  drawClosedBlobCurve(ctx, points);
  ctx.clip();
}

export function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  width: number,
  height: number,
) {
  const sourceWidth =
    "videoWidth" in image
      ? image.videoWidth
      : "width" in image
        ? image.width
        : 0;
  const sourceHeight =
    "videoHeight" in image
      ? image.videoHeight
      : "height" in image
        ? image.height
        : 0;

  if (sourceWidth <= 0 || sourceHeight <= 0) return;

  const imageAspect = sourceWidth / sourceHeight;
  const canvasAspect = width / height;

  let drawWidth: number;
  let drawHeight: number;
  let offsetX: number;
  let offsetY: number;

  if (imageAspect > canvasAspect) {
    drawHeight = height;
    drawWidth = height * imageAspect;
    offsetX = (width - drawWidth) / 2;
    offsetY = 0;
  } else {
    drawWidth = width;
    drawHeight = width / imageAspect;
    offsetX = 0;
    offsetY = (height - drawHeight) / 2;
  }

  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

const DEBUG_COLORS = [
  "rgba(255, 60, 60, 0.9)",
  "rgba(60, 120, 255, 0.9)",
  "rgba(60, 200, 90, 0.9)",
] as const;

export function drawBlobSceneDebug(
  ctx: CanvasRenderingContext2D,
  scene: BlobScene,
  width: number,
  height: number,
  pointerX: number,
  pointerY: number,
  pointerActive: boolean,
) {
  const hw = width / 2;
  const hh = height / 2;
  const { pointerBall } = scene;

  for (let index = 0; index < scene.blobs.length; index++) {
    const blob = scene.blobs[index];
    const color = DEBUG_COLORS[index % DEBUG_COLORS.length];

    ctx.save();
    ctx.translate(hw + blob.x, hh + blob.y);

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, blob.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
    ctx.lineWidth = 1;
    for (const joint of blob.joints) {
      ctx.beginPath();
      ctx.moveTo(joint.pointA.x, joint.pointA.y);
      ctx.lineTo(joint.pointB.x, joint.pointB.y);
      ctx.stroke();
    }

    ctx.fillStyle = color;
    for (const point of blob.points) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    if (Math.abs(blob.vx) > 0.01 || Math.abs(blob.vy) > 0.01) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(blob.vx * 8, blob.vy * 8);
      ctx.stroke();
    }

    ctx.restore();
  }

  ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(pointerBall.x, pointerBall.y, pointerBall.radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
  ctx.beginPath();
  ctx.arc(pointerBall.x, pointerBall.y, 4, 0, Math.PI * 2);
  ctx.fill();

  if (Math.abs(pointerBall.vx) > 0.01 || Math.abs(pointerBall.vy) > 0.01) {
    ctx.strokeStyle = "rgba(0, 180, 180, 0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pointerBall.x, pointerBall.y);
    ctx.lineTo(
      pointerBall.x + pointerBall.vx * 10,
      pointerBall.y + pointerBall.vy * 10,
    );
    ctx.stroke();
  }

  if (pointerActive) {
    ctx.strokeStyle = "rgba(0, 180, 180, 0.55)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(pointerBall.x, pointerBall.y);
    ctx.lineTo(pointerX, pointerY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = "rgba(0, 180, 180, 0.9)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(pointerX, pointerY, 6, 0, Math.PI * 2);
    ctx.stroke();
  }
}
