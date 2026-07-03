function getSansFontFamily() {
  if (typeof document === "undefined") return "Lato, sans-serif";

  const root = document.documentElement;
  const sans = getComputedStyle(root).getPropertyValue("--font-sans").trim();
  if (sans && !sans.startsWith("var(")) return sans;

  return getComputedStyle(document.body).fontFamily || "Lato, sans-serif";
}

export type TextTextureOptions = {
  text: string;
  width: number;
  height: number;
  fontSize?: number;
};

export function drawTextOnCanvas(
  canvas: HTMLCanvasElement,
  text: string,
  fontSize?: number,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);

  const size = fontSize ?? Math.round(width * 0.16);
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 ${size}px ${getSansFontFamily()}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, width * 0.5, height * 0.5);
}

export function createTextCanvas({
  text,
  width,
  height,
  fontSize,
}: TextTextureOptions) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  drawTextOnCanvas(canvas, text, fontSize);
  return canvas;
}
