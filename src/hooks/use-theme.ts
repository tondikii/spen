import { useContext } from 'react';

import { Colors } from '@/constants/theme';
import { ThemeContext } from '@/components/theme-provider';

export function useTheme() {
  const context = useContext(ThemeContext);

  if (context) {
    return context.theme;
  }

  return Colors.light;
}
