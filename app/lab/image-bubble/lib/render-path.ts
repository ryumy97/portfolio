import type { Particle } from "./particle";

const CATMULL_ROM_SCALE = 2.5;
const CHAIKIN_ITERATIONS = 2;

function midpoint(a: Particle, b: Particle) {
  return { x: (a.x + b.x) * 0.5, y: (a.y + b.y) * 0.5 };
}

function chaikin(
  points: { x: number; y: number }[],
  iterations: number,
): { x: number; y: number }[] {
  let current = points;

  for (let iteration = 0; iteration < iterations; iteration++) {
    const count = current.length;
    if (count < 3) return current;

    const next: { x: number; y: number }[] = [];
    for (let index = 0; index < count; index++) {
      const a = current[index];
      const b = current[(index + 1) % count];
      if (!a || !b) continue;

      next.push({
        x: a.x * 0.75 + b.x * 0.25,
        y: a.y * 0.75 + b.y * 0.25,
      });
      next.push({
        x: a.x * 0.25 + b.x * 0.75,
        y: a.y * 0.25 + b.y * 0.75,
      });
    }

    current = next;
  }

  return current;
}

function traceCatmullRomOutline(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
) {
  const count = points.length;
  if (count < 3) return;

  ctx.beginPath();

  for (let i = 0; i < count; i++) {
    const p0 = points[(i - 1 + count) % count];
    const p1 = points[i];
    const p2 = points[(i + 1) % count];
    const p3 = points[(i + 2) % count];
    if (!p0 || !p1 || !p2 || !p3) continue;

    const cp1x = p1.x + (p2.x - p0.x) / CATMULL_ROM_SCALE;
    const cp1y = p1.y + (p2.y - p0.y) / CATMULL_ROM_SCALE;
    const cp2x = p2.x - (p3.x - p1.x) / CATMULL_ROM_SCALE;
    const cp2y = p2.y - (p3.y - p1.y) / CATMULL_ROM_SCALE;

    if (i === 0) {
      ctx.moveTo(p1.x, p1.y);
    }
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }

  ctx.closePath();
}

export function traceSmoothBlobOutline(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
) {
  const count = particles.length;
  if (count < 3) return;

  const mids = Array.from({ length: count }, (_, index) => {
    const a = particles[index];
    const b = particles[(index + 1) % count];
    if (!a || !b) return null;
    return midpoint(a, b);
  }).filter((point): point is { x: number; y: number } => point !== null);

  traceCatmullRomOutline(ctx, chaikin(mids, CHAIKIN_ITERATIONS));
}
