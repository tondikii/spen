import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { ThemedText } from '@/components/themed-text';
import { MotionAnimatedView, motionPresets } from '@/components/motion';
import { Fonts, Layout, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { formatMoney } from '@/lib/money';
import { useTheme } from '@/hooks/use-theme';

export type FinanceHeroFooterItem = {
  label: string;
  value: ReactNode;
  valueColor?: string;
};

type FinanceHeroCardProps = {
  label: string;
  amount: number;
  marker?: string;
  amountColor?: string;
  footer: FinanceHeroFooterItem[];
  style?: StyleProp<ViewStyle>;
};

export function FinanceHeroCard({
  label,
  amount,
  marker,
  amountColor,
  footer,
  style,
}: FinanceHeroCardProps) {
  const theme = useTheme();

  return (
    <MotionAnimatedView
      entering={motionPresets.itemEntering}
      layout={motionPresets.layout}
      style={[styles.card, { backgroundColor: theme.pine2 }, style]}
    >
      <ThemedText style={[styles.label, { color: theme.heroMuted }]}>
        {label}
        {marker && <ThemedText style={{ color: theme.heroMuted }}> {marker}</ThemedText>}
      </ThemedText>
      <ThemedText style={[styles.amount, { color: amountColor ?? theme.heroText }]}>
        {formatMoney(amount)}
      </ThemedText>
      <View style={[styles.footer, { borderTopColor: theme.heroDivider }]}>
        {footer.map((item, index) => (
          <View
            key={item.label}
            style={[styles.footerItem, index === footer.length - 1 && styles.footerItemRight]}
          >
            <ThemedText style={[styles.footerLabel, { color: theme.heroMuted }]}>
              {item.label}
            </ThemedText>
            <ThemedText style={[styles.footerValue, { color: item.valueColor ?? theme.heroText }]}>
              {item.value}
            </ThemedText>
          </View>
        ))}
      </View>
    </MotionAnimatedView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.hero, padding: Layout.pagePadding, ...Shadows.hero },
  label: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
  amount: { ...Typography.moneyHero, marginVertical: Spacing.two },
  footer: {
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
  },
  footerItem: { flex: 1 },
  footerItemRight: { alignItems: 'flex-end' },
  footerLabel: { fontFamily: Fonts.sans, fontSize: 11, lineHeight: 15 },
  footerValue: { fontFamily: Fonts.monoMedium, fontSize: 11, lineHeight: 15 },
});
