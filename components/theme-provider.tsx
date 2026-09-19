"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { PAGE_THEMES, type PageTheme } from "@/lib/page-color";
import { applyDocumentTheme, DEFAULT_THEME, persistTheme } from "@/lib/theme";

type ThemeContextValue = {
  theme: PageTheme;
  setTheme: (theme: PageTheme) => void;
  themes: readonly PageTheme[];
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
  themes: PAGE_THEMES,
});

export function useTheme() {
  return useContext(ThemeContext);
}

function disableThemeTransitions() {
  const style = document.createElement("style");
  style.appendChild(
    document.createTextNode(
      "*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}",
    ),
  );
  document.head.appendChild(style);
  return () => {
    window.getComputedStyle(document.body);
    window.setTimeout(() => {
      style.remove();
    }, 1);
  };
}

type Props = {
  children: ReactNode;
};

const ThemeProvider = ({ children }: Props) => {
  const [theme, setThemeState] = useState<PageTheme>(DEFAULT_THEME);

  const setTheme = useCallback((next: PageTheme) => {
    const restore = disableThemeTransitions();
    setThemeState(next);
    persistTheme(next);
    applyDocumentTheme(next);
    restore();
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, themes: PAGE_THEMES }),
    [theme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export default ThemeProvider;
