import { TextInput, type TextInputProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export function ThemedInput({ style, placeholderTextColor, ...props }: TextInputProps) {
  const theme = useTheme();

  return (
    <TextInput
      {...props}
      placeholderTextColor={placeholderTextColor ?? theme.muted}
      style={[{ borderBottomColor: theme.line, color: theme.ink }, style]}
    />
  );
}
