import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { CurrencyMark } from '@/components/ui/currency-mark';
import { ThemedInput } from '@/components/ui/themed-input';
import { ThemedText } from '@/components/ui/themed-text';
import { Spacing, Typography } from '@/constants/theme';

/** Shared lowercase-eyebrow form label used above inputs across every form. */
export function FieldLabel({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <ThemedText type="code" themeColor="muted" style={[styles.label, style]}>
      {children}
    </ThemedText>
  );
}

/** Currency mark + numeric input pair with its label; the standard money field. */
export function MoneyField({
  label,
  value,
  onChangeText,
  accessibilityLabel,
  placeholder = '0',
  autoFocus = false,
  style,
  labelStyle,
  inputStyle,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  accessibilityLabel: string;
  placeholder?: string;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  inputStyle?: StyleProp<TextStyle>;
}) {
  return (
    <View style={style}>
      <FieldLabel style={labelStyle}>{label}</FieldLabel>
      <View style={styles.row}>
        <CurrencyMark />
        <ThemedInput
          accessibilityLabel={accessibilityLabel}
          keyboardType="numeric"
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          autoFocus={autoFocus}
          style={[styles.input, inputStyle]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: Typography.eyebrow,
  row: { alignItems: 'center', flexDirection: 'row', gap: Spacing.two },
  input: { flex: 1 },
});
