const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type Vec2 = { x: number; y: number };

const SIMULATION_SUBSTEPS = 8;
const SIMULATION_DELTA = 1 / 120;
const GRAVITY_FORCE = 1.4;
const POINTER_BALL_RADIUS = 72;
const POINTER_LERP = 0.18;
const POINTER_BALL_RESTITUTION = 0.38;
const POINTER_BALL_PUSH_PASSES = 3;
const POINTER_BALL_PUSH_STRENGTH = 1.08;
const POINTER_BALL_VELOCITY_TRANSFER = 0.62;
const BLOB_POINT_COUNT = 56;

export class AnatomyParticle {
  pos: Vec2;
  prevPos: Vec2;
  collider: Vec2;
  acc: Vec2;
  mass: number;
  invMass: number;
  radius: number;
  damping: number;
  maxSpeed: number;
  next: AnatomyParticle | null = null;
  prev: AnatomyParticle | null = null;
  isStatic = false;

  constructor(
    x: number,
    y: number,
    radius = 5,
    mass = 0.1,
    damping = 1,
  ) {
    this.pos = { x, y };
    this.prevPos = { x, y };
    this.collider = { x, y };
    this.acc = { x: 0, y: 0 };
    this.mass = mass;
    this.invMass = 1 / mass;
    this.radius = radius;
    this.damping = damping;
    this.maxSpeed = radius * 1.5;
  }

  applyForce(fx: number, fy: number) {
    this.acc.x += fx * this.invMass;
    this.acc.y += fy * this.invMass;
  }

  move(fx: number, fy: number) {
    this.pos.x += fx;
    this.pos.y += fy;
    this.collider.x += fx;
    this.collider.y += fy;
  }

  update(deltaTime: number) {
    if (this.isStatic) return;

    let vx = (this.pos.x - this.prevPos.x) * this.damping;
    let vy = (this.pos.y - this.prevPos.y) * this.damping;

    const speedSq = vx * vx + vy * vy;
    const maxSpeedSq = this.maxSpeed * this.maxSpeed;
    if (speedSq > maxSpeedSq) {
      const scale = this.maxSpeed / Math.sqrt(speedSq);
      vx *= scale;
      vy *= scale;
    }

    const dt2 = deltaTime * deltaTime;
    const nextX = this.pos.x + vx + this.acc.x * dt2;
    const nextY = this.pos.y + vy + this.acc.y * dt2;

    this.prevPos.x = this.pos.x;
    this.prevPos.y = this.pos.y;
    this.pos.x = nextX;
    this.pos.y = nextY;
    this.acc.x = 0;
    this.acc.y = 0;
    this.collider.x = this.pos.x;
    this.collider.y = this.pos.y;
  }
}

export class AnatomySpring {
  p1: AnatomyParticle;
  p2: AnatomyParticle;
  restLength: number;
  stiffness: number;

  constructor(
    p1: AnatomyParticle,
    p2: AnatomyParticle,
    restLength: number,
    stiffness = 1,
  ) {
    this.p1 = p1;
    this.p2 = p2;
    this.restLength = restLength;
    this.stiffness = stiffness;
  }

  update() {
    const dx = this.p2.pos.x - this.p1.pos.x;
    const dy = this.p2.pos.y - this.p1.pos.y;
    const distSq = dx * dx + dy * dy;
    if (distSq === 0) return;

    const dist = Math.sqrt(distSq);
    const diff = ((dist - this.restLength) / dist) * 0.5 * this.stiffness;
    const offsetX = dx * diff;
    const offsetY = dy * diff;

    this.p1.pos.x += offsetX;
    this.p1.pos.y += offsetY;
    this.p2.pos.x -= offsetX;
    this.p2.pos.y -= offsetY;
    this.p1.collider.x = this.p1.pos.x;
    this.p1.collider.y = this.p1.pos.y;
    this.p2.collider.x = this.p2.pos.x;
    this.p2.collider.y = this.p2.pos.y;
  }
}

export type BlobLoop = {
  outline: AnatomyParticle[];
  contours: AnatomyParticle[][];
  constraints: AnatomySpring[];
  imageIndex: number;
};

export type PointerBall = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
};

export type AnatomyBlobScene = {
  loops: BlobLoop[];
  allParticles: AnatomyParticle[];
  allConstraints: AnatomySpring[];
  collisionLookup: AnatomyParticle[];
  pointerBall: PointerBall;
};

