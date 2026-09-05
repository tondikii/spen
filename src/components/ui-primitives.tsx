import type { ReactNode } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import { Layout, MaxContentWidth, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MotionAnimatedView, MotionPressable, motionPresets } from '@/components/motion';

/** Shared page frame for native screens. Keeps safe-area and content width in one place. */
export function ScreenFrame({
  children,
  scroll = false,
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: object;
}) {
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.pageContent, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.pageContent, contentStyle]}>{children}</View>
  );

  return (
    <ThemedView style={styles.page}>
      <SafeAreaView style={styles.safeArea}>{content}</SafeAreaView>
    </ThemedView>
  );
}

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

export function SectionHeader({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <ThemedText type="sectionHeading">{title}</ThemedText>
      {action && onPress && (
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel={action}
          hitSlop={8}
          onPress={onPress}
          style={styles.quietAction}
        >
          <ThemedText type="smallBold" style={{ color: theme.pine }}>
            {action}
          </ThemedText>
        </MotionPressable>
      )}
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

export function StatusBadge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'positive' | 'negative' | 'warning';
}) {
  const theme = useTheme();
  const toneColor = {
    neutral: theme.muted,
    positive: theme.income,
    negative: theme.expense,
    warning: theme.gold,
  }[tone];
  const toneBackground = {
    neutral: theme.mint,
    positive: theme.incomeBackground,
    negative: theme.expenseBackground,
    warning: theme.transferBackground,
  }[tone];
  return (
    <View accessibilityLabel={label} style={[styles.badge, { backgroundColor: toneBackground }]}>
      <ThemedText type="smallBold" style={{ color: toneColor }}>
        {label}
      </ThemedText>
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  const theme = useTheme();
  return (
    <MotionAnimatedView
      entering={motionPresets.itemEntering}
      layout={motionPresets.layout}
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.line }, style]}
    >
      {children}
    </MotionAnimatedView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  safeArea: { flex: 1 },
  pageContent: {
    alignSelf: 'center',
    maxWidth: MaxContentWidth,
    paddingBottom: 104,
    paddingHorizontal: Layout.pagePadding,
    paddingTop: 28,
    width: '100%',
  },
  header: { alignItems: 'center', flexDirection: 'row', marginBottom: Spacing.four },
  headerCopy: { flex: 1, gap: Spacing.one },
  eyebrow: Typography.eyebrow,
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  quietAction: { minHeight: 44, justifyContent: 'center', paddingHorizontal: Spacing.two },
  primary: {
    alignItems: 'center',
    borderRadius: Radius.medium,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 17,
    ...Shadows.fab,
  },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.72 },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  card: {
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Layout.pagePadding,
  },
});
