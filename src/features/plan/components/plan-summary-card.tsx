import { FinanceHeroCard } from '@/components/ui/finance-hero-card';
import { MotionProgressBar } from '@/components/ui/motion';
import { ThemedText } from '@/components/ui/themed-text';
import { View, StyleSheet } from 'react-native';
import { Fonts, Layout, Radius, Typography } from '@/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatMoney } from '@/utils/money';
import { useTranslation } from 'react-i18next';
import type { BudgetSnapshot } from '@/types/domain';

export function PlanSummaryCard({ snapshot }: { snapshot: BudgetSnapshot }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const spareIsNegative = snapshot.spareBudget < 0;
  const expenseProgress =
    snapshot.totalIncome > 0 ? (snapshot.totalExpense / snapshot.totalIncome) * 100 : 0;

  return (
    <FinanceHeroCard
      label={t('common.spareBudget')}
      amount={snapshot.spareBudget}
      amountColor={spareIsNegative ? theme.expense : undefined}
      note={spareIsNegative ? t('common.spareBudgetOverPlan') : t('common.stillAllocatable')}
      noteColor={spareIsNegative ? theme.expense : undefined}
      labelStyle={styles.summaryLabel}
      style={styles.summaryCard}
    >
      <View style={styles.summaryProgressRow}>
        <MotionProgressBar
          value={expenseProgress}
          color={theme.pine}
          trackColor={theme.heroDivider}
          style={styles.summaryProgress}
          accessibilityLabel={t('common.spareBudget')}
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 0,
            max: 100,
            now: Math.min(Math.max(expenseProgress, 0), 100),
          }}
        />
        <ThemedText type="code" style={[styles.summaryProgressPercent, { color: theme.heroMuted }]}>
          {Math.max(0, Math.round(expenseProgress))}%
        </ThemedText>
      </View>
      <View style={styles.summaryStats}>
        <ThemedText type="small" style={[styles.summaryStat, { color: theme.heroMuted }]}>
          {t('common.income')}{' '}
          <ThemedText style={[styles.summaryStatValue, { color: theme.heroText }]}>
            {formatMoney(snapshot.totalIncome)}
          </ThemedText>
        </ThemedText>
        <ThemedText type="small" style={[styles.summaryStat, { color: theme.heroMuted }]}>
          {t('common.expense')}{' '}
          <ThemedText style={[styles.summaryStatValue, { color: theme.heroText }]}>
            {formatMoney(snapshot.totalExpense)}
          </ThemedText>
        </ThemedText>
      </View>
    </FinanceHeroCard>
  );
}

const styles = StyleSheet.create({
  summaryCard: { marginBottom: Layout.sectionGap },
  summaryLabel: { ...Typography.eyebrow },
  summaryProgressRow: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 10 },
  summaryProgress: {
    borderRadius: Radius.pill,
    flex: 1,
    height: 5,
    overflow: 'hidden',
  },
  summaryProgressPercent: { minWidth: 34, textAlign: 'right' },
  summaryStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  summaryStat: { fontSize: 10, lineHeight: 14 },
  summaryStatValue: { fontFamily: Fonts.mono, fontSize: 10 },
});
