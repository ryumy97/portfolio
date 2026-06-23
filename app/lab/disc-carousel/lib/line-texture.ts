import * as THREE from "three";
import type { CarouselImageItem } from "../images";
import { LINES_RATIO } from "../scene";

const LINE_TEXTURE_SELECTOR = 'canvas[data-texture-id="line-texture"]';

function getSansFontFamily() {
  if (typeof document === "undefined") return "Lato, sans-serif";

  const root = document.documentElement;

  const sans = getComputedStyle(root).getPropertyValue("--font-sans").trim();
  if (sans && !sans.startsWith("var(")) return sans;

  return getComputedStyle(document.body).fontFamily || "Lato, sans-serif";
}

function getHeadingFontFamily() {
  if (typeof document === "undefined") return "Playfair Display, sans-serif";

  const root = document.documentElement;

  const playfairDisplay = getComputedStyle(root)
    .getPropertyValue("--font-playfair-display")
    .trim();
  if (playfairDisplay && !playfairDisplay.startsWith("var("))
    return playfairDisplay;

  return (
    getComputedStyle(document.body).fontFamily || "Playfair Display, sans-serif"
  );
}

function canvasFont(weight: number, size: number, type: "sans" | "heading") {
  return `${weight} ${size}px ${type === "sans" ? getSansFontFamily() : getHeadingFontFamily()}`;
}

function resolveLineCanvas(size: number) {
  const existing = document.querySelector<HTMLCanvasElement>(
    LINE_TEXTURE_SELECTOR,
  );
  const canvas = existing ?? document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

export function createRadialLinesTexture(
  items: readonly CarouselImageItem[],
  size = 2048,
  lineWidth = 2,
) {
  const canvas = resolveLineCanvas(size);
  const count = items.length;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create line canvas context");
  }

  const center = size / 2;
  const innerRadius = LINES_RATIO * center;
  const outerRadius = center;
  const labelRadius = center;

  ctx.clearRect(0, 0, size, size);
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  for (let index = 0; index < count; index++) {
    const item = items[index];
    if (!item) continue;

    const angle = (index / count) * Math.PI * 2;
    const innerX = center + Math.sin(angle) * innerRadius;
    const innerY = center + Math.cos(angle) * innerRadius;
    const outerX = center + Math.sin(angle) * outerRadius;
    const outerY = center + Math.cos(angle) * outerRadius;
    const labelX = center + Math.sin(angle) * labelRadius;
    const labelY = center + Math.cos(angle) * labelRadius;

    ctx.beginPath();
    ctx.moveTo(innerX, innerY);
    ctx.lineTo(outerX, outerY);
    ctx.strokeStyle = "#606060";
    ctx.stroke();

    ctx.save();
    ctx.translate(labelX, labelY);
    ctx.rotate(-angle - Math.PI / 2);
    ctx.fillStyle = "#1e1e1e";
    ctx.font = canvasFont(700, 32, "heading");
    ctx.fillText(item.title, 0, -18);
    ctx.fillStyle = "#606060";
    ctx.font = canvasFont(400, 18, "sans");
    ctx.fillText(item.description, 0, 16);
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
