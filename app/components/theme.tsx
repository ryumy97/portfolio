'use client';

import { useEffect } from 'react';
import { create } from 'zustand';
import { DARK_MODE, useMedia } from '../utils/media';

type Theme = 'light' | 'dark';

type Store = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const useTheme = create<Store>((set) => ({
  theme: 'light',
  setTheme: (theme: Theme) => set({ theme }),
}));

export const Theme: React.FC = () => {
  const isDarkMode = useMedia(DARK_MODE, 'darkMode');

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
      useTheme.getState().setTheme('dark');
    } else {
      document.body.classList.remove('dark');
      useTheme.getState().setTheme('light');
    }
  }, [isDarkMode]);

  return null;
};
