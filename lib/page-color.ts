import { normalizePath } from "@/lib/page-href";

/** Linear RGB 0–1 */
export type Rgb = readonly [number, number, number];

export const PAGE_COLOR = {
  ivory: [249 / 255, 248 / 255, 245 / 255],
  ink: [30 / 255, 30 / 255, 30 / 255],
  coral: [247 / 255, 93 / 255, 93 / 255],
  cobalt: [18 / 255, 85 / 255, 203 / 255],
} as const satisfies Record<string, Rgb>;

/** Settled field / particle color for each route. */
export function colorForPath(path: string): Rgb {
  const route = normalizePath(path);
  if (route.startsWith("/about")) return PAGE_COLOR.cobalt;
  if (route.startsWith("/projects")) return PAGE_COLOR.coral;
  if (route.startsWith("/gallery")) return PAGE_COLOR.ink;
  if (route.startsWith("/lab")) return PAGE_COLOR.cobalt;
  return PAGE_COLOR.ivory;
}

/** Home 1, About 2, Projects 3, Gallery 4, Lab 5. */
export function pageOrder(path: string): number {
  const route = normalizePath(path);
  if (route.startsWith("/about")) return 2;
  if (route.startsWith("/projects")) return 3;
  if (route.startsWith("/gallery")) return 4;
  if (route.startsWith("/lab")) return 5;
  return 1;
}

export function rgbToCss(rgb: Rgb) {
  return `rgb(${Math.round(rgb[0] * 255)} ${Math.round(rgb[1] * 255)} ${Math.round(rgb[2] * 255)})`;
}

export function applyDocumentBackground(rgb: Rgb) {
  const css = rgbToCss(rgb);
  document.documentElement.style.backgroundColor = css;
  document.body.style.backgroundColor = css;
}
