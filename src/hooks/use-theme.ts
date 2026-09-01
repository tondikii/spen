import { useContext } from 'react';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { ThemeContext } from '@/components/theme-provider';

export function useTheme() {
  const context = useContext(ThemeContext);
  const systemScheme = useColorScheme();

  if (context) {
    return context.theme;
  }

  return Colors[systemScheme === 'dark' ? 'dark' : 'light'];
}
