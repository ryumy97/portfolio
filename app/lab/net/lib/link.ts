import type { Node } from "./node";

type Point = { x: number; y: number };

const distance = (a: Point, b: Point) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return (dx * dx + dy * dy) ** 0.5;
};

const distanceToSegment = (a: Point, b: Point, point: Point) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq <= 1e-12) return distance(a, point);

  const t = Math.max(
    0,
    Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lenSq),
  );
  return distance({ x: a.x + dx * t, y: a.y + dy * t }, point);
};

function solveBetween(
  a: Point,
  b: Point,
  restLength: number,
  minLength: number,
  spring: number,
  compressSpring: number,
  canMoveA: boolean,
  canMoveB: boolean,
) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = (dx * dx + dy * dy) ** 0.5;
  if (dist <= 1e-6) return;

  let targetLength = dist;
  let stiffness = spring;

  if (dist > restLength) {
    targetLength = restLength;
  } else if (dist < minLength) {
    targetLength = minLength;
    stiffness = spring * compressSpring;
  } else {
    return;
  }

  const diff = ((dist - targetLength) / dist) * stiffness * 0.5;
  const offsetX = dx * diff;
  const offsetY = dy * diff;

  if (canMoveA) {
    a.x += offsetX;
    a.y += offsetY;
  }
  if (canMoveB) {
    b.x -= offsetX;
    b.y -= offsetY;
  }
}

export class Link {
  readonly restLength: number;
  readonly minLength: number;
  mx: number;
  my: number;
  mpx: number;
  mpy: number;

  constructor(
    readonly a: Node,
    readonly b: Node,
    minLengthRatio = 0.35,
  ) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    this.restLength = (dx * dx + dy * dy) ** 0.5;
    this.minLength = this.restLength * minLengthRatio;
    this.mx = (a.x + b.x) * 0.5;
    this.my = (a.y + b.y) * 0.5;
    this.mpx = this.mx;
    this.mpy = this.my;
  }

  integrate(damp: number, gravity: number) {
    const vx = (this.mx - this.mpx) * damp;
    const vy = (this.my - this.mpy) * damp;
    this.mpx = this.mx;
    this.mpy = this.my;
    this.mx += vx;
    this.my += vy + gravity;
  }

  solve(spring: number, compressSpring: number) {
    solveBetween(
      this.a,
      this.b,
      this.restLength,
      this.minLength,
      spring,
      compressSpring,
      !this.a.anchor,
      !this.b.anchor,
    );
  }

  solveMidpoint(spring: number, compressSpring: number) {
    const halfRest = this.restLength * 0.5;
    const halfMin = this.minLength * 0.5;
    const midpoint = { x: this.mx, y: this.my };

    solveBetween(
      midpoint,
      this.a,
      halfRest,
      halfMin,
      spring,
      compressSpring,
      true,
      !this.a.anchor,
    );
    solveBetween(
      midpoint,
      this.b,
      halfRest,
      halfMin,
      spring,
      compressSpring,
      true,
      !this.b.anchor,
    );

    this.mx = midpoint.x;
    this.my = midpoint.y;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.moveTo(this.a.x, this.a.y);
    ctx.quadraticCurveTo(this.mx, this.my, this.b.x, this.b.y);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  distanceToPoint(x: number, y: number, samples = 16) {
    let minDist = Infinity;
    let previous = { x: this.a.x, y: this.a.y };

    for (let index = 1; index <= samples; index++) {
      const t = index / samples;
      const u = 1 - t;
      const point = {
        x: u * u * this.a.x + 2 * u * t * this.mx + t * t * this.b.x,
        y: u * u * this.a.y + 2 * u * t * this.my + t * t * this.b.y,
      };
      minDist = Math.min(minDist, distanceToSegment(previous, point, { x, y }));
      previous = point;
    }

    return minDist;
  }
}
