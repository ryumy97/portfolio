export class Node {
  x: number;
  y: number;
  px: number;
  py: number;
  readonly anchor: boolean;
  anchorX: number;
  anchorY: number;

  constructor(x: number, y: number, anchor = false) {
    this.x = x;
    this.y = y;
    this.px = x;
    this.py = y;
    this.anchor = anchor;
    this.anchorX = x;
    this.anchorY = y;
  }

  integrate(damp: number, gravity: number) {
    if (this.anchor) return;

    const vx = (this.x - this.px) * damp;
    const vy = (this.y - this.py) * damp;
    this.px = this.x;
    this.py = this.y;
    this.x += vx;
    this.y += vy + gravity;
  }

  setAnchorPosition(x: number, y: number) {
    if (!this.anchor) return;

    this.x = x;
    this.y = y;
    this.px = x;
    this.py = y;
    this.anchorX = x;
    this.anchorY = y;
  }

  lockAnchor() {
    if (!this.anchor) return;

    this.x = this.anchorX;
    this.y = this.anchorY;
    this.px = this.anchorX;
    this.py = this.anchorY;
  }

  pushFromPointer(
    pointerX: number,
    pointerY: number,
    radius: number,
    strength: number,
  ) {
    if (this.anchor) return;

    const dx = this.x - pointerX;
    const dy = this.y - pointerY;
    const distSq = dx * dx + dy * dy;
    const minDist = radius;
    if (distSq >= minDist * minDist) return;

    const dist = Math.max(distSq ** 0.5, 1e-6);
    const push = ((minDist - dist) / minDist) * strength;
    const nx = dx / dist;
    const ny = dy / dist;
    const offsetX = nx * push * minDist * 0.5;
    const offsetY = ny * push * minDist * 0.5;

    this.x += offsetX;
    this.y += offsetY;
    this.px -= offsetX * 0.5;
    this.py -= offsetY * 0.5;
  }

  draw(ctx: CanvasRenderingContext2D, radius: number) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fill();
  }

  drawDebug(ctx: CanvasRenderingContext2D, radius: number) {
    ctx.beginPath();
    ctx.moveTo(this.px, this.py);
    ctx.lineTo(this.x, this.y);
    ctx.strokeStyle = "rgba(249, 115, 22, 0.6)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = this.anchor
      ? "rgba(34, 197, 94, 0.9)"
      : "rgba(59, 130, 246, 0.9)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
