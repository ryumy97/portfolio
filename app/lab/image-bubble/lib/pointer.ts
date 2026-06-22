import { lerp } from "@/lib/math";
import { clipToCircle, drawCoverImage } from "./canvas-image";

export type PointerInput = {
  x: number;
  y: number;
  active: boolean;
};

export const DEFAULT_POINTER: PointerInput = {
  x: 0,
  y: 0,
  active: true,
};

export class PointerBall {
  x: number;
  y: number;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  step(input: PointerInput, lerpFactor: number) {
    const prevX = this.x;
    const prevY = this.y;

    if (input.active) {
      this.x = lerp(this.x, input.x, lerpFactor);
      this.y = lerp(this.y, input.y, lerpFactor);
    }

    return { prevX, prevY };
  }

  draw(ctx: CanvasRenderingContext2D, radius: number, active: boolean) {
    if (!active) return;

    ctx.beginPath();
    ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
    ctx.fill();
    ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  drawMaskedImage(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    width: number,
    height: number,
    radius: number,
    active: boolean,
  ) {
    if (!active) return;

    ctx.save();
    clipToCircle(ctx, this.x, this.y, radius);
    drawCoverImage(ctx, image, width, height);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}
