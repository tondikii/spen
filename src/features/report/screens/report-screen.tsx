import { useEffect, useState, type ComponentProps } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AiSheetModal } from '@/components/ui/ai-sheet-modal';
import { EmptyState } from '@/components/feedback/empty-state';
import { FinanceHeroCard } from '@/components/ui/finance-hero-card';
import { BudgetPeriodPicker } from '@/components/ui/budget-period-picker';
import {
  MotionAnimatedView,
  MotionPressable as Pressable,
  MotionScreen,
  motionPresets,
} from '@/components/ui/motion';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { BottomTabInset, Fonts, Radius, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import { formatMonth, formatMonthShort } from '@/i18n/format';
import { getCategoryLabel } from '@/i18n/categories';
import { formatMoney } from '@/lib/money';
import type { BudgetAIInput } from '@/lib/ai-service';
import { readReportView } from '../read';
import { useReportInsight } from '../hooks/use-report-insight';
import { ChartCard, Donut, NetSavingLineChart, chartColors, percentage } from './report-charts';

type ReportView = Awaited<ReturnType<typeof readReportView>>;

function ReportScreenContent({
  reportView,
  onRangeChange,
  onPeriodStartDayChange,
  onPeriodChange,
  aiInput,
}: {
  reportView: ReportView;
  onRangeChange: (months: number) => void | Promise<void>;
  onPeriodStartDayChange: (day: number) => void | Promise<void>;
  onPeriodChange: (periodId: string) => void | Promise<void>;
  aiInput?: BudgetAIInput;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  const {
    snapshot,
    expenses,
    period,
    periods,
    startDay: configuredStartDay,
    netSavingByPeriod,
  } = reportView;
  const [startDay, setStartDay] = useState(configuredStartDay);
  const [range, setRange] = useState(3);
  const [insightOpen, setInsightOpen] = useState(false);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [dismissSignal, setDismissSignal] = useState(0);
  const insight = useReportInsight({ open: insightOpen, aiInput, reportView });
  /* eslint-disable react-hooks/set-state-in-effect -- selected period is an external read result. */
  useEffect(() => {
    const isActive = period.id === periods[periods.length - 1]?.id;
    setStartDay(isActive ? configuredStartDay : Number(period.startDate.slice(-2)));
  }, [configuredStartDay, period.id, period.startDate, periods]);
  /* eslint-enable react-hooks/set-state-in-effect */
  const periodIndex = periods.findIndex((candidate) => candidate.id === period.id);
  const hasPreviousPeriod = periodIndex > 0;
  const hasNextPeriod = periodIndex >= 0 && periodIndex < periods.length - 1;

  const chartPoints = netSavingByPeriod.slice(-range);
  const updateRange = (months: number) => {
    setRange(months);
    setRangeOpen(false);
    void onRangeChange(months);
  };

  return (
    <ThemedView style={styles.page} onTouchStart={() => setDismissSignal((current) => current + 1)}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <ThemedText type="code" themeColor="muted" style={styles.eyebrow}>
              {t('common.planEyebrow')}
            </ThemedText>
            <ThemedText type="title">{t('common.report')}</ThemedText>
            <BudgetPeriodPicker
              period={period}
              startDay={startDay}
              readOnly={periodIndex >= 0 && periodIndex < periods.length - 1}
              dismissSignal={dismissSignal}
              onStartDayChange={(day) => {
                setStartDay(day);
                return onPeriodStartDayChange(day);
              }}
            />
            <View style={styles.periodStepper}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.previousReport')}
                accessibilityState={{ disabled: !hasPreviousPeriod }}
                disabled={!hasPreviousPeriod}
                onPress={() => {
                  if (hasPreviousPeriod) void onPeriodChange(periods[periodIndex - 1].id);
                }}
                style={[
                  styles.stepperButton,
                  { borderColor: theme.line },
                  !hasPreviousPeriod && styles.disabled,
                ]}
              >
                <ThemedText type="smallBold">‹</ThemedText>
              </Pressable>
              <ThemedText type="small" themeColor="muted">
                {periodIndex + 1} / {periods.length}
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.nextReport')}
                accessibilityState={{ disabled: !hasNextPeriod }}
                disabled={!hasNextPeriod}
                onPress={() => {
                  if (hasNextPeriod) void onPeriodChange(periods[periodIndex + 1].id);
                }}
                style={[
                  styles.stepperButton,
                  { borderColor: theme.line },
                  !hasNextPeriod && styles.disabled,
                ]}
              >
                <ThemedText type="smallBold">›</ThemedText>
              </Pressable>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.reportAskAi')}
            onPress={() => setInsightOpen(true)}
            wrapperStyle={styles.aiAction}
            style={[styles.aiButton, { borderColor: theme.line, backgroundColor: theme.mint }]}
          >
            <ThemedText
              type="smallBold"
              themeColor="pine"
              style={styles.aiButtonText}
              numberOfLines={1}
            >
              ✦ {t('common.reportAskAi')}
            </ThemedText>
          </Pressable>
        </View>
        <FinanceHeroCard
          label={(snapshot.netSaving < 0
            ? t('common.defisit')
            : t('common.reportNetSaving')
          ).toUpperCase()}
          amount={snapshot.netSaving}
          amountColor={snapshot.netSaving < 0 ? theme.expense : undefined}
          footer={[
            { label: t('common.income'), value: formatMoney(snapshot.totalIncome) },
            { label: t('common.expense'), value: formatMoney(snapshot.totalExpense) },
          ]}
          style={styles.summary}
        />
        <ChartCard
          title={t('common.reportExpenses')}
          trailing={formatMonth(period.endDate, locale)}
        >
          {expenses.length === 0 ? (
            <EmptyState title={t('common.noExpenses')} style={styles.empty} />
          ) : (
            <View style={styles.chartReveal}>
              <View style={styles.pieArea}>
                <Donut expenses={expenses} total={snapshot.totalExpense} />
                <View style={styles.pieLabel}>
                  <ThemedText
                    type="smallBold"
                    adjustsFontSizeToFit
                    minimumFontScale={0.5}
                    numberOfLines={1}
                    style={styles.pieAmount}
                  >
                    {formatMoney(snapshot.totalExpense)}
                  </ThemedText>
                  <ThemedText type="small" themeColor="muted">
                    {t('common.totalOut')}
                  </ThemedText>
                </View>
              </View>
            </View>
          )}
          <View style={styles.legend}>
            {expenses.map((item, index) => (
              <View
                key={item.categoryId}
                style={[styles.legendRow, { borderTopColor: theme.line }]}
              >
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: chartColors(theme)[index % chartColors(theme).length] },
                  ]}
                />
                <ThemedText type="small" style={styles.legendName}>
                  {getCategoryLabel(item)}
                </ThemedText>
                <ThemedText type="smallBold" themeColor="muted">
                  {percentage(item.amount, snapshot.totalExpense)}%
                </ThemedText>
              </View>
            ))}
          </View>
        </ChartCard>
        <ChartCard
          title={t('common.reportNetSaving')}
          trailing={t('common.months', { months: range })}
          trailingAction={() => setRangeOpen((current) => !current)}
          trailingAccessibilityLabel={t('common.chooseNetSavingRange')}
          trailingExpanded={rangeOpen}
          trailingPopover={
            rangeOpen ? (
              <MotionAnimatedView
                entering={motionPresets.itemEntering}
                onTouchStart={(event) => event.stopPropagation()}
                style={[
                  styles.rangePopover,
                  { backgroundColor: theme.card, borderColor: theme.line },
                ]}
              >
                {[3, 6, 12].map((months) => (
                  <Pressable
                    key={months}
                    accessibilityRole="button"
                    accessibilityLabel={t('common.reportMonths', { months })}
                    onTouchStart={(event) => event.stopPropagation()}
                    onPress={() => updateRange(months)}
                    style={[styles.rangeOption, { borderBottomColor: theme.line }]}
                  >
                    <ThemedText type="smallBold" themeColor={range === months ? 'pine' : 'ink'}>
                      {t('common.months', { months })}
                    </ThemedText>
                  </Pressable>
                ))}
              </MotionAnimatedView>
            ) : null
          }
        >
          {chartPoints.length === 0 ? (
            <EmptyState title={t('common.noNetSaving')} style={styles.empty} />
          ) : (
            <>
              <View style={styles.chartReveal}>
                <View style={[styles.chart, { borderBottomColor: theme.line }]}>
                  <Svg
                    accessible
                    accessibilityLabel={t('common.reportTrend', {
                      values: chartPoints
                        .map(
                          (point) =>
                            `${formatMonthShort(point.period.startDate, locale)} ${formatMoney(point.netSaving)}`,
                        )
                        .join(', '),
                    })}
                    width="100%"
                    height="120"
                    viewBox="0 0 320 120"
                    preserveAspectRatio="none"
                  >
                    <NetSavingLineChart points={chartPoints} color={theme.pine} />
                  </Svg>
                </View>
              </View>
              <View style={styles.months}>
                {chartPoints.map((point) => (
                  <ThemedText key={point.period.id} type="small" themeColor="muted">
                    {formatMonthShort(point.period.startDate, locale)}
                  </ThemedText>
                ))}
              </View>
            </>
          )}
        </ChartCard>
      </ScrollView>
      <AiSheetModal
        visible={insightOpen}
        onClose={() => setInsightOpen(false)}
        loading={insight.loading}
        heading={t('common.insightThisMonth')}
        loadingText={t('common.insightReading')}
      >
        {insight.error ? (
          <View accessibilityLiveRegion="polite" style={styles.insightError}>
            <ThemedText style={{ color: theme.expense }}>{insight.error}</ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.retryInsight')}
              onPress={() => {
                insight.clearError();
                setInsightOpen(false);
                setTimeout(() => setInsightOpen(true), 0);
              }}
            >
              <ThemedText type="smallBold" themeColor="pine">
                {t('common.retryInsight')}
              </ThemedText>
            </Pressable>
          </View>
        ) : (
          <>
            <ThemedText type="small" themeColor="muted">
              {insight.source === 'fallback' ? t('common.insightLocal') : t('common.insightAi')}
            </ThemedText>
            <ThemedText style={styles.insightText}>{insight.text}</ThemedText>
          </>
        )}
      </AiSheetModal>
    </ThemedView>
  );
}