function getDistance(a: Vec2, b: Vec2) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function circlePoints(
  centerX: number,
  centerY: number,
  radius: number,
  count: number,
): Vec2[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    return {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    };
  });
}

function makeLoop(
  indices: number[],
  points: Vec2[],
  mass = 0.1,
): [AnatomyParticle[], AnatomySpring[]] {
  const particles = indices.map((pointIndex, i, allPoints) => {
    const p = points[pointIndex];
    const prevPIndex = allPoints[(i + allPoints.length - 1) % allPoints.length];
    const nextPIndex = allPoints[(i + 1) % allPoints.length];
    const d0 = getDistance(points[prevPIndex], p);
    const d1 = getDistance(points[nextPIndex], p);
    return new AnatomyParticle(
      p.x,
      p.y,
      Math.max(2, (d0 + d1) / 2) * 0.75,
      mass,
    );
  });

  const constraints: AnatomySpring[] = [];
  const l = particles.length;

  for (let i = 0; i < l; i++) {
    const p0 = particles[i % l];
    const p1 = particles[(i + 1) % l];
    const p2 = particles[(i + 2) % l];

    p1.prev = p0;
    p1.next = p2;

    const springCount = Math.max(6, Math.floor(l ** 0.45));
    for (let j = 1; j < springCount; j++) {
      const nextI = Math.floor(j ** 2.25);
      const pj = particles[(i + nextI) % l];
      constraints.push(
        new AnatomySpring(p0, pj, getDistance(p0.pos, pj.pos), Math.max(0, 1 / j ** 3.5)),
      );
    }
  }

  return [particles, constraints];
}

function makeBlobShape(centerX: number, centerY: number, radius: number) {
  const points = circlePoints(centerX, centerY, radius, BLOB_POINT_COUNT);
  const indices = points.map((_, index) => index);
  const [outline, constraints] = makeLoop(indices, points, 0.1);

  return {
    outline,
    contours: [] as AnatomyParticle[][],
    constraints,
  };
}

function resolveParticleCollision(a: AnatomyParticle, b: AnatomyParticle) {
  if (a.next === b || a.prev === b) return;
  if (a.next?.next === b || a.prev?.prev === b) return;
  if (a.next?.next?.next === b || a.prev?.prev?.prev === b) return;
  if (a.next?.next?.next?.next === b || a.prev?.prev?.prev?.prev === b) return;

  const dx = b.collider.x - a.collider.x;
  const dy = b.collider.y - a.collider.y;
  const distSq = dx * dx + dy * dy;
  const minDist = a.radius + b.radius;

  if (distSq === 0) return;

  const dist = Math.sqrt(distSq);
  if (dist >= minDist) return;

  const nx = dx / dist;
  const ny = dy / dist;
  const overlap = minDist - dist;
  const totalInvMass = a.invMass + b.invMass;
  if (totalInvMass === 0) return;

  const moveA = (a.invMass / totalInvMass) * overlap * 0.5;
  const moveB = (b.invMass / totalInvMass) * overlap * 0.5;

  a.move(-nx * moveA, -ny * moveA);
  b.move(nx * moveB, ny * moveB);
}

function constrainParticle(
  particle: AnatomyParticle,
  left: number,
  right: number,
  top: number,
  bottom: number,
  restitution = 0,
) {
  const vx = particle.pos.x - particle.prevPos.x;
  const vy = particle.pos.y - particle.prevPos.y;

  if (particle.pos.x < left + particle.radius) {
    particle.pos.x = left + particle.radius;
    particle.prevPos.x = particle.pos.x + vx * restitution;
  } else if (particle.pos.x > right - particle.radius) {
    particle.pos.x = right - particle.radius;
    particle.prevPos.x = particle.pos.x + vx * restitution;
  }

  if (particle.pos.y < top + particle.radius) {
    particle.pos.y = top + particle.radius;
    particle.prevPos.y = particle.pos.y + vy * restitution;
  } else if (particle.pos.y > bottom - particle.radius) {
    particle.pos.y = bottom - particle.radius;
    particle.prevPos.y = particle.pos.y + vy * restitution;
  }

  particle.collider.x = particle.pos.x;
  particle.collider.y = particle.pos.y;
}

