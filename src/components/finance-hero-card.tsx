import { StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Shadows, Typography } from '@/constants/theme';
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
  style?: object;
};

export function FinanceHeroCard({ label, amount, marker, amountColor, footer, style }: FinanceHeroCardProps) {
  const theme = useTheme();

  return (
    <ThemedView style={[styles.card, { backgroundColor: theme.pine2 }, style]}>
      <ThemedText style={[styles.label, { color: theme.heroMuted }]}>
        {label}{marker && <ThemedText style={{ color: theme.heroMuted }}> {marker}</ThemedText>}
      </ThemedText>
      <ThemedText style={[styles.amount, { color: amountColor ?? theme.heroText }]}>{formatMoney(amount)}</ThemedText>
      <View style={[styles.footer, { borderTopColor: theme.heroDivider }]}>
        {footer.map((item, index) => (
          <View key={item.label} style={[styles.footerItem, index === footer.length - 1 && styles.footerItemRight]}>
            <ThemedText style={[styles.footerLabel, { color: theme.heroMuted }]}>{item.label}</ThemedText>
            <ThemedText style={[styles.footerValue, { color: item.valueColor ?? theme.heroText }]}>{item.value}</ThemedText>
          </View>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 26, padding: 21, ...Shadows.hero },
  label: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
  amount: { ...Typography.moneyHero, marginVertical: 12 },
  footer: { borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12 },
  footerItem: { flex: 1 },
  footerItemRight: { alignItems: 'flex-end' },
  footerLabel: { fontFamily: Fonts.sans, fontSize: 11, lineHeight: 15 },
  footerValue: { fontFamily: Fonts.monoMedium, fontSize: 11, lineHeight: 15 },
});
