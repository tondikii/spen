import type { ReactNode } from 'react';
import { StyleSheet, View, type TextStyle } from 'react-native';

import { MotionPressable } from '@/components/ui/motion';
import { ThemedText } from '@/components/ui/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Fonts } from '@/theme';

export function SettingRow({
  icon,
  iconStyle,
  title,
  detail,
  children,
}: {
  icon: string;
  iconStyle?: TextStyle;
  title: string;
  detail: string;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: theme.line }]}>
      <View style={[styles.icon, { backgroundColor: theme.mint }]}>
        <ThemedText style={[styles.iconGlyph, iconStyle]} themeColor="pine">
          {icon}
        </ThemedText>
      </View>
      <View style={styles.copy}>
        <ThemedText type="smallBold" style={styles.rowTitle}>
          {title}
        </ThemedText>
        <ThemedText type="small" themeColor="muted" style={styles.rowDetail}>
          {detail}
        </ThemedText>
      </View>
      {children}
    </View>
  );
}

export function ActionRow({
  icon,
  iconStyle,
  title,
  detail,
  onPress,
}: {
  icon: string;
  iconStyle?: TextStyle;
  title: string;
  detail: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: theme.line },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.icon, { backgroundColor: theme.mint }]}>
        <ThemedText style={[styles.iconGlyph, iconStyle]} themeColor="pine">
          {icon}
        </ThemedText>
      </View>
      <View style={styles.copy}>
        <ThemedText type="smallBold" style={styles.rowTitle}>
          {title}
        </ThemedText>
        <ThemedText type="small" themeColor="muted" style={styles.rowDetail}>
          {detail}
        </ThemedText>
      </View>
      <ThemedText style={styles.chevron} themeColor="muted">
        ›
      </ThemedText>
    </MotionPressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  icon: {
    alignItems: 'center',
    borderRadius: 10,
    height: 35,
    justifyContent: 'center',
    width: 35,
  },
  iconGlyph: {
    fontFamily: Fonts.mono,
    fontSize: 18,
    lineHeight: 35,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  copy: { flex: 1 },
  rowTitle: { fontSize: 12, lineHeight: 16 },
  rowDetail: { fontSize: 10, lineHeight: 14 },
  chevron: { fontSize: 22, lineHeight: 26 },
  pressed: { opacity: 0.7 },
});
