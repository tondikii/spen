import { useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Fonts, Radius, Typography } from '@/constants/theme';
import { formatMoney } from '@/lib/money';
import { getDatabasePlanView, getPaymentLabel, getPlanView, type PlanItemDraft } from '@/services/plan-service';
import { aiService, type BudgetAIInput, type BudgetSuggestion } from '@/services/ai-service';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FinanceHeroCard } from '@/components/finance-hero-card';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import type { BudgetPlanItem, Category, Goal, PaymentStatus, PlanItemType, Wallet } from '@/types/domain';

type PlanView = ReturnType<typeof getPlanView> | Awaited<ReturnType<typeof getDatabasePlanView>>;
type PlanItemState = { realizedAmount: number; progressPercent: number; paymentStatus?: PaymentStatus; overBudget: boolean };
type GoalDraft = Omit<Goal, 'id' | 'archived'>;

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function PlanScreenContent({ planView = getPlanView(), categories = [], onPeriodStartDayChange, onItemAction, onPlanItemSave, onGoalSave, onGoalArchive, onGoalSaveAction, onGoalWithdraw, aiInput, onSuggestionApply }: { planView?: PlanView; categories?: Category[]; onPeriodStartDayChange?: (day: number) => void | Promise<void>; onItemAction?: (item: BudgetPlanItem, amount: number) => void | Promise<void>; onPlanItemSave?: (item: BudgetPlanItem | null, draft: PlanItemDraft) => void | Promise<void>; onGoalSave?: (goal: Goal | null, draft: GoalDraft) => void | Promise<void>; onGoalArchive?: (goal: Goal) => void | Promise<void>; onGoalSaveAction?: (goal: Goal) => void | Promise<void>; onGoalWithdraw?: (goal: Goal, amount: number) => void | Promise<void>; aiInput?: BudgetAIInput; onSuggestionApply?: (suggestion: BudgetSuggestion) => void | Promise<void> }) {
  const theme = useTheme();
  const { snapshot, plan, goals, wallets, period } = planView;
  const [startDay, setStartDay] = useState(Number(period.startDate.slice(-2)));
  const [periodOpen, setPeriodOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [applied, setApplied] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<BudgetSuggestion[]>([]);
  const [aiSource, setAiSource] = useState<'ai' | 'fallback'>('fallback');
  const [aiError, setAiError] = useState('');
  const [planItemEditor, setPlanItemEditor] = useState<{ type: PlanItemType; item?: BudgetPlanItem } | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect -- opening the sheet starts its loading state. */
  useEffect(() => {
    if (!aiOpen) return;
    let cancelled = false;
    setAiLoading(true);
    setAiError('');
    const timer = setTimeout(() => { setAiLoading(true); setAiError(''); void aiService.suggestBudget(aiInput ?? { spareBudget: snapshot.spareBudget, totalIncome: snapshot.totalIncome, fixedExpense: 0, goalContributions: snapshot.goalBalance, netSaving: snapshot.netSaving }).then((result) => {
      if (cancelled) return;
      setSuggestions(result.suggestions);
      setAiSource(result.source);
      setAiLoading(false);
    }).catch(() => { if (!cancelled) { setAiError('Saran AI tidak tersedia. Coba lagi nanti.'); setAiLoading(false); } }); }, 120);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [aiOpen, aiInput]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const periodLabel = formatPeriodLabel(period, startDay);
  const itemState = (item: BudgetPlanItem) => snapshot.planItems.find((state) => state.itemId === item.id);
  const handleItemAction = (item: BudgetPlanItem) => {
    const state = itemState(item);
    const amount = item.type === 'fixedExpense' ? Math.max(item.targetAmount - (state?.realizedAmount ?? 0), 0) : item.targetAmount;
    void onItemAction?.(item, amount);
  };

  const applySuggestion = async (suggestion: BudgetSuggestion) => {
    try {
      await onSuggestionApply?.(suggestion);
      setApplied((current) => current.includes(suggestion.title) ? current : [...current, suggestion.title]);
    } catch (cause) {
      setAiError(cause instanceof Error ? cause.message : 'Saran tidak dapat diterapkan.');
    }
  };

  return <ThemedView style={styles.page}>{aiError && <ThemedText type="small" style={{ color: theme.expense, paddingHorizontal: 21, paddingTop: 8 }}>{aiError}</ThemedText>}<ScrollView contentContainerStyle={styles.content}>
    <View style={styles.header}><View><ThemedText type="title" style={styles.title}>Rencana</ThemedText><Pressable accessibilityRole="button" accessibilityLabel="Ubah Budget period" onPress={() => setPeriodOpen(true)}><ThemedText type="code" themeColor="muted" style={styles.periodLabel}>{periodLabel}</ThemedText></Pressable></View><Pressable accessibilityRole="button" accessibilityLabel="AI Suggestion" onPress={() => setAiOpen(true)} style={[styles.aiButton, { borderColor: theme.line, backgroundColor: theme.mint }]}><ThemedText type="smallBold" themeColor="pine" style={styles.aiButtonText}>✦ AI Suggestion</ThemedText></Pressable></View>
    <FinanceHeroCard label="SALDO TERSEDIA" amount={snapshot.availableBalance} footer={[{ label: 'Tersedia bebas', value: formatMoney(snapshot.freeBalance) }, { label: 'Terikat goal', value: formatMoney(snapshot.goalBalance) }]} style={styles.available} />
    <View style={[styles.spare, { backgroundColor: theme.spareBackground }]}><View style={styles.spareCopy}><ThemedText style={[styles.spareLabel, { color: theme.spareText }]}>Spare budget</ThemedText><ThemedText style={[styles.spareAmount, { color: theme.spareText }]}>{formatMoney(snapshot.spareBudget)}</ThemedText><ThemedText style={[styles.spareNote, { color: theme.spareText }]}>pendapatan − fixed expense − goal</ThemedText></View><View style={[styles.calmRing, { borderColor: theme.pine, borderTopColor: theme.spareText }]}><ThemedText type="code" style={{ color: theme.spareText }}>{sparePercent(snapshot)}%</ThemedText></View></View>
    <PlanSection title="Pendapatan" action="+ Tambah" theme={theme} onAction={() => setPlanItemEditor({ type: 'income' })}>{plan.incomeItems.length ? plan.incomeItems.map((item) => <PlanItem key={item.id} item={item} category={categories.find((category) => category.id === item.categoryId)} state={itemState(item)} action="Catat" color={theme.income} theme={theme} onAction={handleItemAction} />) : <EmptyPlan message="Belum ada Pendapatan." />}</PlanSection>
    <PlanSection title="Fixed expense" action="+ Tambah" theme={theme} onAction={() => setPlanItemEditor({ type: 'fixedExpense' })}>{plan.fixedExpenseItems.length ? plan.fixedExpenseItems.map((item) => <PlanItem key={item.id} item={item} category={categories.find((category) => category.id === item.categoryId)} state={itemState(item)} action={itemState(item)?.paymentStatus?.kind === 'Lunas' ? '' : 'Bayar'} color={theme.expense} theme={theme} onAction={handleItemAction} />) : <EmptyPlan message="Belum ada Fixed expense." />}</PlanSection>
    <GoalSection goals={goals} wallets={wallets} theme={theme} onSave={onGoalSave} onArchive={onGoalArchive} onSaveAction={onGoalSaveAction} onWithdraw={onGoalWithdraw} />
    <PlanSection title="Alokasi" action="+ Tambah" theme={theme} onAction={() => setPlanItemEditor({ type: 'allocation' })}>{plan.allocationItems.length ? plan.allocationItems.map((item) => <PlanItem key={item.id} item={item} category={categories.find((category) => category.id === item.categoryId)} state={itemState(item)} action="" color={itemState(item)?.overBudget ? theme.expense : theme.pine} theme={theme} onAction={handleItemAction} />) : <EmptyPlan message="Belum ada Alokasi." />}</PlanSection>
  </ScrollView>
  {planItemEditor && <PlanItemFormModal item={planItemEditor.item} type={planItemEditor.type} categories={categories} theme={theme} onClose={() => setPlanItemEditor(null)} onSave={async (draft) => { await onPlanItemSave?.(planItemEditor.item ?? null, draft); setPlanItemEditor(null); }} />}
  <Modal transparent animationType="slide" visible={periodOpen} onRequestClose={() => setPeriodOpen(false)}><Pressable style={[styles.overlay, { backgroundColor: theme.overlay }]} onPress={() => setPeriodOpen(false)}><View style={[styles.sheet, { backgroundColor: theme.card }]}><ThemedText type="sectionHeading">Budget period</ThemedText><ThemedText type="small" themeColor="muted">Pilih tanggal mulai</ThemedText>{[1, 5, 25].map((day) => <Pressable key={day} accessibilityRole="button" accessibilityLabel={`Mulai tanggal ${day}`} onPress={() => { setStartDay(day); setPeriodOpen(false); void onPeriodStartDayChange?.(day); }} style={[styles.sheetOption, { borderTopColor: theme.line }]}><ThemedText type="smallBold" themeColor={startDay === day ? 'pine' : 'ink'}>Tanggal {day}</ThemedText></Pressable>)}</View></Pressable></Modal>
  <Modal transparent animationType="slide" visible={aiOpen} onRequestClose={() => setAiOpen(false)}><Pressable style={[styles.overlay, { backgroundColor: theme.overlay }]} onPress={() => setAiOpen(false)}><View style={[styles.sheet, { backgroundColor: theme.card }]}><ThemedText type="sectionHeading">✦ Saran untuk Budget plan</ThemedText>{aiLoading ? <View style={styles.loading}><ThemedText style={[styles.loadingGlyph, { color: theme.pine }]}>✦</ThemedText><ThemedText type="smallBold">Membaca pola keuanganmu…</ThemedText><ThemedText type="small" themeColor="muted">Sebentar ya.</ThemedText></View> : <>{aiSource === 'fallback' && <ThemedText type="small" themeColor="muted">Saran lokal berdasarkan data Budget plan.</ThemedText>}{suggestions.map((suggestion) => <View key={suggestion.title} style={[styles.suggestion, { borderTopColor: theme.line }]}><ThemedText type="small" style={styles.suggestionText}>{suggestion.title}{`\n`}{suggestion.description}</ThemedText><Pressable accessibilityRole="button" accessibilityLabel={`Terapkan ${suggestion.title}`} onPress={() => void applySuggestion(suggestion)}><ThemedText type="smallBold" themeColor={applied.includes(suggestion.title) ? 'income' : 'pine'}>{applied.includes(suggestion.title) ? '✓ Diterapkan' : 'Terapkan'}</ThemedText></Pressable></View>)}</>}<Pressable accessibilityRole="button" accessibilityLabel="Tutup saran" onPress={() => setAiOpen(false)} style={styles.closeSheet}><ThemedText type="smallBold" style={{ color: theme.heroText }}>Mengerti</ThemedText></Pressable></View></Pressable></Modal>
  </ThemedView>;
}

function formatPeriodLabel(period: { startDate: string; endDate: string }, startDay: number) {
  const start = new Date(`${period.startDate.slice(0, 7)}-${String(startDay).padStart(2, '0')}T12:00:00`);
  const end = new Date(`${period.endDate}T12:00:00`);
  return `${start.getDate()}–${end.getDate()} ${monthNames[end.getMonth()]}⌄`;
}

function PlanSection({ title, action, children, theme, onAction }: { title: string; action: string; children: ReactNode; theme: ReturnType<typeof useTheme>; onAction?: () => void }) { return <View style={styles.section}><View style={styles.sectionTitle}><ThemedText type="sectionHeading">{title}</ThemedText><Pressable accessibilityRole="button" accessibilityLabel={`${action} ${title}`} onPress={onAction}><ThemedText type="smallBold" themeColor="pine" style={styles.quietAction}>{action}</ThemedText></Pressable></View><View style={[styles.card, { borderTopColor: theme.line }]}>{children}</View></View>; }

function EmptyPlan({ message }: { message: string }) {
  return <View style={styles.emptyGoal}><ThemedText type="small" themeColor="muted">{message}</ThemedText></View>;
}

export default function PlanScreen(props: ComponentProps<typeof PlanScreenContent>) {
  return <SafeAreaView style={styles.safeArea}><PlanScreenContent {...props} /></SafeAreaView>;
}

function sparePercent(snapshot: { spareBudget: number; totalIncome: number }) {
  if (snapshot.totalIncome <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round(snapshot.spareBudget / snapshot.totalIncome * 100)));
}

function PlanItemFormModal({ item, type, categories, theme, onClose, onSave }: { item?: BudgetPlanItem; type: PlanItemType; categories: Category[]; theme: ReturnType<typeof useTheme>; onClose: () => void; onSave: (draft: PlanItemDraft) => void | Promise<void> }) {
  const [name, setName] = useState(item?.name ?? '');
  const [target, setTarget] = useState(item ? String(item.targetAmount) : '');
  const options = categories.filter((category) => !category.archived && category.type === (type === 'income' ? 'income' : 'expense') && !category.isAdjustment);
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? options[0]?.id ?? null);
  const submit = () => {
    const targetAmount = Number(target.replace(/[^0-9]/g, ''));
    if (!name.trim() || !categoryId || !Number.isSafeInteger(targetAmount) || targetAmount <= 0) return;
    void onSave({ type, name: name.trim(), categoryId, targetAmount });
  };
  return <Modal transparent animationType="slide" visible onRequestClose={onClose}><Pressable style={[styles.overlay, { backgroundColor: theme.overlay }]} onPress={onClose}><View style={[styles.goalSheet, { backgroundColor: theme.card }]}><View style={styles.sheetHeader}><ThemedText type="sectionHeading">{item ? 'Edit item plan' : 'Item plan baru'}</ThemedText><Pressable accessibilityRole="button" accessibilityLabel="Tutup form item plan" onPress={onClose}><ThemedText type="subtitle" themeColor="muted">×</ThemedText></Pressable></View><ThemedText type="small" themeColor="muted">Target adalah rencana; realisasi mengikuti transaksi.</ThemedText><ThemedText type="code" themeColor="muted" style={styles.fieldLabel}>NAMA ITEM</ThemedText><TextInput accessibilityLabel="Nama item plan" placeholder={type === 'income' ? 'Mis. Gaji' : 'Mis. Makan'} placeholderTextColor={theme.muted} value={name} onChangeText={setName} style={[styles.goalInput, { borderBottomColor: theme.line, color: theme.ink }]} /><ThemedText type="code" themeColor="muted" style={styles.fieldLabel}>TARGET NOMINAL</ThemedText><TextInput accessibilityLabel="Target item plan" keyboardType="numeric" placeholder="0" placeholderTextColor={theme.muted} value={target} onChangeText={setTarget} style={[styles.goalInput, { borderBottomColor: theme.line, color: theme.ink }]} /><ThemedText type="code" themeColor="muted" style={styles.fieldLabel}>KATEGORI</ThemedText><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.goalWallets}>{options.map((category) => <Pressable key={category.id} accessibilityRole="button" accessibilityLabel={`Kategori ${category.name}`} onPress={() => setCategoryId(category.id)} style={[styles.goalWallet, { borderColor: categoryId === category.id ? theme.pine : theme.line, backgroundColor: categoryId === category.id ? theme.mint : theme.card }]}><ThemedText type="smallBold">{category.icon} {category.name}</ThemedText></Pressable>)}</ScrollView>{options.length === 0 && <ThemedText type="small" style={{ color: theme.expense }}>Belum ada kategori yang sesuai.</ThemedText>}<Pressable accessibilityRole="button" accessibilityLabel="Simpan item plan" onPress={submit} style={[styles.saveGoal, { backgroundColor: theme.pine }]}><ThemedText type="smallBold" style={{ color: theme.heroText }}>{item ? 'Simpan perubahan' : 'Simpan item'}</ThemedText></Pressable></View></Pressable></Modal>;
}

