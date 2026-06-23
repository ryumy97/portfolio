import * as THREE from "three";

function getSansFontFamily() {
  if (typeof document === "undefined") return "Lato, sans-serif";

  const root = document.documentElement;
  const sans = getComputedStyle(root).getPropertyValue("--font-sans").trim();
  if (sans && !sans.startsWith("var(")) return sans;

  return getComputedStyle(document.body).fontFamily || "Lato, sans-serif";
}

export function createAngleLabelTexture(width = 192, height = 64) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  drawAngleLabel(texture, "0 · 0");
  return texture;
}

export function drawAngleLabel(texture: THREE.CanvasTexture, text: string) {
  const canvas = texture.image as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#1e1e1e";
  ctx.font = `400 32px ${getSansFontFamily()}`;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width * 0.92, canvas.height / 2);

  texture.needsUpdate = true;
}
