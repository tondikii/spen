import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Fonts, Radius, Shadows, Typography } from '@/constants/theme';
import { formatMoney } from '@/lib/money';
import { getDatabasePlanView, getPaymentLabel, getPlanView } from '@/services/plan-service';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import type { BudgetPlanItem, PaymentStatus } from '@/types/domain';

type PlanView = ReturnType<typeof getPlanView> | Awaited<ReturnType<typeof getDatabasePlanView>>;
type PlanItemState = { realizedAmount: number; progressPercent: number; paymentStatus?: PaymentStatus; overBudget: boolean };

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export default function PlanScreen({ planView = getPlanView(), onPeriodStartDayChange, onItemAction }: { planView?: PlanView; onPeriodStartDayChange?: (day: number) => void | Promise<void>; onItemAction?: (item: BudgetPlanItem, amount: number) => void | Promise<void> }) {
  const theme = useTheme();
  const { snapshot, plan, goals, wallets, period } = planView;
  const [startDay, setStartDay] = useState(Number(period.startDate.slice(-2)));
  const [periodOpen, setPeriodOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [applied, setApplied] = useState<string[]>([]);

  useEffect(() => {
    if (!aiOpen) return;
    const timer = setTimeout(() => setAiLoading(false), 120);
    return () => clearTimeout(timer);
  }, [aiOpen]);

  const periodLabel = formatPeriodLabel(period, startDay);
  const itemState = (item: BudgetPlanItem) => snapshot.planItems.find((state) => state.itemId === item.id);
  const handleItemAction = (item: BudgetPlanItem) => {
    const state = itemState(item);
    const amount = item.type === 'fixedExpense' ? Math.max(item.targetAmount - (state?.realizedAmount ?? 0), 0) : item.targetAmount;
    void onItemAction?.(item, amount);
  };

  return <ThemedView style={styles.page}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.header}><View><ThemedText type="code" themeColor="muted" style={styles.eyebrow}>BUDGET PLAN</ThemedText><ThemedText type="title" style={styles.title}>Rencana</ThemedText><Pressable accessibilityRole="button" accessibilityLabel="Ubah Budget period" onPress={() => setPeriodOpen(true)}><ThemedText type="small" themeColor="muted">{periodLabel}</ThemedText></Pressable></View><Pressable accessibilityRole="button" accessibilityLabel="AI Suggestion" onPress={() => { setAiLoading(true); setAiOpen(true); }} style={[styles.aiButton, { borderColor: theme.line, backgroundColor: theme.mint }]}><ThemedText type="smallBold" themeColor="pine">✦ AI Suggestion</ThemedText></Pressable></View>
    <ThemedView style={[styles.hero, { backgroundColor: theme.pine2 }]}><ThemedText type="code" style={{ color: theme.heroMuted }}>SALDO TERSEDIA</ThemedText><ThemedText style={[styles.heroAmount, { color: theme.heroText }]}>{formatMoney(snapshot.availableBalance)}</ThemedText><View style={[styles.heroStats, { borderTopColor: theme.heroDivider }]}><View><ThemedText type="small" style={{ color: theme.heroMuted }}>Tersedia bebas</ThemedText><ThemedText type="smallBold" style={{ color: theme.heroText }}>{formatMoney(snapshot.freeBalance)}</ThemedText></View><View><ThemedText type="small" style={{ color: theme.heroMuted }}>Terikat goal</ThemedText><ThemedText type="smallBold" style={{ color: theme.heroText }}>{formatMoney(snapshot.goalBalance)}</ThemedText></View></View></ThemedView>
    <View style={[styles.spare, { borderColor: theme.line, backgroundColor: theme.card }]}><View><ThemedText type="code" themeColor="muted">SPARE BUDGET</ThemedText><ThemedText type="subtitle">{formatMoney(snapshot.spareBudget)}</ThemedText><ThemedText type="small" themeColor="muted">Pendapatan − fixed expense − goal</ThemedText></View><ThemedText style={[styles.spareGlyph, { color: theme.pine }]}>◌</ThemedText></View>
    <PlanSection title="Pendapatan" action="+ Tambah" theme={theme}>{plan.incomeItems.map((item) => <PlanItem key={item.id} item={item} state={itemState(item)} action="Catat" color={theme.income} theme={theme} onAction={handleItemAction} />)}</PlanSection>
    <PlanSection title="Fixed expense" action="+ Tambah" theme={theme}>{plan.fixedExpenseItems.map((item) => <PlanItem key={item.id} item={item} state={itemState(item)} action={itemState(item)?.paymentStatus?.kind === 'Lunas' ? '' : 'Bayar'} color={theme.expense} theme={theme} onAction={handleItemAction} />)}</PlanSection>
    <PlanSection title="Goal" action="+ Tambah" theme={theme}>{goals.map((goal) => { const saved = wallets.find((wallet) => wallet.id === goal.walletId)?.balance ?? 0; const achieved = saved >= goal.targetAmount; return <View key={goal.id} style={[styles.goal, { borderBottomColor: theme.line }]}><View style={styles.itemHeader}><ThemedText type="smallBold">{goal.name}</ThemedText><ThemedText type="smallBold" style={{ color: achieved ? theme.income : theme.gold }}>{achieved ? 'Tercapai' : formatMoney(saved)}</ThemedText></View><Progress value={Math.min(saved / goal.targetAmount * 100, 100)} color={achieved ? theme.income : theme.gold} theme={theme} /><ThemedText type="small" themeColor="muted">Target {formatMoney(goal.targetAmount)} · {formatMoney(goal.monthlyContribution)}/bulan</ThemedText></View>; })}</PlanSection>
    <PlanSection title="Alokasi" action="+ Tambah" theme={theme}>{plan.allocationItems.map((item) => <PlanItem key={item.id} item={item} state={itemState(item)} action="" color={itemState(item)?.overBudget ? theme.expense : theme.pine} theme={theme} onAction={handleItemAction} />)}</PlanSection>
  </ScrollView>
  <Modal transparent animationType="slide" visible={periodOpen} onRequestClose={() => setPeriodOpen(false)}><Pressable style={[styles.overlay, { backgroundColor: theme.overlay }]} onPress={() => setPeriodOpen(false)}><View style={[styles.sheet, { backgroundColor: theme.card }]}><ThemedText type="sectionHeading">Budget period</ThemedText><ThemedText type="small" themeColor="muted">Pilih tanggal mulai</ThemedText>{[1, 5, 25].map((day) => <Pressable key={day} accessibilityRole="button" accessibilityLabel={`Mulai tanggal ${day}`} onPress={() => { setStartDay(day); setPeriodOpen(false); void onPeriodStartDayChange?.(day); }} style={[styles.sheetOption, { borderTopColor: theme.line }]}><ThemedText type="smallBold" themeColor={startDay === day ? 'pine' : 'ink'}>Tanggal {day}</ThemedText></Pressable>)}</View></Pressable></Modal>
  <Modal transparent animationType="slide" visible={aiOpen} onRequestClose={() => setAiOpen(false)}><Pressable style={[styles.overlay, { backgroundColor: theme.overlay }]} onPress={() => setAiOpen(false)}><View style={[styles.sheet, { backgroundColor: theme.card }]}><ThemedText type="sectionHeading">✦ Saran untuk Budget plan</ThemedText>{aiLoading ? <View style={styles.loading}><ThemedText style={[styles.loadingGlyph, { color: theme.pine }]}>✦</ThemedText><ThemedText type="smallBold">Membaca pola keuanganmu…</ThemedText><ThemedText type="small" themeColor="muted">Sebentar ya.</ThemedText></View> : ['Naikkan alokasi Makan menjadi Rp 1.500.000', 'Sisihkan Rp 300.000 untuk Dana Nikah'].map((suggestion) => <View key={suggestion} style={[styles.suggestion, { borderTopColor: theme.line }]}><ThemedText type="small" style={styles.suggestionText}>{suggestion}</ThemedText><Pressable accessibilityRole="button" accessibilityLabel={`Terapkan ${suggestion}`} onPress={() => setApplied((current) => current.includes(suggestion) ? current : [...current, suggestion])}><ThemedText type="smallBold" themeColor={applied.includes(suggestion) ? 'income' : 'pine'}>{applied.includes(suggestion) ? '✓ Diterapkan' : 'Terapkan'}</ThemedText></Pressable></View>)}<Pressable accessibilityRole="button" accessibilityLabel="Tutup saran" onPress={() => setAiOpen(false)} style={styles.closeSheet}><ThemedText type="smallBold" style={{ color: theme.heroText }}>Mengerti</ThemedText></Pressable></View></Pressable></Modal>
  </ThemedView>;
}