function GoalSection({ goals, wallets, theme, onSave, onArchive, onSaveAction, onWithdraw }: { goals: Goal[]; wallets: Wallet[]; theme: ReturnType<typeof useTheme>; onSave?: (goal: Goal | null, draft: GoalDraft) => void | Promise<void>; onArchive?: (goal: Goal) => void | Promise<void>; onSaveAction?: (goal: Goal) => void | Promise<void>; onWithdraw?: (goal: Goal, amount: number) => void | Promise<void> }) {
  const [editor, setEditor] = useState<Goal | 'new' | null>(null);
  const openNew = () => setEditor('new');
  const activeWallets = wallets.filter((wallet) => !wallet.archived);
  return <>
    <PlanSection title="Goal" action="+ Tambah" theme={theme} onAction={openNew}>{goals.length === 0 ? <View style={styles.emptyGoal}><ThemedText type="small" themeColor="muted">Belum ada Goal.</ThemedText></View> : goals.map((goal) => {
      const saved = wallets.find((wallet) => wallet.id === goal.walletId)?.balance ?? 0;
      const achieved = saved >= goal.targetAmount;
      return <View key={goal.id} style={[styles.goal, { borderBottomColor: theme.line }]}><View style={styles.planItemTop}><View style={[styles.categoryIcon, { backgroundColor: theme.mint }]}><ThemedText style={{ color: theme.gold }}>✦</ThemedText></View><View style={styles.itemCopy}><ThemedText type="smallBold" style={styles.itemName}>{goal.name}</ThemedText><ThemedText type="small" themeColor="muted" style={styles.itemSubtitle}>Kontribusi bulanan {formatMoney(goal.monthlyContribution)}</ThemedText></View><ThemedText type="code" style={[styles.itemValueText, { color: achieved ? theme.income : theme.gold }]}>{formatMoney(saved)} / {formatMoney(goal.targetAmount)}</ThemedText></View><Progress value={Math.min(saved / goal.targetAmount * 100, 100)} color={achieved ? theme.income : theme.gold} theme={theme} /><ThemedText type="small" themeColor="muted" style={styles.goalStatus}>{achieved ? 'Tercapai' : `Target ${formatMoney(goal.targetAmount)}`}</ThemedText><View style={styles.goalActions}><Pressable accessibilityRole="button" accessibilityLabel={`Edit Goal ${goal.name}`} onPress={() => setEditor(goal)}><ThemedText type="smallBold" themeColor="pine" style={styles.goalActionText}>Edit</ThemedText></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Nabung ke Goal ${goal.name}`} onPress={() => void onSaveAction?.(goal)}><ThemedText type="smallBold" themeColor="pine" style={styles.goalActionText}>Nabung</ThemedText></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Tarik dana darurat ${goal.name}`} onPress={() => Alert.alert('Penarikan darurat?', `Saldo ${formatMoney(saved)} akan ditarik dari Wallet Goal.`, [{ text: 'Batal', style: 'cancel' }, { text: 'Tarik', style: 'destructive', onPress: () => void onWithdraw?.(goal, saved) }])}><ThemedText type="smallBold" style={[styles.goalActionText, { color: theme.expense }]}>Tarik</ThemedText></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Arsipkan Goal ${goal.name}`} onPress={() => Alert.alert('Arsipkan Goal?', 'Goal dan riwayatnya tetap tersimpan.', [{ text: 'Batal', style: 'cancel' }, { text: 'Arsipkan', style: 'destructive', onPress: () => void onArchive?.(goal) }])}><ThemedText type="smallBold" style={[styles.goalActionText, { color: theme.expense }]}>Arsipkan</ThemedText></Pressable></View></View>;
    })}</PlanSection>
    {editor && <GoalFormModal goal={editor === 'new' ? null : editor} wallets={activeWallets} theme={theme} onClose={() => setEditor(null)} onSave={async (draft) => { await onSave?.(editor === 'new' ? null : editor, draft); setEditor(null); }} />}
  </>;
}

function GoalFormModal({ goal, wallets, theme, onClose, onSave }: { goal: Goal | null; wallets: Wallet[]; theme: ReturnType<typeof useTheme>; onClose: () => void; onSave: (draft: GoalDraft) => void | Promise<void> }) {
  const [name, setName] = useState(goal?.name ?? '');
  const [target, setTarget] = useState(goal ? String(goal.targetAmount) : '');
  const [targetDate, setTargetDate] = useState(goal?.targetDate ?? '');
  const [monthly, setMonthly] = useState(goal ? String(goal.monthlyContribution) : '');
  const [walletId, setWalletId] = useState(goal?.walletId ?? wallets[0]?.id ?? null);
  const submit = () => { if (!name.trim() || !walletId || !Number(target) || Number(target) < 1) return; void onSave({ name: name.trim(), targetAmount: Number(target), targetDate: targetDate.trim() || null, walletId, monthlyContribution: Number(monthly) || 0 }); };
  return <Modal transparent animationType="slide" visible onRequestClose={onClose}><Pressable style={[styles.overlay, { backgroundColor: theme.overlay }]} onPress={onClose}><View style={[styles.goalSheet, { backgroundColor: theme.card }]}><View style={styles.sheetHeader}><ThemedText type="sectionHeading">{goal ? 'Edit Goal' : 'Goal baru'}</ThemedText><Pressable accessibilityRole="button" accessibilityLabel="Tutup form Goal" onPress={onClose}><ThemedText type="subtitle" themeColor="muted">×</ThemedText></Pressable></View><ThemedText type="small" themeColor="muted">Progress Goal selalu mengikuti saldo Wallet tabungan.</ThemedText><ThemedText type="code" themeColor="muted" style={styles.fieldLabel}>NAMA GOAL</ThemedText><TextInput accessibilityLabel="Nama Goal" placeholder="Mis. Dana Nikah" placeholderTextColor={theme.muted} value={name} onChangeText={setName} style={[styles.goalInput, { borderBottomColor: theme.line, color: theme.ink }]} /><ThemedText type="code" themeColor="muted" style={styles.fieldLabel}>TARGET NOMINAL</ThemedText><TextInput accessibilityLabel="Target Goal" keyboardType="numeric" placeholder="0" placeholderTextColor={theme.muted} value={target} onChangeText={setTarget} style={[styles.goalInput, { borderBottomColor: theme.line, color: theme.ink }]} /><ThemedText type="code" themeColor="muted" style={styles.fieldLabel}>WALLET GOAL</ThemedText><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.goalWallets}>{wallets.map((wallet) => <Pressable key={wallet.id} accessibilityRole="button" accessibilityLabel={`Wallet Goal ${wallet.name}`} onPress={() => setWalletId(wallet.id)} style={[styles.goalWallet, { borderColor: walletId === wallet.id ? theme.pine : theme.line, backgroundColor: walletId === wallet.id ? theme.mint : theme.card }]}><ThemedText type="smallBold">{wallet.name}</ThemedText><ThemedText type="small" themeColor="muted">{formatMoney(wallet.balance)}</ThemedText></Pressable>)}</ScrollView><ThemedText type="code" themeColor="muted" style={styles.fieldLabel}>TANGGAL TARGET <ThemedText type="small" themeColor="muted">(opsional)</ThemedText></ThemedText><TextInput accessibilityLabel="Tanggal target Goal" placeholder="YYYY-MM-DD" placeholderTextColor={theme.muted} value={targetDate} onChangeText={setTargetDate} style={[styles.goalInput, { borderBottomColor: theme.line, color: theme.ink }]} /><ThemedText type="code" themeColor="muted" style={styles.fieldLabel}>KONTRIBUSI BULANAN</ThemedText><TextInput accessibilityLabel="Kontribusi bulanan Goal" keyboardType="numeric" placeholder="0" placeholderTextColor={theme.muted} value={monthly} onChangeText={setMonthly} style={[styles.goalInput, { borderBottomColor: theme.line, color: theme.ink }]} /><Pressable accessibilityRole="button" accessibilityLabel="Simpan Goal" onPress={submit} style={[styles.saveGoal, { backgroundColor: theme.pine }]}><ThemedText type="smallBold" style={{ color: theme.heroText }}>{goal ? 'Simpan perubahan' : 'Simpan Goal'}</ThemedText></Pressable></View></Pressable></Modal>;
}

function PlanItem({ item, category, state, action, color, theme, onAction }: { item: BudgetPlanItem; category?: Category; state?: PlanItemState; action: string; color: string; theme: ReturnType<typeof useTheme>; onAction: (item: BudgetPlanItem) => void }) {
  const progress = state?.progressPercent ?? 0;
  const amountLabel = state?.realizedAmount ?? 0;
  const paymentStatus = state?.paymentStatus;
  const paymentLabel = paymentStatus?.kind === 'Sebagian dibayar'
    ? getPaymentLabel(paymentStatus.kind, paymentStatus.paidAmount, paymentStatus.targetAmount)
    : paymentStatus ? getPaymentLabel(paymentStatus.kind) : null;
  const subtitle = item.type === 'income' ? 'Realisasi dari transaksi' : state?.overBudget ? 'Melebihi Budget' : paymentLabel ?? 'Sisa budget';
  const iconBackground = item.type === 'income' ? theme.incomeBackground : item.type === 'fixedExpense' ? theme.expenseBackground : theme.mint;
  const iconColor = item.type === 'income' ? theme.income : item.type === 'fixedExpense' ? theme.expense : theme.pine;
  return <View style={[styles.item, { borderBottomColor: theme.line }]}><View style={styles.planItemTop}><View style={[styles.categoryIcon, { backgroundColor: iconBackground }]}><ThemedText style={{ color: iconColor }}>{category?.icon ?? '◈'}</ThemedText></View><View style={styles.itemCopy}><ThemedText type="smallBold" style={styles.itemName}>{item.name}</ThemedText><ThemedText type="small" themeColor="muted" style={[styles.itemSubtitle, state?.overBudget && { color: theme.expense }]}>{subtitle}</ThemedText></View><ThemedText type="code" style={[styles.itemValueText, { color: state?.overBudget ? theme.expense : theme.ink }]}>{formatMoney(amountLabel)} / {formatMoney(item.targetAmount)}</ThemedText></View><Progress value={progress} color={state?.overBudget ? theme.expense : color} theme={theme} />{action && <Pressable accessibilityRole="button" accessibilityLabel={`${action} ${item.name}`} onPress={() => onAction(item)} hitSlop={8} style={styles.itemAction}><ThemedText type="smallBold" style={[styles.itemActionText, { color }]}>{action} →</ThemedText></Pressable>}</View>;
}

function Progress({ value, color, theme }: { value: number; color: string; theme: ReturnType<typeof useTheme> }) { return <View style={[styles.progress, { backgroundColor: theme.line }]}><View style={[styles.progressFill, { backgroundColor: color, width: `${Math.min(value, 100)}%` }]} /></View>; }

const styles = StyleSheet.create({
  page: { flex: 1 },
  safeArea: { flex: 1 },
  content: { alignSelf: 'center', paddingBottom: 104, paddingHorizontal: 21, paddingTop: 28, width: '100%' },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  eyebrow: { ...Typography.eyebrow },
  title: { fontFamily: Fonts.serifSemiBold, fontSize: 29, lineHeight: 31, letterSpacing: -1.16, marginBottom: 5 },
  aiButton: { borderRadius: Radius.pill, borderWidth: 1, marginTop: 14, paddingHorizontal: 12, paddingVertical: 10 },
  aiButtonText: { fontSize: 11, lineHeight: 14 },
  periodLabel: { fontSize: 11, lineHeight: 14 },
  available: { marginBottom: 17 },
  spare: { alignItems: 'center', borderRadius: 22, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25, padding: 18 },
  spareCopy: { flex: 1 },
  spareLabel: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 16, marginBottom: 3 },
  spareAmount: { fontFamily: Fonts.serifBold, fontSize: 26, lineHeight: 29, letterSpacing: -1.04 },
  spareNote: { fontFamily: Fonts.sans, fontSize: 9, lineHeight: 13 },
  calmRing: { alignItems: 'center', borderRadius: 25, borderWidth: 5, height: 50, justifyContent: 'center', width: 50 },
  section: { marginBottom: 25 },
  sectionTitle: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, marginHorizontal: 2 },
  card: { borderTopWidth: 1, paddingBottom: 1, paddingTop: 19 },
  item: { paddingVertical: 12 },
  planItemTop: { alignItems: 'center', flexDirection: 'row', gap: 9 },
  itemHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  categoryIcon: { alignItems: 'center', borderRadius: 12, height: 35, justifyContent: 'center', width: 35 },
  itemCopy: { flex: 1, minWidth: 0 },
  itemName: { fontSize: 12, lineHeight: 16 },
  itemSubtitle: { fontSize: 10, lineHeight: 14, marginTop: 2 },
  itemValueText: { flexShrink: 0, fontSize: 10, lineHeight: 14, letterSpacing: -0.4 },
  itemAction: { alignSelf: 'flex-end', marginTop: 1 },
  itemActionText: { fontSize: 10, lineHeight: 14 },
  quietAction: { fontSize: 12, lineHeight: 15 },
  progress: { borderRadius: 9, height: 5, marginBottom: 7, marginTop: 10, overflow: 'hidden' },
  progressFill: { borderRadius: 9, height: '100%' },
  goal: { paddingVertical: 12 },
  goalActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 12 },
  goalActionText: { fontSize: 10, lineHeight: 14 },
  goalStatus: { fontSize: 10, lineHeight: 14 },
  emptyGoal: { paddingVertical: 16 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 27, borderTopRightRadius: 27, gap: 8, padding: 21 },
  goalSheet: { borderTopLeftRadius: 27, borderTopRightRadius: 27, gap: 8, padding: 21 },
  sheetHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sheetOption: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 15 },
  fieldLabel: { ...Typography.eyebrow, marginTop: 8 },
  goalInput: { borderBottomWidth: 1, fontSize: 16, minHeight: 44, paddingHorizontal: 8 },
  goalWallets: { gap: 8, paddingVertical: 4 },
  goalWallet: { borderRadius: 12, borderWidth: 1, gap: 2, minWidth: 120, padding: 10 },
  saveGoal: { alignItems: 'center', borderRadius: 13, marginTop: 8, padding: 13 },
  loading: { alignItems: 'center', paddingVertical: 35 },
  loadingGlyph: { fontSize: 28, marginBottom: 12 },
  suggestion: { alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 10, paddingVertical: 15 },
  suggestionText: { flex: 1 },
  closeSheet: { alignItems: 'center', backgroundColor: '#235B50', borderRadius: 13, marginTop: 8, padding: 13 },
});
