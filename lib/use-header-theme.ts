"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { type PageTheme, themeForPath } from "@/lib/page-color";

export function headerForeground(theme: PageTheme) {
  return theme === "ivory" ? "#1e1e1e" : "#f9f8f5";
}

export function pointerColor(theme: PageTheme) {
  return theme === "ivory" ? "#f75d5d" : "#f9f8f5";
}

export function useHeaderTheme() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<PageTheme>(() => themeForPath(pathname));

  useLayoutEffect(() => {
    const dest = themeForPath(pathname);
    setTheme(dest);
  }, [pathname]);

  return theme;
}
