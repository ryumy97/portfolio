"use client";

import { useSyncExternalStore } from "react";

/** Tailwind-aligned min-width breakpoints (mobile-first). */
export const SCREEN = {
  sm: "(min-width: 40rem)" /* 640px */,
  md: "(min-width: 48rem)" /* 768px */,
  lg: "(min-width: 64rem)" /* 1024px */,
  xl: "(min-width: 80rem)" /* 1280px */,
  "2xl": "(min-width: 96rem)" /* 1536px */,
} as const;

export type ScreenBreakpoint = keyof typeof SCREEN;

function subscribe(query: string, onStoreChange: () => void) {
  const mediaQueryList = window.matchMedia(query);
  mediaQueryList.addEventListener("change", onStoreChange);
  return () => mediaQueryList.removeEventListener("change", onStoreChange);
}

function getSnapshot(query: string) {
  return window.matchMedia(query).matches;
}

function getServerSnapshot() {
  return false;
}

/** Returns whether the given media query currently matches. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onStoreChange) => subscribe(query, onStoreChange),
    () => getSnapshot(query),
    getServerSnapshot,
  );
}
