import { PAGE_THEMES, type PageTheme } from "@/lib/page-color";

export const THEME_STORAGE_KEY = "ryumy-page-theme-v2";
export const DEFAULT_THEME: PageTheme = "ink";

export function isPageTheme(value: string): value is PageTheme {
  return (PAGE_THEMES as readonly string[]).includes(value);
}

export function applyDocumentTheme(theme: string) {
  const root = document.documentElement;
  root.classList.remove(...PAGE_THEMES);
  if (isPageTheme(theme)) {
    root.classList.add(theme);
  }
}

export function readStoredTheme(): PageTheme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && isPageTheme(stored)) return stored;
  } catch {
    // Private mode can block storage.
  }
  return DEFAULT_THEME;
}

export function persistTheme(theme: string) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private mode can block storage.
  }
}
