import { createContext, type PropsWithChildren, useCallback, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { Colors, type ColorScheme, type Theme } from '@/constants/theme';
import type { ThemeMode } from '@/types/domain';

type ThemeContextValue = {
  theme: Theme;
  mode: ThemeMode;
  colorScheme: ColorScheme;
  setMode: (mode: ThemeMode) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function AppThemeProvider({ children, initialMode = 'system', onModeChange }: PropsWithChildren<{ initialMode?: ThemeMode; onModeChange?: (mode: ThemeMode) => void | Promise<void> }>) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(initialMode);
  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    void onModeChange?.(nextMode);
  }, [onModeChange]);
  const colorScheme: ColorScheme = mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
  const value = useMemo(
    () => ({ theme: Colors[colorScheme], mode, colorScheme, setMode }),
    [colorScheme, mode, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme harus digunakan di dalam AppThemeProvider');
  }
  return context;
}
