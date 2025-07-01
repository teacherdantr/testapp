
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

type UIVersion = 'v1' | 'v2' | 'v3' | 'v4';

interface UIVersionProviderProps {
  children: ReactNode;
  defaultVersion?: UIVersion;
  storageKey?: string;
}

interface UIVersionProviderState {
  uiVersion: UIVersion;
  setUIVersion: (version: UIVersion) => void;
}

const initialState: UIVersionProviderState = {
  uiVersion: 'v1',
  setUIVersion: () => null,
};

const UIVersionProviderContext = createContext<UIVersionProviderState>(initialState);

export function UIVersionProvider({
  children,
  defaultVersion = 'v1',
  storageKey = 'testwave-ui-version',
}: UIVersionProviderProps) {
  const [uiVersion, setUiVersionState] = useState<UIVersion>(defaultVersion);

  useEffect(() => {
    let storedVersion: UIVersion | null = null;
    try {
      storedVersion = window.localStorage.getItem(storageKey) as UIVersion | null;
    } catch (e) {
      console.error('Error reading UI version from localStorage', e);
    }
    
    if (storedVersion) {
      setUiVersionState(storedVersion);
    }
  }, [storageKey]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('ui-v1', 'ui-v2', 'ui-v3', 'ui-v4');
    
    // Add the current version class
    if (uiVersion === 'v1') root.classList.add('ui-v1');
    else if (uiVersion === 'v2') root.classList.add('ui-v2');
    else if (uiVersion === 'v3') root.classList.add('ui-v3');
    else if (uiVersion === 'v4') root.classList.add('ui-v4');

    try {
      window.localStorage.setItem(storageKey, uiVersion);
    } catch (e) {
      console.error('Error saving UI version to localStorage', e);
    }
  }, [uiVersion, storageKey]);

  const value = {
    uiVersion,
    setUIVersion: (newVersion: UIVersion) => {
      setUiVersionState(newVersion);
    },
  };

  return (
    <UIVersionProviderContext.Provider value={value}>
      {children}
    </UIVersionProviderContext.Provider>
  );
}

export const useUIVersion = () => {
  const context = useContext(UIVersionProviderContext);
  if (context === undefined) {
    throw new Error('useUIVersion must be used within a UIVersionProvider');
  }
  return context;
};
