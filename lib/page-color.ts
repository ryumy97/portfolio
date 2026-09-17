import { normalizePath } from "@/lib/page-href";

/** Linear RGB 0–1 */
export type Rgb = readonly [number, number, number];

export const PAGE_THEMES = ["ivory", "cobalt", "coral", "ink"] as const;
export type PageTheme = (typeof PAGE_THEMES)[number];

export const PAGE_COLOR = {
  ivory: [249 / 255, 248 / 255, 245 / 255],
  ink: [30 / 255, 30 / 255, 30 / 255],
  coral: [247 / 255, 93 / 255, 93 / 255],
  cobalt: [18 / 255, 85 / 255, 203 / 255],
} as const satisfies Record<string, Rgb>;

/** CSS class theme for each route. */
export function themeForPath(path: string): PageTheme {
  const route = normalizePath(path);
  if (route.startsWith("/cv")) return "cobalt";
  if (route.startsWith("/work")) return "coral";
  if (route.startsWith("/gallery")) return "ink";
  return "ivory";
}

export function themeClassName(theme: PageTheme) {
  return theme;
}

/** Settled field / particle color for each route. */
export function colorForPath(path: string): Rgb {
  const route = normalizePath(path);
  if (route.startsWith("/cv")) return PAGE_COLOR.cobalt;
  if (route.startsWith("/work")) return PAGE_COLOR.coral;
  if (route.startsWith("/gallery")) return PAGE_COLOR.ink;
  return PAGE_COLOR.ivory;
}

/** Home 1, CV 2, Work 3, Gallery 4, Lab 5, Blog 6. */
export function pageOrder(path: string): number {
  const route = normalizePath(path);
  if (route.startsWith("/cv")) return 2;
  if (route.startsWith("/work")) return 3;
  if (route.startsWith("/gallery")) return 4;
  if (route.startsWith("/lab")) return 5;
  if (route.startsWith("/blog")) return 6;
  return 1;
}

/** Top-level section: `/`, `/work`, `/gallery`, … */
export function pageSection(path: string): string {
  const route = normalizePath(path);
  if (route === "/") return "/";
  const [segment] = route.split("/").filter(Boolean);
  return `/${segment ?? ""}`;
}

export function isSamePageSection(a: string, b: string): boolean {
  return pageSection(a) === pageSection(b);
}

export function rgbToCss(rgb: Rgb) {
  return `rgb(${Math.round(rgb[0] * 255)} ${Math.round(rgb[1] * 255)} ${Math.round(rgb[2] * 255)})`;
}

export function applyDocumentBackground(rgb: Rgb) {
  const css = rgbToCss(rgb);
  document.documentElement.style.backgroundColor = css;
  document.body.style.backgroundColor = css;
}
