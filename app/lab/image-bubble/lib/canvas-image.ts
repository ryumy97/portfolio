import type { Particle } from "./particle";
import { traceSmoothBlobOutline } from "./render-path";

export function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
) {
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const x = (width - drawWidth) * 0.5;
  const y = (height - drawHeight) * 0.5;
  ctx.drawImage(image, x, y, drawWidth, drawHeight);
}

export function clipToBlobOutline(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
) {
  traceSmoothBlobOutline(ctx, particles);
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
  ctx.clip();
}
