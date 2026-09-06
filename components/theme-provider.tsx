"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";
import { PAGE_THEMES } from "@/lib/page-color";

type Props = {
  children: ReactNode;
};

const ThemeProvider = ({ children }: Props) => {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="ink"
      enableSystem={false}
      enableColorScheme={false}
      disableTransitionOnChange
      storageKey="ryumy-page-theme-v2"
      themes={[...PAGE_THEMES]}
    >
      {children}
    </NextThemesProvider>
  );
};

export default ThemeProvider;
