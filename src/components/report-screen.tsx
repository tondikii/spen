import { router } from 'expo-router';
import {
  useEffect,
  useState,
  type ComponentProps,
  type ComponentType,
  type ReactNode,
} from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Path, Rect } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FinanceHeroCard } from '@/components/finance-hero-card';
import { BudgetPeriodPicker } from '@/components/budget-period-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabInset, Fonts, Motion, Radius, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatMoney } from '@/lib/money';
import { aiService, type BudgetAIInput } from '@/services/ai-service';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { getIntlLocale } from '@/i18n/format';
import { getCategoryLabel } from '@/i18n/categories';
import { getErrorTranslationKey } from '@/lib/app-error';
import {
  getDatabaseReportView,
  getReportNetSavingLabel,
  getReportView,
  type ReportExpense,
} from '@/services/report-service';
import {
  MotionAnimatedView,
  MotionChevron,
  MotionPressable as Pressable,
  MotionScreen,
  motionPresets,
} from '@/components/motion';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const ClipPathCompat = ClipPath as unknown as ComponentType<{
  id: string;
  children?: ReactNode;
}>;

type ReportView =
  ReturnType<typeof getReportView> | Awaited<ReturnType<typeof getDatabaseReportView>>;

function ReportScreenContent({
  reportView = getReportView(),
  onRangeChange,
  onPeriodStartDayChange,
  onCategoryPress,
  aiInput,
}: {
  reportView?: ReportView;
  onRangeChange?: (months: number) => void | Promise<void>;
  onPeriodStartDayChange?: (day: number) => void | Promise<void>;
  onCategoryPress?: (expense: ReportExpense, period: ReportView['period']) => void;
  aiInput?: BudgetAIInput;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const locale = i18n.language === 'en' ? 'en' : 'id';
  const { snapshot, expenses, period, netSavingByPeriod } = reportView;
  const [startDay, setStartDay] = useState(Number(period.startDate.slice(-2)));
  const [range, setRange] = useState(3);
  const [insightOpen, setInsightOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [insightText, setInsightText] = useState('');
  const [insightSource, setInsightSource] = useState<'ai' | 'fallback'>('fallback');
  const [insightError, setInsightError] = useState('');
  const [rangeOpen, setRangeOpen] = useState(false);
  const [dismissSignal, setDismissSignal] = useState(0);
  useEffect(() => {
    if (!insightOpen) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      void aiService
        .generateInsight({
          ...(aiInput ?? {
            spareBudget: reportView.snapshot.spareBudget,
            totalIncome: reportView.snapshot.totalIncome,
            fixedExpense: 0,
            goalContributions: 0,
            netSaving: reportView.snapshot.netSaving,
            topExpenses: reportView.expenses.map((expense) => ({
              name: getCategoryLabel(expense, locale),
              amount: expense.amount,
            })),
          }),
          locale,
        })
        .then((result) => {
          if (cancelled) return;
          setInsightText(result.text);
          setInsightSource(result.source);
          setLoading(false);
        })
        .catch((cause) => {
          if (!cancelled) {
            setInsightError(t(getErrorTranslationKey(cause)));
            setLoading(false);
          }
        });
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    aiInput,
    insightOpen,
    locale,
    reportView.expenses,
    reportView.snapshot.netSaving,
    reportView.snapshot.spareBudget,
    reportView.snapshot.totalIncome,
    t,
  ]);

  const openCategory = (expense: ReportExpense) =>
    onCategoryPress
      ? onCategoryPress(expense, period)
      : router.push({
          pathname: '/history',
          params: {
            categoryId: expense.categoryId,
            categoryName: expense.name,
            startDate: period.startDate,
            endDate: period.endDate,
          },
        } as never);
  const chartPoints = netSavingByPeriod.slice(-range);
  const updateRange = (months: number) => {
    setRange(months);
    setRangeOpen(false);
    void onRangeChange?.(months);
  };

  return (
    <ThemedView
      style={styles.page}
      onTouchStart={() => setDismissSignal((current) => current + 1)}
    >
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
              dismissSignal={dismissSignal}
              onStartDayChange={(day) => {
                setStartDay(day);
                return onPeriodStartDayChange?.(day);
              }}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.reportAskAi')}
            onPress={() => {
              setLoading(true);
              setInsightOpen(true);
            }}
            style={[styles.aiButton, { borderColor: theme.line, backgroundColor: theme.mint }]}
          >
            <ThemedText type="smallBold" themeColor="pine" style={styles.aiButtonText}>
              ✦ {t('common.reportAskAi')}
            </ThemedText>
          </Pressable>
        </View>
        <FinanceHeroCard
          label={getReportNetSavingLabel(snapshot.netSaving).toUpperCase()}
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
          trailing={formatMonth(period.endDate)}
          theme={theme}
        >
          {expenses.length === 0 ? (
            <View style={styles.empty}>
              <ThemedText style={styles.emptyGlyph}>◌</ThemedText>
              <ThemedText type="smallBold">{t('common.noExpenses')}</ThemedText>
            </View>
          ) : (
            <View style={styles.chartReveal}>
              <View style={styles.pieArea}>
                <Donut expenses={expenses} total={snapshot.totalExpense} theme={theme} />
                <View style={styles.pieLabel}>
                  <ThemedText type="smallBold" style={styles.pieAmount}>
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
              <Pressable
                key={item.categoryId}
                accessibilityRole="button"
                accessibilityLabel={t('common.viewCategory', { name: getCategoryLabel(item) })}
                onPress={() => openCategory(item)}
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
              </Pressable>
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
                style={[styles.rangePopover, { backgroundColor: theme.card, borderColor: theme.line }]}
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
          theme={theme}
        >
          {chartPoints.length === 0 ? (
            <View style={styles.empty}>
              <ThemedText style={styles.emptyGlyph}>◌</ThemedText>
              <ThemedText type="smallBold">{t('common.noNetSaving')}</ThemedText>
            </View>
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
                            `${formatMonthShort(point.period.startDate)} ${formatMoney(point.netSaving)}`,
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
                    {formatMonthShort(point.period.startDate)}
                  </ThemedText>
                ))}
              </View>
            </>
          )}
        </ChartCard>
      </ScrollView>
      <Modal
        transparent
        animationType="slide"
        visible={insightOpen}
        onRequestClose={() => setInsightOpen(false)}
      >
        <Pressable
          wrapperStyle={{ flex: 1 }}
          style={[styles.overlay, { backgroundColor: theme.overlay }]}
          onPress={() => setInsightOpen(false)}
        >
          <View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: theme.card }]}>
            {loading ? (
              <View accessibilityLiveRegion="polite" style={styles.loading}>
                <ThemedText style={[styles.loadingGlyph, { color: theme.pine }]}>✦</ThemedText>
                <ThemedText type="smallBold">{t('common.insightReading')}</ThemedText>
                <ThemedText type="small" themeColor="muted">
                  {t('common.holdOn')}
                </ThemedText>
              </View>
            ) : (
              <>
                <ThemedText type="sectionHeading">{t('common.insightThisMonth')}</ThemedText>
                {insightError ? (
                  <View accessibilityLiveRegion="polite" style={styles.insightError}>
                    <ThemedText style={{ color: theme.expense }}>{insightError}</ThemedText>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('common.retryInsight')}
                      onPress={() => {
                        setInsightError('');
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
                      {insightSource === 'fallback'
                        ? t('common.insightLocal')
                        : t('common.insightAi')}
                    </ThemedText>
                    <ThemedText style={styles.insightText}>{insightText}</ThemedText>
                  </>
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('common.understand')}
                  onPress={() => setInsightOpen(false)}
                  style={[styles.closeInsight, { backgroundColor: theme.pine }]}
                >
                  <ThemedText type="smallBold" style={{ color: theme.heroText }}>
                    {t('common.understand')}
                  </ThemedText>
                </Pressable>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

function formatMonth(date: string) {
  return new Intl.DateTimeFormat(getIntlLocale(i18n.language === 'en' ? 'en' : 'id'), {
    month: 'long',
  }).format(new Date(`${date}T12:00:00`));
}
function formatMonthShort(date: string) {
  return new Intl.DateTimeFormat(getIntlLocale(i18n.language === 'en' ? 'en' : 'id'), {
    month: 'short',
  }).format(new Date(`${date}T12:00:00`));
}
function percentage(amount: number, total: number) {
  return total > 0 ? Math.round((amount / total) * 100) : 0;
}
type LinePath = { d: string; length: number };

function getLinePath(points: ReportView['netSavingByPeriod']): LinePath {
  if (points.length === 0) return { d: 'M2 110 L318 110', length: 316 };
  const values = points.map((point) => point.netSaving);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const spread = Math.max(max - min, 1);
  const coordinates = values.map((value, index) => {
    const x = points.length === 1 ? 160 : 2 + index * (316 / (points.length - 1));
    const y = 110 - ((value - min) / spread) * 90;
    return { x, y: Math.max(20, Math.min(110, y)) };
  });
  const d = coordinates
    .map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ');
  const length = coordinates.reduce((total, point, index) => {
    if (index === 0) return total;
    const previous = coordinates[index - 1];
    return total + Math.hypot(point.x - previous.x, point.y - previous.y);
  }, 0);
  return { d, length: Math.max(length, 1) };
}

function useChartReveal(animationKey: string) {
  const reveal = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    cancelAnimation(reveal);
    reveal.value = reduceMotion ? 1 : 0;
    if (!reduceMotion) {
      reveal.value = withTiming(1, { duration: Motion.chartDuration });
    }
    return () => cancelAnimation(reveal);
  }, [animationKey, reduceMotion, reveal]);

  return reveal;
}

function NetSavingLineChart({
  points,
  color,
}: {
  points: ReportView['netSavingByPeriod'];
  color: string;
}) {
  const path = getLinePath(points);
  const reveal = useChartReveal(
    points.map((point) => `${point.period.id}:${point.netSaving}`).join('|'),
  );
  const animatedClipProps = useAnimatedProps(() => ({
    width: 320 * reveal.value,
  }));

  return (
    <>
      <Defs>
        <ClipPathCompat id="net-saving-reveal">
          <AnimatedRect x="0" y="0" height="120" animatedProps={animatedClipProps} />
        </ClipPathCompat>
      </Defs>
      <G clipPath="url(#net-saving-reveal)">
        <Path d={path.d} fill="none" stroke={color} strokeWidth="3" />
        <Path d={`${path.d} L318 120 L2 120Z`} fill={color} opacity="0.1" />
      </G>
    </>
  );
}

export default function ReportScreen(props: ComponentProps<typeof ReportScreenContent>) {
  return (
    <MotionScreen>
      <SafeAreaView style={styles.safeArea}>
        <ReportScreenContent {...props} />
      </SafeAreaView>
    </MotionScreen>
  );
}
function chartColors(theme: ReturnType<typeof useTheme>) {
  return [theme.expense, theme.gold, theme.pine, theme.muted];
}
/* eslint-disable react-hooks/immutability -- SVG segment offsets are derived during render. */
function Donut({
  expenses,
  total,
  theme,
}: {
  expenses: ReportExpense[];
  total: number;
  theme: ReturnType<typeof useTheme>;
}) {
  const colors = chartColors(theme);
  const radius = 57;
  const circumference = 2 * Math.PI * radius;
  const reveal = useChartReveal(
    `${total}:${expenses.map((item) => `${item.categoryId}:${item.amount}`).join('|')}`,
  );
  let offset = 0;
  return (
    <Svg
      accessible
      accessibilityLabel={i18n.t('common.totalExpense', {
        total: formatMoney(total),
        breakdown: expenses
          .map((item) => `${getCategoryLabel(item)} ${formatMoney(item.amount)}`)
          .join(', '),
      })}
      width={145}
      height={145}
      viewBox="0 0 145 145"
      style={styles.donut}
    >
      <Circle cx="72.5" cy="72.5" r={radius} fill="none" stroke={theme.line} strokeWidth="28" />
      {expenses.map((item, index) => {
        const length = total > 0 ? (item.amount / total) * circumference : 0;
        const segment = (
          <DonutSegment
            key={item.categoryId}
            color={colors[index % colors.length]}
            circumference={circumference}
            length={length}
            offset={offset}
            radius={radius}
            reveal={reveal}
          />
        );
        offset += length;
        return segment;
      })}
    </Svg>
  );
}
/* eslint-enable react-hooks/immutability */

function DonutSegment({
  color,
  circumference,
  length,
  offset,
  radius,
  reveal,
}: {
  color: string;
  circumference: number;
  length: number;
  offset: number;
  radius: number;
  reveal: SharedValue<number>;
}) {
  const animatedProps = useAnimatedProps(() => ({
    strokeDasharray: [length * reveal.value, circumference - length * reveal.value],
    strokeDashoffset: -offset * reveal.value,
  }));

  return (
    <AnimatedCircle
      cx="72.5"
      cy="72.5"
      r={radius}
      fill="none"
      stroke={color}
      strokeWidth="28"
      transform="rotate(-90 72.5 72.5)"
      animatedProps={animatedProps}
    />
  );
}
function ChartCard({
  title,
  trailing,
  trailingAction,
  trailingAccessibilityLabel,
  trailingExpanded = false,
  trailingPopover,
  children,
  theme,
}: {
  title: string;
  trailing?: ReactNode;
  trailingAction?: () => void;
  trailingAccessibilityLabel?: string;
  trailingExpanded?: boolean;
  trailingPopover?: ReactNode;
  children: ReactNode;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <ThemedView
      accessible
      accessibilityLabel={`${title}${trailing ? `, ${trailing}` : ''}`}
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.line }]}
    >
      <View style={styles.cardHeader}>
        <ThemedText type="sectionHeading">{title}</ThemedText>
        {trailing && trailingAction ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={trailingAccessibilityLabel}
            accessibilityState={{ expanded: trailingExpanded }}
            onTouchStart={(event) => event.stopPropagation()}
            onPress={trailingAction}
            hitSlop={8}
          >
            <View style={styles.cardTrailing}>
              <ThemedText type="small" themeColor="muted">
                {trailing}
              </ThemedText>
              <MotionChevron expanded={trailingExpanded} color={theme.muted} size={16} />
            </View>
          </Pressable>
        ) : trailing ? (
          <ThemedText type="small" themeColor="muted">
            {trailing}
          </ThemedText>
        ) : null}
        {trailingPopover}
      </View>
      {children}
    </ThemedView>
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
  aiButton: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  aiButtonText: { fontSize: 11, lineHeight: 14 },
  summary: { marginBottom: 24 },
  metric: { flex: 1, gap: 5, minHeight: 58 },
  card: { borderRadius: 22, borderWidth: 1, marginBottom: 16, padding: 18 },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 10,
  },
  cardTrailing: { alignItems: 'center', flexDirection: 'row', gap: 2 },
  pieArea: { alignItems: 'center', height: 183, justifyContent: 'center', marginTop: 8 },
  chartReveal: { overflow: 'hidden' },
  empty: { alignItems: 'center', gap: 7, paddingVertical: 38 },
  emptyGlyph: { fontSize: 38 },
  pieLabel: { alignItems: 'center', position: 'absolute' },
  pieAmount: { fontFamily: Fonts.mono, fontSize: 13, letterSpacing: -1 },
  donut: { height: 145, width: 145 },
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
  rangeRow: {
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'flex-end',
    marginTop: 10,
  },
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
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 27, borderTopRightRadius: 27, padding: 21 },
  sheetOption: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 15 },
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
  loading: { alignItems: 'center', paddingVertical: 45 },
  loadingGlyph: { fontSize: 29, marginBottom: 12 },
  insightText: { fontSize: 13, lineHeight: 21, marginTop: 17 },
  insightError: { gap: 12 },
  closeInsight: { alignItems: 'center', borderRadius: 13, padding: 13 },
});
