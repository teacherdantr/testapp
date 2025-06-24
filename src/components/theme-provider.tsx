
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
  theme: 'light',
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'testwave-theme',
}: ThemeProviderProps) {
  // Initialize state to defaultTheme on both server and client to prevent mismatch.
  const [theme, setThemeState] = useState<Theme>(defaultTheme);

  useEffect(() => {
    // This effect runs only on the client, after hydration.
    // It safely reads the theme from localStorage.
    let storedTheme: Theme | null = null;
    try {
      storedTheme = window.localStorage.getItem(storageKey) as Theme | null;
    } catch (e) {
      console.error('Error reading theme from localStorage', e);
    }
    
    if (storedTheme) {
      setThemeState(storedTheme);
    }
  }, [storageKey]);

  useEffect(() => {
    // This effect applies the theme to the DOM and saves it to localStorage when it changes.
    // It runs only on the client.
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    try {
      window.localStorage.setItem(storageKey, theme);
    } catch (e) {
      console.error('Error saving theme to localStorage', e);
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
