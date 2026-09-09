import { useState, type ComponentProps } from 'react';
import { ScrollView, View } from 'react-native';
import Svg from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AiSheetModal } from '@/components/ui/ai-sheet-modal';
import { EmptyState } from '@/components/feedback/empty-state';
import { FinanceHeroCard } from '@/components/ui/finance-hero-card';
import {
  MotionAnimatedView,
  MotionPressable as Pressable,
  MotionScreen,
  motionPresets,
} from '@/components/ui/motion';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import { formatMonth, formatMonthShort } from '@/i18n/format';
import { getCategoryLabel } from '@/i18n/categories';
import { formatMoney } from '@/utils/money';
import type { BudgetAIInput } from '@/lib/ai-service';
import { readReportView } from '../read';
import { useReportInsight } from '../hooks/use-report-insight';
import {
  ChartCard,
  Donut,
  NetSavingLineChart,
  chartColors,
  percentage,
} from '../components/report-charts';
import { ReportHeader } from '../components/report-header';
import { styles } from './report-screen.styles';

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
  const { snapshot, expenses, period, periods, netSavingByPeriod } = reportView;
  const [range, setRange] = useState(3);
  const [insightOpen, setInsightOpen] = useState(false);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [dismissSignal, setDismissSignal] = useState(0);
  const insight = useReportInsight({ open: insightOpen, aiInput, reportView });

  const chartPoints = netSavingByPeriod.slice(-range);
  const updateRange = (months: number) => {
    setRange(months);
    setRangeOpen(false);
    void onRangeChange(months);
  };

  return (
    <ThemedView style={styles.page} onTouchStart={() => setDismissSignal((current) => current + 1)}>
      <ScrollView contentContainerStyle={styles.content}>
        <ReportHeader
          period={period}
          periods={periods}
          configuredStartDay={reportView.startDay}
          dismissSignal={dismissSignal}
          onPeriodStartDayChange={onPeriodStartDayChange}
          onPeriodChange={onPeriodChange}
          onAskAi={() => setInsightOpen(true)}
        />
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