function detectCircleCollisions(circles: AnatomyParticle[]) {
  circles.sort(
    (a, b) => a.collider.y - a.radius - (b.collider.y - b.radius),
  );

  const collisions: [AnatomyParticle, AnatomyParticle][] = [];

  for (let i = 0; i < circles.length; i++) {
    const circleA = circles[i];
    for (let j = i + 1; j < circles.length; j++) {
      const circleB = circles[j];

      if (
        circleB.collider.y - circleB.radius >
        circleA.collider.y + circleA.radius
      ) {
        break;
      }

      const dx = circleA.collider.x - circleB.collider.x;
      const dy = circleA.collider.y - circleB.collider.y;
      const distance = dx * dx + dy * dy;
      const minDist = circleA.radius + circleB.radius;

      if (distance < minDist * minDist) {
        collisions.push([circleA, circleB]);
      }
    }
  }

  return collisions;
}

function addBlobToScene(
  scene: AnatomyBlobScene,
  centerX: number,
  centerY: number,
  radius: number,
  imageIndex: number,
) {
  const { outline, contours, constraints } = makeBlobShape(
    centerX,
    centerY,
    radius,
  );

  scene.allParticles.push(...outline);
  scene.collisionLookup.push(...outline);
  scene.allConstraints.push(...constraints);

  for (const contour of contours) {
    scene.allParticles.push(...contour);
    scene.collisionLookup.push(...contour);
  }

  scene.loops.push({
    outline,
    contours,
    constraints,
    imageIndex,
  });
}

function getSceneScaler(width: number, height: number) {
  const maxSize = Math.max(width, height);
  const minSize = Math.min(width, height) * 0.75 + maxSize * 0.25;
  return minSize / 900;
}

export function createAnatomyBlobScene(
  width: number,
  height: number,
): AnatomyBlobScene {
  const scene: AnatomyBlobScene = {
    loops: [],
    allParticles: [],
    allConstraints: [],
    collisionLookup: [],
    pointerBall: {
      x: width / 2,
      y: height / 2,
      vx: 0,
      vy: 0,
      radius: POINTER_BALL_RADIUS,
    },
  };

  const scaler = getSceneScaler(width, height);
  const layouts = [
    { x: 0.72, y: 0.24, size: 0.52, imageIndex: 0 },
    { x: 0.28, y: 0.38, size: 0.46, imageIndex: 1 },
    { x: 0.5, y: 0.56, size: 0.5, imageIndex: 2 },
  ] as const;

  for (const layout of layouts) {
    const radius = layout.size * 130 * scaler;
    addBlobToScene(
      scene,
      width * layout.x + (Math.random() - 0.5) * 30,
      height * layout.y,
      radius,
      layout.imageIndex,
    );
  }

  for (const particle of scene.allParticles) {
    particle.prevPos.y -= 2;
  }

  return scene;
}