function formatPeriodLabel(period: { startDate: string; endDate: string }, startDay: number) {
  const start = new Date(`${period.startDate.slice(0, 7)}-${String(startDay).padStart(2, '0')}T12:00:00`);
  const end = new Date(`${period.endDate}T12:00:00`);
  return `${start.getDate()}–${end.getDate()} ${monthNames[end.getMonth()]}⌄`;
}

function PlanSection({ title, action, children, theme }: { title: string; action: string; children: ReactNode; theme: ReturnType<typeof useTheme> }) { return <View style={styles.section}><View style={styles.sectionTitle}><ThemedText type="sectionHeading">{title}</ThemedText><Pressable accessibilityRole="button" accessibilityLabel={`${action} ${title}`}><ThemedText type="smallBold" themeColor="pine">{action}</ThemedText></Pressable></View><ThemedView style={[styles.card, { borderColor: theme.line, backgroundColor: theme.card }]}>{children}</ThemedView></View>; }

function PlanItem({ item, state, action, color, theme, onAction }: { item: BudgetPlanItem; state?: PlanItemState; action: string; color: string; theme: ReturnType<typeof useTheme>; onAction: (item: BudgetPlanItem) => void }) {
  const progress = state?.progressPercent ?? 0;
  const amountLabel = state?.realizedAmount ?? 0;
  const paymentStatus = state?.paymentStatus;
  const paymentLabel = paymentStatus?.kind === 'Sebagian dibayar'
    ? getPaymentLabel(paymentStatus.kind, paymentStatus.paidAmount, paymentStatus.targetAmount)
    : paymentStatus ? getPaymentLabel(paymentStatus.kind) : null;
  return <View style={[styles.item, { borderBottomColor: theme.line }]}><View style={styles.itemHeader}><View><ThemedText type="smallBold">{item.name}</ThemedText><ThemedText type="small" themeColor="muted">{formatMoney(amountLabel)} dari {formatMoney(item.targetAmount)}</ThemedText></View>{action && <Pressable accessibilityRole="button" accessibilityLabel={`${action} ${item.name}`} onPress={() => onAction(item)} hitSlop={8}><ThemedText type="smallBold" style={{ color }}>{action} →</ThemedText></Pressable>}</View><Progress value={progress} color={state?.overBudget ? theme.expense : color} theme={theme} />{state?.overBudget ? <ThemedText type="smallBold" style={{ color: theme.expense }}>Melebihi Budget</ThemedText> : paymentLabel && <ThemedText type="small" style={{ color }}>{paymentLabel}</ThemedText>}</View>;
}

