export class Particle {
  x: number;
  y: number;
  px: number;
  py: number;
  radius: number;
  spring: number;
  damp: number;
  private lastGravity = 0;

  constructor(x: number, y: number, radius: number, spring = 0.5, damp = 0.98) {
    this.x = x;
    this.y = y;
    this.px = x;
    this.py = y;
    this.radius = radius;
    this.spring = spring;
    this.damp = damp;
  }

  integrate(gravity: number) {
    const vx = (this.x - this.px) * this.damp;
    const vy = (this.y - this.py - this.lastGravity) * this.damp;
    this.px = this.x;
    this.py = this.y;
    this.x += vx;
    this.y += vy + gravity;
    this.lastGravity = gravity;
  }

  private pushOutFromPointer(
    pointerX: number,
    pointerY: number,
    pointerRadius: number,
  ) {
    const dx = this.x - pointerX;
    const dy = this.y - pointerY;
    const distSq = dx * dx + dy * dy;
    const minDist = pointerRadius + this.radius;
    if (distSq >= minDist * minDist) return;

    const dist = Math.max(distSq ** 0.5, 1e-6);
    const penetration = minDist - dist;
    const nx = dx / dist;
    const ny = dy / dist;

    this.x += nx * penetration;
    this.y += ny * penetration;
    this.px -= nx * penetration * 1;
    this.py -= ny * penetration * 1;
  }

  collidePointer(pointerX: number, pointerY: number, pointerRadius: number) {
    this.pushOutFromPointer(pointerX, pointerY, pointerRadius);
  }

  collidePointerSweep(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    pointerRadius: number,
  ) {
    const sx = toX - fromX;
    const sy = toY - fromY;
    const segLenSq = sx * sx + sy * sy;

    if (segLenSq < 1e-12) {
      this.pushOutFromPointer(fromX, fromY, pointerRadius);
      return;
    }

    const segLen = segLenSq ** 0.5;
    const steps = Math.max(1, Math.ceil(segLen / (pointerRadius * 0.35)));

    for (let step = 0; step <= steps; step++) {
      const t = step / steps;
      this.pushOutFromPointer(fromX + sx * t, fromY + sy * t, pointerRadius);
    }
  }

  constrain(left: number, top: number, right: number, bottom: number) {
    const { radius } = this;
    left += radius;
    top += radius;
    right -= radius;
    bottom -= radius;

    if (this.x < left) {
      this.x = left;
      this.px = left;
    } else if (this.x > right) {
      this.x = right;
      this.px = right;
    }

    if (this.y < top) {
      this.y = top;
      this.py = top;
      this.lastGravity = 0;
    } else if (this.y > bottom) {
      this.y = bottom;
      this.py = bottom;
      this.lastGravity = 0;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(34, 197, 94, 0.35)";
    ctx.fill();
    ctx.strokeStyle = "rgba(34, 197, 94, 0.95)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(this.px, this.py);
    ctx.lineTo(this.x, this.y);
    ctx.strokeStyle = "rgba(249, 115, 22, 0.8)";
    ctx.stroke();
  }
}