function constrainPointerBall(ball: PointerBall, width: number, height: number) {
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

function pushParticlesFromRigidBall(
  particles: AnatomyParticle[],
  ball: PointerBall,
  ballVx: number,
  ballVy: number,
) {
  for (let pass = 0; pass < POINTER_BALL_PUSH_PASSES; pass++) {
    for (const particle of particles) {
      const diffx = particle.pos.x - ball.x;
      const diffy = particle.pos.y - ball.y;
      const dist = Math.sqrt(diffx * diffx + diffy * diffy);
      const combined = ball.radius + particle.radius;

      if (dist >= combined || dist === 0) continue;

      const overlap = combined - dist;
      const nx = diffx / dist;
      const ny = diffy / dist;
      const pushX = nx * overlap * POINTER_BALL_PUSH_STRENGTH;
      const pushY = ny * overlap * POINTER_BALL_PUSH_STRENGTH;

      particle.move(pushX, pushY);
      particle.prevPos.x =
        particle.pos.x - ballVx * POINTER_BALL_VELOCITY_TRANSFER - pushX * 0.2;
      particle.prevPos.y =
        particle.pos.y - ballVy * POINTER_BALL_VELOCITY_TRANSFER - pushY * 0.2;
    }
  }
}

function simulateAnatomyScene(
  scene: AnatomyBlobScene,
  width: number,
  height: number,
  ballActive: boolean,
) {
  const margin = width * 0.025;
  const { pointerBall } = scene;
  const ballVx = pointerBall.vx;
  const ballVy = pointerBall.vy;

  for (let step = 0; step < SIMULATION_SUBSTEPS; step++) {
    for (const particle of scene.allParticles) {
      if (particle.pos.y > 0) {
        particle.applyForce(0, GRAVITY_FORCE);
      }
      particle.update(SIMULATION_DELTA);
    }

    for (const constraint of scene.allConstraints) {
      constraint.update();
    }

    if (ballActive) {
      pushParticlesFromRigidBall(scene.allParticles, pointerBall, ballVx, ballVy);
    }

    const collisions = detectCircleCollisions(scene.collisionLookup);
    for (const [a, b] of collisions) {
      resolveParticleCollision(a, b);
    }

    for (const particle of scene.allParticles) {
      const keepInTop = particle.prevPos.y - particle.radius > margin;
      constrainParticle(
        particle,
        margin,
        width - margin,
        keepInTop ? margin : -99999,
        height - margin,
        1,
      );
    }
  }
}

export function stepAnatomyBlobScene(
  scene: AnatomyBlobScene,
  width: number,
  height: number,
  pointerX: number,
  pointerY: number,
  pointerActive: boolean,
) {
  stepPointerBall(
    scene.pointerBall,
    pointerX,
    pointerY,
    pointerActive,
    width,
    height,
  );

  simulateAnatomyScene(scene, width, height, pointerActive);
}

export function drawClosedLoopCurve(
  ctx: CanvasRenderingContext2D,
  particles: AnatomyParticle[],
) {
  const len = particles.length;
  if (len < 3) return;

  ctx.beginPath();

  for (let i = 0; i < len; i++) {
    const p0 = particles[(i - 1 + len) % len].pos;
    const p1 = particles[i].pos;
    const p2 = particles[(i + 1) % len].pos;
    const p3 = particles[(i + 2) % len].pos;

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

export function clipToLoop(
  ctx: CanvasRenderingContext2D,
  particles: AnatomyParticle[],
) {
  drawClosedLoopCurve(ctx, particles);
  ctx.clip();
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

function getSourceSize(image: CanvasImageSource) {
  if (image instanceof HTMLVideoElement) {
    return { width: image.videoWidth, height: image.videoHeight };
  }
  if (image instanceof HTMLImageElement) {
    return {
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
    };
  }
  if (image instanceof HTMLCanvasElement) {
    return { width: image.width, height: image.height };
  }
  return { width: 0, height: 0 };
}

export function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  width: number,
  height: number,
) {
  const { width: sourceWidth, height: sourceHeight } = getSourceSize(image);

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
  "rgba(200, 120, 60, 0.9)",
  "rgba(160, 60, 200, 0.9)",
  "rgba(60, 200, 200, 0.9)",
] as const;

export function drawAnatomyBlobSceneDebug(
  ctx: CanvasRenderingContext2D,
  scene: AnatomyBlobScene,
  pointerX: number,
  pointerY: number,
  pointerActive: boolean,
) {
  const { pointerBall } = scene;

  for (let index = 0; index < scene.loops.length; index++) {
    const loop = scene.loops[index];
    const color = DEBUG_COLORS[index % DEBUG_COLORS.length];

    ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
    ctx.lineWidth = 1;
    for (const spring of loop.constraints) {
      ctx.beginPath();
      ctx.moveTo(spring.p1.pos.x, spring.p1.pos.y);
      ctx.lineTo(spring.p2.pos.x, spring.p2.pos.y);
      ctx.stroke();
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    drawClosedLoopCurve(ctx, loop.outline);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = color;
    for (const particle of loop.outline) {
      ctx.beginPath();
      ctx.arc(particle.pos.x, particle.pos.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(particle.collider.x, particle.collider.y, particle.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(pointerBall.x, pointerBall.y, pointerBall.radius, 0, Math.PI * 2);
  ctx.stroke();

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
  }
}

export function addBlobAtPointer(
  scene: AnatomyBlobScene,
  x: number,
  y: number,
  width: number,
  height: number,
  imageIndex: number,
) {
  const scaler = getSceneScaler(width, height);
  const radius = (Math.random() * 0.35 + 0.45) * 110 * scaler;
  addBlobToScene(scene, x, y, radius, imageIndex);
}