function Progress({ value, color, theme }: { value: number; color: string; theme: ReturnType<typeof useTheme> }) { return <View style={[styles.progress, { backgroundColor: theme.line }]}><View style={[styles.progressFill, { backgroundColor: color, width: `${Math.min(value, 100)}%` }]} /></View>; }

const styles = StyleSheet.create({ page: { flex: 1 }, content: { padding: 21, paddingBottom: 40, width: '100%' }, header: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }, eyebrow: { ...Typography.eyebrow }, title: { fontSize: 29, lineHeight: 32 }, aiButton: { borderRadius: Radius.pill, borderWidth: 1, marginTop: 14, paddingHorizontal: 12, paddingVertical: 10 }, hero: { borderRadius: Radius.hero, marginBottom: 17, padding: 21, ...Shadows.hero }, heroAmount: { fontFamily: Fonts.serifBold, fontSize: 30, lineHeight: 34, marginVertical: 12 }, heroStats: { borderTopWidth: 1, flexDirection: 'row', gap: 28, paddingTop: 13 }, spare: { alignItems: 'center', borderRadius: 22, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 17, padding: 18 }, spareGlyph: { fontSize: 42 }, section: { marginBottom: 18 }, sectionTitle: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }, card: { borderRadius: 19, borderWidth: 1, paddingHorizontal: 13 }, item: { paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth }, itemHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, progress: { borderRadius: 9, height: 5, marginVertical: 10, overflow: 'hidden' }, progressFill: { borderRadius: 9, height: '100%' }, goal: { paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth }, overlay: { flex: 1, justifyContent: 'flex-end' }, sheet: { borderTopLeftRadius: 27, borderTopRightRadius: 27, gap: 8, padding: 21 }, sheetOption: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 15 }, loading: { alignItems: 'center', paddingVertical: 35 }, loadingGlyph: { fontSize: 28, marginBottom: 12 }, suggestion: { alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 10, paddingVertical: 15 }, suggestionText: { flex: 1 }, closeSheet: { alignItems: 'center', backgroundColor: '#235B50', borderRadius: 13, marginTop: 8, padding: 13 } });
