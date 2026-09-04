import { router } from 'expo-router';
import { useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FinanceHeroCard } from '@/components/finance-hero-card';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabInset, Fonts, Radius, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatMoney } from '@/lib/money';
import { aiService, type BudgetAIInput } from '@/services/ai-service';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import {
  getDatabaseReportView,
  getReportNetSavingLabel,
  getReportView,
  type ReportExpense,
} from '@/services/report-service';

type ReportView =
  ReturnType<typeof getReportView> | Awaited<ReturnType<typeof getDatabaseReportView>>;

function ReportScreenContent({
  reportView = getReportView(),
  onRangeChange,
  onCategoryPress,
  aiInput,
}: {
  reportView?: ReportView;
  onRangeChange?: (months: number) => void | Promise<void>;
  onCategoryPress?: (expense: ReportExpense, period: ReportView['period']) => void;
  aiInput?: BudgetAIInput;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const tr = (key: string, fallback: string) => t(key) === key ? fallback : t(key);
  const locale = i18n.language === 'en' ? 'en' : 'id';
  const { snapshot, expenses, period, netSavingByPeriod } = reportView;
  const [range, setRange] = useState(3);
  const [insightOpen, setInsightOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [insightText, setInsightText] = useState('');
  const [insightSource, setInsightSource] = useState<'ai' | 'fallback'>('fallback');
  const [insightError, setInsightError] = useState('');
  const [rangeOpen, setRangeOpen] = useState(false);
  useEffect(() => {
    if (!insightOpen) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      void aiService
        .generateInsight(
          { ...(aiInput ?? {
            spareBudget: reportView.snapshot.spareBudget,
            totalIncome: reportView.snapshot.totalIncome,
            fixedExpense: 0,
            goalContributions: 0,
            netSaving: reportView.snapshot.netSaving,
            topExpenses: reportView.expenses.map((expense) => ({
              name: expense.name,
              amount: expense.amount,
            })),
          }), locale },
        )
        .then((result) => {
          if (cancelled) return;
          setInsightText(result.text);
          setInsightSource(result.source);
          setLoading(false);
        })
        .catch(() => {
          if (!cancelled) {
            setInsightError('Insight belum tersedia. Coba lagi nanti.');
            setLoading(false);
          }
        });
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [aiInput, insightOpen]);

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
    <ThemedView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <ThemedText type="code" themeColor="muted" style={styles.eyebrow}>
              BUDGET PERIOD
            </ThemedText>
            <ThemedText type="title">{tr('common.report', 'Laporan')}</ThemedText>
            <Pressable accessibilityRole="button" accessibilityLabel="Ubah Budget period">
              <ThemedText type="small" themeColor="muted">
                {formatPeriodAccurate(period)}⌄
              </ThemedText>
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tanya AI"
            onPress={() => {
              setLoading(true);
              setInsightOpen(true);
            }}
            style={[styles.aiButton, { borderColor: theme.line, backgroundColor: theme.mint }]}
          >
            <ThemedText type="smallBold" themeColor="pine" style={styles.aiButtonText}>
              ✦ Tanya AI
            </ThemedText>
          </Pressable>
        </View>
        <FinanceHeroCard
          label={getReportNetSavingLabel(snapshot.netSaving).toUpperCase()}
          amount={snapshot.netSaving}
          amountColor={snapshot.netSaving < 0 ? theme.expense : undefined}
          footer={[
            { label: 'Pendapatan', value: formatMoney(snapshot.totalIncome) },
            { label: 'Pengeluaran', value: formatMoney(snapshot.totalExpense) },
          ]}
          style={styles.summary}
        />
        <ChartCard title="Pengeluaran" trailing={formatMonth(period.endDate)} theme={theme}>
          {expenses.length === 0 ? (
            <View style={styles.empty}>
              <ThemedText style={styles.emptyGlyph}>◌</ThemedText>
              <ThemedText type="smallBold">{tr('common.noExpenses', 'Belum ada pengeluaran')}</ThemedText>
            </View>
          ) : (
            <View style={styles.pieArea}>
              <Donut expenses={expenses} total={snapshot.totalExpense} theme={theme} />
              <View style={styles.pieLabel}>
                <ThemedText type="smallBold" style={styles.pieAmount}>
                  {formatMoney(snapshot.totalExpense)}
                </ThemedText>
                <ThemedText type="small" themeColor="muted">
                  total keluar
                </ThemedText>
              </View>
            </View>
          )}
          <View style={styles.legend}>
            {expenses.map((item, index) => (
              <Pressable
                key={item.categoryId}
                accessibilityRole="button"
                accessibilityLabel={`Lihat kategori ${item.name}`}
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
                  {item.name}
                </ThemedText>
                <ThemedText type="smallBold" themeColor="muted">
                  {percentage(item.amount, snapshot.totalExpense)}%
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </ChartCard>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pilih rentang Laporan"
          onPress={() => setRangeOpen(true)}
          style={[styles.rangeButton, { borderColor: theme.line }]}
        >
          <ThemedText type="smallBold" themeColor="pine">
            Rentang: {range} bulan⌄
          </ThemedText>
        </Pressable>
        <ChartCard title="Net saving" trailing={`${range} bulan⌄`} theme={theme}>
          {chartPoints.length === 0 ? (
            <View style={styles.empty}>
              <ThemedText style={styles.emptyGlyph}>◌</ThemedText>
              <ThemedText type="smallBold">{tr('common.noNetSaving', 'Belum ada data net saving')}</ThemedText>
            </View>
          ) : (
            <>
              <View style={[styles.chart, { borderBottomColor: theme.line }]}>
                <Svg
                  accessible
                  accessibilityLabel={`Tren Net saving: ${chartPoints
                    .map(
                      (point) =>
                        `${formatMonthShort(point.period.startDate)} ${formatMoney(point.netSaving)}`,
                    )
                    .join(', ')}`}
                  width="100%"
                  height="120"
                  viewBox="0 0 320 120"
                  preserveAspectRatio="none"
                >
                  <Path d={linePath(chartPoints)} fill="none" stroke={theme.pine} strokeWidth="3" />
                  <Path
                    d={`${linePath(chartPoints)} L318 120 L2 120Z`}
                    fill={theme.pine}
                    opacity="0.1"
                  />
                </Svg>
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
          style={[styles.overlay, { backgroundColor: theme.overlay }]}
          onPress={() => setInsightOpen(false)}
        >
          <View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: theme.card }]}>
            {loading ? (
              <View accessibilityLiveRegion="polite" style={styles.loading}>
                <ThemedText style={[styles.loadingGlyph, { color: theme.pine }]}>✦</ThemedText>
                <ThemedText type="smallBold">Membaca pola keuanganmu…</ThemedText>
                <ThemedText type="small" themeColor="muted">
                  Sebentar ya.
                </ThemedText>
              </View>
            ) : (
              <>
                <ThemedText type="sectionHeading">Insight bulan ini</ThemedText>
                {insightError ? (
                  <View accessibilityLiveRegion="polite" style={styles.insightError}>
                    <ThemedText style={{ color: theme.expense }}>{insightError}</ThemedText>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Coba lagi"
                      onPress={() => {
                        setInsightError('');
                        setInsightOpen(false);
                        setTimeout(() => setInsightOpen(true), 0);
                      }}
                    >
                      <ThemedText type="smallBold" themeColor="pine">
                        Coba lagi
                      </ThemedText>
                    </Pressable>
                  </View>
                ) : (
                  <>
                    <ThemedText type="small" themeColor="muted">
                      {insightSource === 'fallback' ? 'Insight lokal' : 'Insight AI'}
                    </ThemedText>
                    <ThemedText style={styles.insightText}>{insightText}</ThemedText>
                  </>
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Mengerti"
                  onPress={() => setInsightOpen(false)}
                  style={[styles.closeInsight, { backgroundColor: theme.pine }]}
                >
                  <ThemedText type="smallBold" style={{ color: theme.heroText }}>
                    Mengerti
                  </ThemedText>
                </Pressable>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
      <Modal
        transparent
        animationType="slide"
        visible={rangeOpen}
        onRequestClose={() => setRangeOpen(false)}
      >
        <Pressable
          style={[styles.overlay, { backgroundColor: theme.overlay }]}
          onPress={() => setRangeOpen(false)}
        >
          <View style={[styles.sheet, { backgroundColor: theme.card }]}>
            <ThemedText type="sectionHeading">Rentang Laporan</ThemedText>
            {[3, 6, 12].map((months) => (
              <Pressable
                key={months}
                accessibilityRole="button"
                accessibilityLabel={`Laporan ${months} bulan`}
                onPress={() => updateRange(months)}
                style={[styles.sheetOption, { borderTopColor: theme.line }]}
              >
                <ThemedText type="smallBold" themeColor={range === months ? 'pine' : 'ink'}>
                  {months} bulan
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

function formatPeriodAccurate(period: { startDate: string; endDate: string }) {
  const month = new Intl.DateTimeFormat(i18n.language === 'en' ? 'en-US' : 'id-ID', { month: 'short' }).format(
    new Date(`${period.endDate}T12:00:00`),
  );
  return `${Number(period.startDate.slice(-2))}–${Number(period.endDate.slice(-2))} ${month}`;
}
function formatMonth(date: string) {
  return new Intl.DateTimeFormat(i18n.language === 'en' ? 'en-US' : 'id-ID', { month: 'long' }).format(new Date(`${date}T12:00:00`));
}
function formatMonthShort(date: string) {
  return new Intl.DateTimeFormat(i18n.language === 'en' ? 'en-US' : 'id-ID', { month: 'short' }).format(new Date(`${date}T12:00:00`));
}
function percentage(amount: number, total: number) {
  return total > 0 ? Math.round((amount / total) * 100) : 0;
}
function linePath(points: ReportView['netSavingByPeriod']) {
  if (points.length === 0) return 'M2 110 L318 110';
  const values = points.map((point) => point.netSaving);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const spread = Math.max(max - min, 1);
  return values
    .map((value, index) => {
      const x = points.length === 1 ? 160 : 2 + index * (316 / (points.length - 1));
      const y = 110 - ((value - min) / spread) * 90;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${Math.max(20, Math.min(110, y)).toFixed(1)}`;
    })
    .join(' ');
}

export default function ReportScreen(props: ComponentProps<typeof ReportScreenContent>) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ReportScreenContent {...props} />
    </SafeAreaView>
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
  let offset = 0;
  return (
    <Svg
      accessible
      accessibilityLabel={`Pengeluaran total ${formatMoney(total)}; ${expenses
        .map((item) => `${item.name} ${formatMoney(item.amount)}`)
        .join(', ')}`}
      width={145}
      height={145}
      viewBox="0 0 145 145"
      style={styles.donut}
    >
      <Circle cx="72.5" cy="72.5" r={radius} fill="none" stroke={theme.line} strokeWidth="28" />
      {expenses.map((item, index) => {
        const length = total > 0 ? (item.amount / total) * circumference : 0;
        const segment = (
          <Circle
            key={item.categoryId}
            cx="72.5"
            cy="72.5"
            r={radius}
            fill="none"
            stroke={colors[index % colors.length]}
            strokeWidth="28"
            strokeDasharray={`${length} ${circumference - length}`}
            strokeDashoffset={-offset}
            transform="rotate(-90 72.5 72.5)"
          />
        );
        offset += length;
        return segment;
      })}
    </Svg>
  );
}
/* eslint-enable react-hooks/immutability */
function formatPeriod(period: { startDate: string; endDate: string }) {
  return `${Number(period.startDate.slice(-2))}â€“${Number(period.endDate.slice(-2))} ${new Date(`${period.endDate}T12:00:00`).toLocaleDateString('id-ID', { month: 'short' })}ÃƒÂ¢Ã…â€™Ã¢â‚¬Å¾`;
}
function Metric({
  label,
  value,
  color,
  theme,
}: {
  label: string;
  value: number;
  color: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <ThemedView style={[styles.metric, { backgroundColor: theme.pine2 }]}>
      <ThemedText type="code" style={{ color: theme.heroMuted }}>
        {label}
      </ThemedText>
      <ThemedText
        type="smallBold"
        style={{
          color,
          fontFamily: Fonts.serifBold,
          fontSize: 24,
          lineHeight: 28,
          letterSpacing: -1,
        }}
      >
        {formatMoney(value)}
      </ThemedText>
    </ThemedView>
  );
}
function ChartCard({
  title,
  trailing,
  children,
  theme,
}: {
  title: string;
  trailing?: ReactNode;
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
        {trailing && (
          <ThemedText type="small" themeColor="muted">
            {trailing}
          </ThemedText>
        )}
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
  cardHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  pieArea: { alignItems: 'center', height: 183, justifyContent: 'center', marginTop: 8 },
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
  rangeButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
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
  loading: { alignItems: 'center', paddingVertical: 45 },
  loadingGlyph: { fontSize: 29, marginBottom: 12 },
  insightText: { fontSize: 13, lineHeight: 21, marginTop: 17 },
  insightError: { gap: 12 },
  closeInsight: { alignItems: 'center', borderRadius: 13, padding: 13 },
});
