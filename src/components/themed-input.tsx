import { TextInput, type TextInputProps } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function ThemedInput({ style, placeholderTextColor, ...props }: TextInputProps) {
  const theme = useTheme();

  return (
    <TextInput
      {...props}
      placeholderTextColor={placeholderTextColor ?? theme.muted}
      style={[styles.input, { borderBottomColor: theme.line, color: theme.ink }, style]}
    />
  );
}

const styles = {
  input: {
    borderBottomWidth: 1,
    fontFamily: Fonts.sans,
    fontSize: 16,
    minHeight: 44,
    paddingHorizontal: 8,
  },
} as const;
