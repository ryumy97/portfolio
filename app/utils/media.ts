'use client';

import { useEffect, useState } from 'react';

export const MIN_SM = '(width >= 40rem)';
export const MAX_SM = '(width < 40rem)';
export const MIN_MD = '(width >= 48rem)';
export const MAX_MD = '(width < 48rem)';
export const MIN_LG = '(width >= 64rem)';
export const MAX_LG = '(width < 64rem)';
export const MIN_XL = '(width >= 80rem)';
export const MAX_XL = '(width < 80rem)';
export const MIN_XXL = '(width >= 96rem)';
export const MAX_XXL = '(width < 96rem)';
export const TOUCH = '(pointer: coarse)';
export const DARK_MODE = '(prefers-color-scheme: dark)';

export const isSM = () => window.matchMedia(MIN_SM);
export const isMD = () => window.matchMedia(MIN_MD);
export const isLG = () => window.matchMedia(MIN_LG);
export const isXL = () => window.matchMedia(MIN_XL);
export const isXXL = () => window.matchMedia(MIN_XXL);
export const isTouch = () => window.matchMedia(TOUCH);
export const isDarkMode = () => window.matchMedia(DARK_MODE);

export const checkWindow = () => typeof window !== 'undefined';
export const safelyGetWindowWidth = () => (checkWindow() ? window.innerWidth : 0);
export const safelyGetWindowHeight = () => (checkWindow() ? window.innerHeight : 0);

export const useMedia = (mediaQuery: string, key: string) => {
  const [match, setMatch] = useState(false);

  useEffect(() => {
    const onChange = (event: MediaQueryListEvent) => {
      setMatch(event.matches);

      sessionStorage.setItem(`${key}`, event.matches.toString());
    };

    const media = window.matchMedia(mediaQuery);
    setMatch(media.matches);
    sessionStorage.setItem(`${key}`, media.matches.toString());

    window.matchMedia(mediaQuery).addEventListener('change', onChange);

    return () => {
      window.matchMedia(mediaQuery).removeEventListener('change', onChange);
    };
  }, [mediaQuery, key]);

  return match;
};