export default function ReportScreen(props: ComponentProps<typeof ReportScreenContent>) {
  const theme = useTheme();
  return (
    <MotionScreen>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.paper }]}>
        <ReportScreenContent {...props} />
      </SafeAreaView>
    </MotionScreen>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    alignSelf: 'center',
    maxWidth: 430,
    paddingBottom: BottomTabInset + 24,
    paddingHorizontal: 21,
    paddingTop: 24,
    width: '100%',
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  eyebrow: { ...Typography.eyebrow },
  periodStepper: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 8 },
  stepperButton: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  disabled: { opacity: 0.35 },
  aiButton: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  aiAction: { flexShrink: 0 },
  aiButtonText: { fontSize: 11, lineHeight: 14 },
  summary: { marginBottom: 24 },
  empty: { alignItems: 'center', gap: 7, paddingVertical: 38 },
  pieArea: { alignItems: 'center', height: 183, justifyContent: 'center', marginTop: 8 },
  chartReveal: { overflow: 'hidden' },
  pieLabel: { alignItems: 'center', position: 'absolute' },
  pieAmount: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    letterSpacing: -1,
    textAlign: 'center',
    width: 90,
  },
  legend: { flex: 1 },
  legendRow: {
    alignItems: 'center',
    flexDirection: 'row',
    borderTopColor: 'transparent',
    borderTopWidth: 1,
    gap: 7,
    paddingVertical: 10,
  },
  dot: { borderRadius: 4, height: 8, width: 8 },
  legendName: { flex: 1, fontSize: 11 },
  chart: {
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    height: 130,
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  months: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 7,
  },
  rangePopover: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 100,
    padding: 4,
    position: 'absolute',
    right: 0,
    top: 28,
    width: 148,
    zIndex: 100,
  },
  rangeOption: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 11,
  },
  insightText: { fontSize: 13, lineHeight: 21, marginTop: 17 },
  insightError: { gap: 12 },
});
