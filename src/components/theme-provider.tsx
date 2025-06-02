'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const initialState: ThemeProviderState = {
  theme: 'light', // Default initial state, will be updated by provider
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'testwave-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') {
      return defaultTheme; 
    }
    try {
      const storedTheme = window.localStorage.getItem(storageKey) as Theme | null;
      if (storedTheme) {
        return storedTheme;
      }
      // To add system preference detection later:
      // const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      // if (prefersDark) return 'dark';
      return defaultTheme;
    } catch (e) {
      console.error('Error reading theme from localStorage', e);
      return defaultTheme;
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
      try {
        window.localStorage.setItem(storageKey, theme);
      } catch (e) {
        console.error('Error saving theme to localStorage', e);
      }
    }
  }, [theme, storageKey]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      setThemeState(newTheme);
    },
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
