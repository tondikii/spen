import { useContext } from 'react';

import { Colors } from '@/theme';
import { ThemeContext } from '@/providers/theme-provider';

export function useTheme() {
  const context = useContext(ThemeContext);

  if (context) {
    return context.theme;
  }

  return Colors.light;
}
