import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/ui/themed-text';
import { MotionAnimatedView, MotionPressable, motionPresets } from '@/components/ui/motion';

export function PageHeader({
  eyebrow,
  title,
  trailing,
}: {
  eyebrow?: string;
  title: string;
  trailing?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        {eyebrow && (
          <ThemedText type="code" themeColor="muted" style={styles.eyebrow}>
            {eyebrow}
          </ThemedText>
        )}
        <ThemedText type="title">{title}</ThemedText>
      </View>
      {trailing}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const theme = useTheme();
  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.primary, { backgroundColor: theme.pine }, disabled && styles.disabled]}
    >
      <ThemedText type="smallBold" style={{ color: theme.heroText }}>
        {label}
      </ThemedText>
    </MotionPressable>
  );
}

/**
 * Boxed card: rounded, bordered card surface shared by the report chart cards,
 * settings groups and the home archived-wallets box. Ships without padding so
 * both padded (report) and flush row-container (settings, home) usages keep
 * their layout; `style` merges after the base.
 */
export function BoxedCard({
  children,
  style,
  ...rest
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessible?: boolean;
  accessibilityLabel?: string;
}) {
  const theme = useTheme();
  return (
    <MotionAnimatedView
      entering={motionPresets.itemEntering}
      layout={motionPresets.layout}
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.line }, style]}
      {...rest}
    >
      {children}
    </MotionAnimatedView>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', flexDirection: 'row', marginBottom: Spacing.four },
  headerCopy: { flex: 1, gap: Spacing.one },
  eyebrow: Typography.eyebrow,
  primary: {
    alignItems: 'center',
    borderRadius: Radius.medium,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 17,
    ...Shadows.fab,
  },
  disabled: { opacity: 0.45 },
  card: {
    borderRadius: Radius.large,
    borderWidth: 1,
  },
});
