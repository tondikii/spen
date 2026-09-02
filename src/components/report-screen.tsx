import { router } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Fonts, Radius, Shadows, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { formatMoney } from "@/lib/money";
import { aiService, type BudgetAIInput } from "@/services/ai-service";
import {
  getDatabaseReportView,
  getReportNetSavingLabel,
  getReportView,
  type ReportExpense,
} from "@/services/report-service";

type ReportView =
  | ReturnType<typeof getReportView>
  | Awaited<ReturnType<typeof getDatabaseReportView>>;

export default function ReportScreen({
  reportView = getReportView(),
  onRangeChange,
  onCategoryPress,
  aiInput,
}: {
  reportView?: ReportView;
  onRangeChange?: (months: number) => void | Promise<void>;
  onCategoryPress?: (
    expense: ReportExpense,
    period: ReportView["period"],
  ) => void;
  aiInput?: BudgetAIInput;
}) {
  const theme = useTheme();
  const { snapshot, expenses, period, netSavingByPeriod } = reportView;
  const [range, setRange] = useState(3);
  const [insightOpen, setInsightOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [insightText, setInsightText] = useState("");
  const [insightSource, setInsightSource] = useState<"ai" | "fallback">(
    "fallback",
  );
  const [insightError, setInsightError] = useState("");
  const [rangeOpen, setRangeOpen] = useState(false);
  useEffect(() => {
    if (!insightOpen) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      void aiService
        .generateInsight(
          aiInput ?? {
            spareBudget: reportView.snapshot.spareBudget,
            totalIncome: reportView.snapshot.totalIncome,
            fixedExpense: 0,
            goalContributions: 0,
            netSaving: reportView.snapshot.netSaving,
            topExpenses: reportView.expenses.map((expense) => ({
              name: expense.name,
              amount: expense.amount,
            })),
          },
        )
        .then((result) => {
          if (cancelled) return;
          setInsightText(result.text);
          setInsightSource(result.source);
          setLoading(false);
        })
        .catch(() => {
          if (!cancelled) {
            setInsightError("Insight belum tersedia. Coba lagi nanti.");
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
          pathname: "/history",
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
            <ThemedText type="title">Report</ThemedText>
            <Pressable accessibilityRole="button" accessibilityLabel="Ubah Budget period"><ThemedText type="small" themeColor="muted">{formatPeriodAccurate(period)}⌄</ThemedText></Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="AI Insight"
            onPress={() => { setLoading(true); setInsightOpen(true); }}
            style={[styles.aiButton, { borderColor: theme.line, backgroundColor: theme.mint }]}
          >
            <ThemedText type="smallBold" themeColor="pine" style={{ display: "none" }}>
              âœ¦ Tanya insight
            </ThemedText>
            <ThemedText type="code" themeColor="muted" style={{ display: "none" }}>{formatPeriodAccurate(period)}⌄</ThemedText>
            <ThemedText type="smallBold" themeColor="pine">AI Insight</ThemedText>
          </Pressable>
        </View>
        <ThemedView style={[styles.summary, { backgroundColor: theme.pine2 }]}>
          <ThemedText type="code" style={{ color: theme.heroMuted }}>{getReportNetSavingLabel(snapshot.netSaving).toUpperCase()}</ThemedText>
          <ThemedText style={[styles.heroAmount, { color: snapshot.netSaving < 0 ? theme.expense : theme.heroText }]}>{formatMoney(snapshot.netSaving)}</ThemedText>
          <View style={[styles.heroStats, { borderTopColor: theme.heroDivider }]}>
            <View><ThemedText type="small" style={{ color: theme.heroMuted }}>Pendapatan</ThemedText><ThemedText type="smallBold" style={{ color: theme.heroText }}>{formatMoney(snapshot.totalIncome)}</ThemedText></View>
            <View><ThemedText type="small" style={{ color: theme.heroMuted }}>Pengeluaran</ThemedText><ThemedText type="smallBold" style={{ color: theme.heroText }}>{formatMoney(snapshot.totalExpense)}</ThemedText></View>
          </View>
        </ThemedView>
        <ChartCard title="Pengeluaran" trailing={formatMonth(period.endDate)} theme={theme}>
          {expenses.length === 0 ? <View style={styles.empty}><ThemedText style={styles.emptyGlyph}>◌</ThemedText><ThemedText type="smallBold">Belum ada pengeluaran</ThemedText><ThemedText type="small" themeColor="muted">Belum ada catatan expense di Budget period ini.</ThemedText></View> : <View style={styles.pieArea}>
            <Donut expenses={expenses} total={snapshot.totalExpense} theme={theme} />
            <View style={styles.pieLabel}><ThemedText type="smallBold" style={styles.pieAmount}>{formatMoney(snapshot.totalExpense)}</ThemedText><ThemedText type="small" themeColor="muted">total keluar</ThemedText></View>
          </View>}
          <View style={styles.legend}>{expenses.map((item, index) => <Pressable key={item.categoryId} accessibilityRole="button" accessibilityLabel={`Lihat kategori ${item.name}`} onPress={() => openCategory(item)} style={[styles.legendRow, { borderTopColor: theme.line }]}><View style={[styles.dot, { backgroundColor: chartColors(theme)[index % chartColors(theme).length] }]} /><ThemedText type="small" style={styles.legendName}>{item.name}</ThemedText><ThemedText type="smallBold" themeColor="muted">{percentage(item.amount, snapshot.totalExpense)}%</ThemedText></Pressable>)}</View>
        </ChartCard>
        <Pressable accessibilityRole="button" accessibilityLabel="Pilih rentang Report" onPress={() => setRangeOpen(true)} style={styles.rangeButton}><ThemedText type="smallBold" themeColor="pine">Rentang: {range} bulan</ThemedText></Pressable>
        <ChartCard title="Net saving" trailing={`${range} bulan⌄`} theme={theme}>
          <View style={[styles.chart, { borderBottomColor: theme.line }]}><Svg width="100%" height="120" viewBox="0 0 320 120" preserveAspectRatio="none"><Path d={linePath(chartPoints)} fill="none" stroke={theme.pine} strokeWidth="3" /><Path d={`${linePath(chartPoints)} L318 120 L2 120Z`} fill={theme.pine} opacity="0.1" /></Svg></View>
          <View style={styles.months}>
            {chartPoints.map((point) => (
              <ThemedText key={point.period.id} type="small" themeColor="muted">
                {formatMonthShort(point.period.startDate)}
              </ThemedText>
            ))}
          </View>
        </ChartCard>
      </ScrollView>
      <Pressable accessibilityRole="button" accessibilityLabel="Tanya insight" onPress={() => { setLoading(true); setInsightOpen(true); }} style={[styles.insightCta, { backgroundColor: theme.pine }]}><ThemedText style={styles.insightGlyph}>✦</ThemedText><View style={styles.insightCopy}><ThemedText type="smallBold" style={{ color: theme.heroText }}>Tanya insight untuk bulan ini</ThemedText><ThemedText type="small" style={{ color: theme.heroMuted }}>Ringkas, jelas, dan bisa ditindaklanjuti.</ThemedText></View><ThemedText style={{ color: theme.heroText, fontSize: 18 }}>→</ThemedText></Pressable>
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
          <View style={[styles.sheet, { backgroundColor: theme.card }]}>
            {loading ? (
              <View style={styles.loading}>
                <ThemedText
                  style={[styles.loadingGlyph, { color: theme.pine }]}
                >
                  âœ¦
                </ThemedText>
                <ThemedText type="smallBold">
                  Menghubungkan titik-titik…
                </ThemedText>
                <ThemedText type="small" themeColor="muted">
                  Membaca pola keuanganmu.
                </ThemedText>
              </View>
            ) : (
              <>
                <ThemedText type="sectionHeading">Insight bulan ini</ThemedText>
                {insightError ? <ThemedText style={{ color: theme.expense }}>{insightError}</ThemedText> : <ThemedText style={styles.insightText}>{insightText}</ThemedText>}
                <View
                  style={[styles.takeaway, { backgroundColor: theme.mint }]}
                >
                  <ThemedText type="smallBold" themeColor="pine">
                    Langkah kecil
                  </ThemedText>
                  <ThemedText type="small" themeColor="pine">
                    Gunakan insight ini sebagai bahan pertimbangan.
                  </ThemedText>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Mengerti"
                  onPress={() => setInsightOpen(false)}
                  style={[styles.closeInsight, { backgroundColor: theme.pine }]}
                >
                  <ThemedText
                    type="smallBold"
                    style={{ color: theme.heroText }}
                  >
                    Mengerti
                  </ThemedText>
                </Pressable>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
      <Modal transparent animationType="slide" visible={rangeOpen} onRequestClose={() => setRangeOpen(false)}><Pressable style={[styles.overlay, { backgroundColor: theme.overlay }]} onPress={() => setRangeOpen(false)}><View style={[styles.sheet, { backgroundColor: theme.card }]}><ThemedText type="sectionHeading">Rentang Report</ThemedText>{[3, 6, 12].map((months) => <Pressable key={months} accessibilityRole="button" accessibilityLabel={`Report ${months} bulan`} onPress={() => updateRange(months)} style={[styles.sheetOption, { borderTopColor: theme.line }]}><ThemedText type="smallBold" themeColor={range === months ? 'pine' : 'ink'}>{months} bulan</ThemedText></Pressable>)}</View></Pressable></Modal>
    </ThemedView>
  );
}

function formatPeriodAccurate(period: { startDate: string; endDate: string }) {
  const month = new Intl.DateTimeFormat("id-ID", { month: "short" }).format(new Date(`${period.endDate}T12:00:00`));
  return `${Number(period.startDate.slice(-2))}–${Number(period.endDate.slice(-2))} ${month}`;
}
function formatMonth(date: string) { return new Intl.DateTimeFormat("id-ID", { month: "long" }).format(new Date(`${date}T12:00:00`)); }
function formatMonthShort(date: string) { return new Intl.DateTimeFormat("id-ID", { month: "short" }).format(new Date(`${date}T12:00:00`)); }
function percentage(amount: number, total: number) { return total > 0 ? Math.round((amount / total) * 100) : 0; }
function linePath(points: ReportView["netSavingByPeriod"]) {
  if (points.length === 0) return "M2 110 L318 110";
  const values = points.map((point) => point.netSaving);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const spread = Math.max(max - min, 1);
  return values.map((value, index) => {
    const x = points.length === 1 ? 160 : 2 + index * (316 / (points.length - 1));
    const y = 110 - ((value - min) / spread) * 90;
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${Math.max(20, Math.min(110, y)).toFixed(1)}`;
  }).join(" ");
}
function chartColors(theme: ReturnType<typeof useTheme>) { return [theme.expense, theme.gold, theme.pine, theme.muted]; }
/* eslint-disable react-hooks/immutability -- SVG segment offsets are derived during render. */
function Donut({ expenses, total, theme }: { expenses: ReportExpense[]; total: number; theme: ReturnType<typeof useTheme> }) {
  const colors = chartColors(theme); const radius = 57; const circumference = 2 * Math.PI * radius; let offset = 0;
  return <Svg width={145} height={145} viewBox="0 0 145 145" style={styles.donut}><Circle cx="72.5" cy="72.5" r={radius} fill="none" stroke={theme.line} strokeWidth="28" />{expenses.map((item, index) => { const length = total > 0 ? (item.amount / total) * circumference : 0; const segment = <Circle key={item.categoryId} cx="72.5" cy="72.5" r={radius} fill="none" stroke={colors[index % colors.length]} strokeWidth="28" strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-offset} transform="rotate(-90 72.5 72.5)" />; offset += length; return segment; })}</Svg>;
}
/* eslint-enable react-hooks/immutability */
function formatPeriod(period: { startDate: string; endDate: string }) {
  return `${Number(period.startDate.slice(-2))}â€“${Number(period.endDate.slice(-2))} ${new Date(`${period.endDate}T12:00:00`).toLocaleDateString("id-ID", { month: "short" })}ÃƒÂ¢Ã…â€™Ã¢â‚¬Å¾`;
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
      <ThemedText type="smallBold" style={{ color, fontFamily: Fonts.serifBold, fontSize: 24, lineHeight: 28, letterSpacing: -1 }}>
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
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.line },
      ]}
    >
      <View style={styles.cardHeader}><ThemedText type="sectionHeading">{title}</ThemedText>{trailing && <ThemedText type="small" themeColor="muted">{trailing}</ThemedText>}</View>
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { padding: 21, paddingBottom: 40 },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  eyebrow: { ...Typography.eyebrow },
  aiButton: { borderRadius: Radius.pill, borderWidth: 1, marginTop: 14, paddingHorizontal: 12, paddingVertical: 10 },
  summary: { borderRadius: Radius.hero, marginBottom: 24, padding: 21, ...Shadows.hero },
  heroAmount: { fontFamily: Fonts.serifBold, fontSize: 30, lineHeight: 34, marginVertical: 12 },
  heroStats: { borderTopWidth: 1, flexDirection: "row", gap: 28, paddingTop: 13 },
  metric: { flex: 1, gap: 5, minHeight: 58 },
  card: { borderRadius: 22, borderWidth: 1, marginBottom: 14, padding: 17 },
  cardHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  pieArea: { alignItems: "center", height: 183, justifyContent: "center", marginTop: 8 },
  empty: { alignItems: "center", gap: 7, paddingVertical: 38 },
  emptyGlyph: { color: "#7B8882", fontSize: 38 },
  pieLabel: { alignItems: "center", position: "absolute" },
  pieAmount: { fontFamily: Fonts.mono, fontSize: 13, letterSpacing: -1 },
  donut: { height: 145, width: 145 },
  legend: { flex: 1 },
  legendRow: {
    alignItems: "center",
    flexDirection: "row",
    borderTopColor: "#E3E4DD",
    borderTopWidth: 1,
    gap: 7,
    paddingVertical: 7,
  },
  dot: { borderRadius: 4, height: 8, width: 8 },
  legendName: { flex: 1, fontSize: 11 },
  rangeRow: {
    flexDirection: "row",
    gap: 14,
    justifyContent: "flex-end",
    marginTop: 10,
  },
  rangeButton: { alignSelf: "flex-end", marginBottom: 10 },
  chart: { alignItems: "flex-end", borderBottomWidth: 1, height: 130, justifyContent: "flex-end", marginTop: 8 },
  months: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 7,
  },
  insightCta: { alignItems: "center", borderRadius: 19, display: "none", flexDirection: "row", gap: 10, marginHorizontal: 21, marginBottom: 14, padding: 16 },
  insightGlyph: { color: "#D5EADE", fontSize: 21 },
  insightCopy: { flex: 1 },
  overlay: { flex: 1, justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 27, borderTopRightRadius: 27, padding: 21 },
  sheetOption: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 15 },
  loading: { alignItems: "center", paddingVertical: 45 },
  loadingGlyph: { fontSize: 29, marginBottom: 12 },
  insightText: { fontSize: 13, lineHeight: 21, marginTop: 17 },
  takeaway: { borderRadius: 14, gap: 5, marginVertical: 17, padding: 13 },
  closeInsight: { alignItems: "center", borderRadius: 13, padding: 13 },
});
