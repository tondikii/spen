import { useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { Fonts, Radius, Typography } from '@/constants/theme';
import { formatMoney } from '@/lib/money';
import { formatMoneyInput, parseMoneyInput } from '@/lib/money-input';
import { getDatabasePlanView, getPlanView, type PlanItemDraft } from '@/services/plan-service';
import { aiService, type BudgetAIInput, type BudgetSuggestion } from '@/services/ai-service';
import { ThemedInput } from '@/components/themed-input';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FinanceHeroCard } from '@/components/finance-hero-card';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import type { BudgetPlanItem, Category, Goal, PlanItemType, Wallet } from '@/types/domain';
import { CATEGORY_ICON_CHOICES, CategoryIcon } from '@/components/category-icon';
import { CurrencyMark } from '@/components/currency-mark';
import { ConfirmationModal } from '@/components/confirmation-modal';

type PlanView = ReturnType<typeof getPlanView> | Awaited<ReturnType<typeof getDatabasePlanView>>;
type PlanItemState = { realizedAmount: number; progressPercent: number; overBudget: boolean };
type GoalDraft = Omit<Goal, 'id' | 'archived'>;
type Confirmation = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
};

const monthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

function PlanScreenContent({
  planView = getPlanView(),
  categories = [],
  onPeriodStartDayChange,
  onItemAction,
  onItemPayment,
  onPlanItemSave,
  onPlanItemDelete,
  onCategorySave,
  onGoalSave,
  onGoalArchive,
  onGoalSaveAction,
  onGoalWithdraw,
  aiInput,
  onSuggestionApply,
}: {
  planView?: PlanView;
  categories?: Category[];
  onPeriodStartDayChange?: (day: number) => void | Promise<void>;
  onItemAction?: (item: BudgetPlanItem, amount: number) => void | Promise<void>;
  onItemPayment?: (item: BudgetPlanItem, paid: boolean) => void | Promise<void>;
  onPlanItemSave?: (item: BudgetPlanItem | null, draft: PlanItemDraft) => void | Promise<void>;
  onPlanItemDelete?: (item: BudgetPlanItem) => void | Promise<void>;
  onCategorySave?: (category: Category) => Category | Promise<Category>;
  onGoalSave?: (goal: Goal | null, draft: GoalDraft) => void | Promise<void>;
  onGoalArchive?: (goal: Goal) => void | Promise<void>;
  onGoalSaveAction?: (goal: Goal) => void | Promise<void>;
  onGoalWithdraw?: (goal: Goal, amount: number) => void | Promise<void>;
  aiInput?: BudgetAIInput;
  onSuggestionApply?: (suggestion: BudgetSuggestion) => void | Promise<void>;
}) {
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
  const [planItemEditor, setPlanItemEditor] = useState<{
    type: PlanItemType;
    item?: BudgetPlanItem;
  } | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect -- opening the sheet starts its loading state. */
  useEffect(() => {
    if (!aiOpen) return;
    let cancelled = false;
    setAiLoading(true);
    setAiError('');
    const timer = setTimeout(() => {
      setAiLoading(true);
      setAiError('');
      void aiService
        .suggestBudget(
          aiInput ?? {
            spareBudget: snapshot.spareBudget,
            totalIncome: snapshot.totalIncome,
            fixedExpense: 0,
            goalContributions: snapshot.goalBalance,
            netSaving: snapshot.netSaving,
          },
        )
        .then((result) => {
          if (cancelled) return;
          setSuggestions(result.suggestions);
          setAiSource(result.source);
          setAiLoading(false);
        })
        .catch(() => {
          if (!cancelled) {
            setAiError('Saran AI tidak tersedia. Coba lagi nanti.');
            setAiLoading(false);
          }
        });
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [aiOpen, aiInput]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const periodLabel = formatPeriodLabel(period, startDay);
  const itemState = (item: BudgetPlanItem) =>
    snapshot.planItems.find((state) => state.itemId === item.id);
  const handleItemAction = (item: BudgetPlanItem) => {
    const state = itemState(item);
    const amount =
      item.type === 'expense'
        ? Math.max(item.targetAmount - (state?.realizedAmount ?? 0), 0)
        : item.targetAmount;
    void onItemAction?.(item, amount);
  };

  const applySuggestion = async (suggestion: BudgetSuggestion) => {
    try {
      await onSuggestionApply?.(suggestion);
      setApplied((current) =>
        current.includes(suggestion.title) ? current : [...current, suggestion.title],
      );
    } catch (cause) {
      setAiError(cause instanceof Error ? cause.message : 'Saran tidak dapat diterapkan.');
    }
  };

  return (
    <ThemedView style={styles.page}>
      {aiError && (
        <ThemedText
          type="small"
          accessibilityLiveRegion="polite"
          style={{ color: theme.expense, paddingHorizontal: 21, paddingTop: 8 }}
        >
          {aiError}
        </ThemedText>
      )}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <ThemedText type="title" style={styles.title}>
              Rencana
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ubah Budget period"
              onPress={() => setPeriodOpen(true)}
              style={[styles.dropdown, { borderColor: theme.line }]}
            >
              <ThemedText type="code" themeColor="muted" style={styles.periodLabel}>
                {periodLabel}
              </ThemedText>
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Saran AI"
            accessibilityHint="Membuka saran Budget plan yang bisa kamu tinjau"
            onPress={() => setAiOpen(true)}
            style={[styles.aiButton, { borderColor: theme.line, backgroundColor: theme.mint }]}
          >
            <ThemedText type="smallBold" themeColor="pine" style={styles.aiButtonText}>
              ✦ Saran AI
            </ThemedText>
          </Pressable>
        </View>
        <FinanceHeroCard
          label="SALDO TERSEDIA"
          amount={snapshot.availableBalance}
          footer={[
            { label: 'Tersedia bebas', value: formatMoney(snapshot.freeBalance) },
            { label: 'Terikat goal', value: formatMoney(snapshot.goalBalance) },
          ]}
          style={styles.available}
        />
        <View style={[styles.spare, { backgroundColor: theme.spareBackground }]}>
          <View style={styles.spareCopy}>
            <ThemedText style={[styles.spareLabel, { color: theme.spareText }]}>
              Spare budget
            </ThemedText>
            <ThemedText style={[styles.spareAmount, { color: theme.spareText }]}>
              {formatMoney(snapshot.spareBudget)}
            </ThemedText>
            <ThemedText style={[styles.spareNote, { color: theme.spareText }]}>
              pendapatan − pengeluaran − goal
            </ThemedText>
          </View>
          <View
            style={[styles.calmRing, { borderColor: theme.pine, borderTopColor: theme.spareText }]}
          >
            <ThemedText type="code" style={{ color: theme.spareText }}>
              {sparePercent(snapshot)}%
            </ThemedText>
          </View>
        </View>
        <PlanSection
          title="Pendapatan"
          action="+ Tambah"
          theme={theme}
          onAction={() => setPlanItemEditor({ type: 'income' })}
        >
          {plan.incomeItems.length ? (
            plan.incomeItems.map((item) => (
              <PlanItem
                key={item.id}
                item={item}
                category={categories.find((category) => category.id === item.categoryId)}
                state={itemState(item)}
                action={'isAutomatic' in item && item.isAutomatic ? '' : 'Catat'}
                color={theme.income}
                theme={theme}
                onAction={handleItemAction}
                onEdit={() => setPlanItemEditor({ type: item.type, item })}
                onDelete={onPlanItemDelete}
              />
            ))
          ) : (
            <EmptyPlan message="Belum ada Pendapatan." />
          )}
        </PlanSection>
        <PlanSection
          title="Pengeluaran"
          action="+ Tambah"
          theme={theme}
          onAction={() => setPlanItemEditor({ type: 'expense' })}
        >
          {plan.expenseItems.length ? (
            plan.expenseItems.map((item) => (
              <PlanItem
                key={item.id}
                item={item}
                category={categories.find((category) => category.id === item.categoryId)}
                state={itemState(item)}
                action="Bayar"
                color={theme.expense}
                theme={theme}
                onAction={handleItemAction}
                onPayment={onItemPayment}
                onEdit={() => setPlanItemEditor({ type: item.type, item })}
                onDelete={onPlanItemDelete}
              />
            ))
          ) : (
            <EmptyPlan message="Belum ada Pengeluaran." />
          )}
        </PlanSection>
        <GoalSection
          goals={goals}
          wallets={wallets}
          theme={theme}
          onSave={onGoalSave}
          onArchive={onGoalArchive}
          onSaveAction={onGoalSaveAction}
          onWithdraw={onGoalWithdraw}
        />
      </ScrollView>
      {planItemEditor && (
        <PlanItemFormModal
          item={planItemEditor.item}
          type={planItemEditor.type}
          categories={categories}
          theme={theme}
          onCategorySave={onCategorySave}
          onClose={() => setPlanItemEditor(null)}
          onSave={async (draft) => {
            await onPlanItemSave?.(planItemEditor.item ?? null, draft);
            setPlanItemEditor(null);
          }}
        />
      )}
      <Modal
        transparent
        animationType="slide"
        visible={periodOpen}
        onRequestClose={() => setPeriodOpen(false)}
      >
        <Pressable
          style={[styles.overlay, { backgroundColor: theme.overlay }]}
          onPress={() => setPeriodOpen(false)}
        >
          <View style={[styles.sheet, { backgroundColor: theme.card }]}>
            <ThemedText type="sectionHeading">Budget period</ThemedText>
            <ThemedText type="small" themeColor="muted">
              Pilih tanggal mulai
            </ThemedText>
            {[1, 5, 25].map((day) => (
              <Pressable
                key={day}
                accessibilityRole="button"
                accessibilityLabel={`Mulai tanggal ${day}`}
                onPress={() => {
                  setStartDay(day);
                  setPeriodOpen(false);
                  void onPeriodStartDayChange?.(day);
                }}
                style={[styles.sheetOption, { borderTopColor: theme.line }]}
              >
                <ThemedText type="smallBold" themeColor={startDay === day ? 'pine' : 'ink'}>
                  Tanggal {day}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
      <Modal
        transparent
        animationType="slide"
        visible={aiOpen}
        onRequestClose={() => setAiOpen(false)}
      >
        <Pressable
          style={[styles.overlay, { backgroundColor: theme.overlay }]}
          onPress={() => setAiOpen(false)}
        >
          <View style={[styles.sheet, { backgroundColor: theme.card }]}>
            <ThemedText type="sectionHeading">✦ Saran untuk Budget plan</ThemedText>
            {aiLoading ? (
              <View style={styles.loading}>
                <ThemedText style={[styles.loadingGlyph, { color: theme.pine }]}>✦</ThemedText>
                <ThemedText type="smallBold">Membaca pola keuanganmu…</ThemedText>
                <ThemedText type="small" themeColor="muted">
                  Sebentar ya.
                </ThemedText>
              </View>
            ) : (
              <>
                {aiSource === 'fallback' && (
                  <ThemedText type="small" themeColor="muted">
                    AI tidak tersedia — saran ini dari data Budget plan-mu.
                  </ThemedText>
                )}
                {suggestions.map((suggestion) => (
                  <View
                    key={suggestion.title}
                    style={[styles.suggestion, { borderTopColor: theme.line }]}
                  >
                    <ThemedText type="small" style={styles.suggestionText}>
                      {suggestion.title}
                      {`\n`}
                      {suggestion.description}
                    </ThemedText>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Terapkan ${suggestion.title}`}
                      onPress={() => void applySuggestion(suggestion)}
                    >
                      <ThemedText
                        type="smallBold"
                        themeColor={applied.includes(suggestion.title) ? 'income' : 'pine'}
                      >
                        {applied.includes(suggestion.title) ? '✓ Diterapkan' : 'Terapkan'}
                      </ThemedText>
                    </Pressable>
                  </View>
                ))}
              </>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tutup saran"
              onPress={() => setAiOpen(false)}
              style={[styles.closeSheet, { backgroundColor: theme.pine }]}
            >
              <ThemedText type="smallBold" style={{ color: theme.heroText }}>
                Mengerti
              </ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

function formatPeriodLabel(period: { startDate: string; endDate: string }, startDay: number) {
  const start = new Date(
    `${period.startDate.slice(0, 7)}-${String(startDay).padStart(2, '0')}T12:00:00`,
  );
  const end = new Date(`${period.endDate}T12:00:00`);
  return `${start.getDate()}–${end.getDate()} ${monthNames[end.getMonth()]}⌄`;
}

function PlanSection({
  title,
  action,
  children,
  theme,
  onAction,
}: {
  title: string;
  action: string;
  children: ReactNode;
  theme: ReturnType<typeof useTheme>;
  onAction?: () => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionTitle}>
        <ThemedText type="sectionHeading">{title}</ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${action} ${title}`}
          onPress={onAction}
        >
          <ThemedText type="smallBold" themeColor="pine" style={styles.quietAction}>
            {action}
          </ThemedText>
        </Pressable>
      </View>
      <View style={[styles.card, { borderTopColor: theme.line }]}>{children}</View>
    </View>
  );
}

function EmptyPlan({ message }: { message: string }) {
  return (
    <View style={styles.emptyGoal}>
      <ThemedText type="small" themeColor="muted">
        {message}
      </ThemedText>
    </View>
  );
}

export default function PlanScreen(props: ComponentProps<typeof PlanScreenContent>) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <PlanScreenContent {...props} />
    </SafeAreaView>
  );
}

function sparePercent(snapshot: { spareBudget: number; totalIncome: number }) {
  if (snapshot.totalIncome <= 0) return 0;
  return Math.max(
    0,
    Math.min(100, Math.round((snapshot.spareBudget / snapshot.totalIncome) * 100)),
  );
}

function PlanItemFormModal({
  item,
  type,
  categories: categoriesProp,
  theme,
  onCategorySave,
  onClose,
  onSave,
}: {
  item?: BudgetPlanItem;
  type: PlanItemType;
  categories: Category[];
  theme: ReturnType<typeof useTheme>;
  onCategorySave?: (category: Category) => Category | Promise<Category>;
  onClose: () => void;
  onSave: (draft: PlanItemDraft) => void | Promise<void>;
}) {
  const [categories, setCategories] = useState(categoriesProp);
  const [target, setTarget] = useState(item ? formatMoneyInput(item.targetAmount) : '');
  const options = categories.filter(
    (category) =>
      !category.archived &&
      category.type === (type === 'income' ? 'income' : 'expense') &&
      !category.isAdjustment,
  );
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? options[0]?.id ?? null);
  const [categoryEditorOpen, setCategoryEditorOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState<string>(CATEGORY_ICON_CHOICES[0]);
  const saveCategory = async () => {
    const name = categoryName.trim();
    if (!name) return;
    const draft: Category = {
      id: `category-draft-${Date.now()}`,
      name,
      type: type === 'income' ? 'income' : 'expense',
      icon: categoryIcon,
      archived: false,
      isAdjustment: false,
    };
    const saved = onCategorySave ? await onCategorySave(draft) : draft;
    setCategories((current) => [...current, saved]);
    setCategoryId(saved.id);
    setCategoryEditorOpen(false);
    setCategoryName('');
  };
  const submit = () => {
    const targetAmount = type === 'income' ? 0 : parseMoneyInput(target);
    if (
      !categoryId ||
      !Number.isSafeInteger(targetAmount) ||
      (type === 'expense' && targetAmount <= 0)
    )
      return;
    void onSave({ type, categoryId, targetAmount });
  };
  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: theme.overlay }]} onPress={onClose}>
        <KeyboardAvoidingView
          style={styles.sheetKeyboard}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <View style={[styles.goalSheet, { backgroundColor: theme.card }]}>
            <View style={styles.sheetHeader}>
              <ThemedText type="sectionHeading">
                {item ? 'Edit item plan' : 'Item plan baru'}
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tutup form item plan"
                onPress={onClose}
              >
                <ThemedText type="subtitle" themeColor="muted">
                  ×
                </ThemedText>
              </Pressable>
            </View>
            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.goalSheetContent}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets
              keyboardDismissMode="interactive"
            >
              <ThemedText type="small" themeColor="muted">
                {type === 'income'
                  ? 'Pendapatan mengikuti transaksi yang sudah diterima.'
                  : 'Target mengikuti total pembayaran dalam periode ini.'}
              </ThemedText>
              {type === 'expense' && (
                <>
                  <ThemedText type="code" themeColor="muted" style={styles.fieldLabel}>
                    TARGET NOMINAL
                  </ThemedText>
                  <View style={styles.moneyInputRow}>
                    <CurrencyMark />
                    <ThemedInput
                      accessibilityLabel="Target item plan"
                      keyboardType="numeric"
                      placeholder="0"
                      value={target}
                      onChangeText={(value) => setTarget(formatMoneyInput(value))}
                      style={[styles.goalInput, styles.moneyInput]}
                    />
                  </View>
                </>
              )}
              <View style={styles.categoryLabelRow}>
                <ThemedText type="code" themeColor="muted" style={styles.fieldLabel}>
                  KATEGORI
                </ThemedText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Tambah kategori dari item plan"
                  onPress={() => setCategoryEditorOpen(true)}
                >
                  <ThemedText type="smallBold" themeColor="pine">
                    + Tambah
                  </ThemedText>
                </Pressable>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.goalWallets}
              >
                {options.map((category) => (
                  <Pressable
                    key={category.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Kategori ${category.name}`}
                    onPress={() => setCategoryId(category.id)}
                    style={[
                      styles.goalWallet,
                      {
                        borderColor: categoryId === category.id ? theme.pine : theme.line,
                        backgroundColor: categoryId === category.id ? theme.mint : theme.card,
                      },
                    ]}
                  >
                    <CategoryIcon name={category.icon} color={theme.pine} size={18} />
                    <ThemedText type="smallBold">{category.name}</ThemedText>
                  </Pressable>
                ))}
              </ScrollView>
              {options.length === 0 && (
                <ThemedText type="small" style={{ color: theme.expense }}>
                  Belum ada kategori yang sesuai.
                </ThemedText>
              )}
              {categoryEditorOpen && (
                <View
                  style={[
                    styles.inlineCategoryEditor,
                    { borderColor: theme.line, backgroundColor: theme.background },
                  ]}
                >
                  <View style={styles.categoryEditorHeader}>
                    <ThemedText type="smallBold">Tambah kategori</ThemedText>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Batal edit kategori item plan"
                      onPress={() => {
                        setCategoryEditorOpen(false);
                        setCategoryName('');
                      }}
                      hitSlop={8}
                    >
                      <ThemedText type="smallBold" style={{ color: theme.expense }}>
                        Batal
                      </ThemedText>
                    </Pressable>
                  </View>
                  <ThemedInput
                    accessibilityLabel="Nama kategori baru dari item plan"
                    placeholder="Nama kategori"
                    value={categoryName}
                    onChangeText={setCategoryName}
                    style={styles.goalInput}
                  />
                  <ScrollView
                    style={styles.planIconScroll}
                    contentContainerStyle={styles.planIconGrid}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator
                  >
                    {CATEGORY_ICON_CHOICES.map((icon) => (
                      <Pressable
                        key={icon}
                        accessibilityRole="button"
                        accessibilityLabel={`Pilih ikon ${icon}`}
                        onPress={() => setCategoryIcon(icon)}
                        style={[
                          styles.planIconChoice,
                          {
                            borderColor: icon === categoryIcon ? theme.pine : theme.line,
                            backgroundColor: icon === categoryIcon ? theme.mint : theme.card,
                          },
                        ]}
                      >
                        <CategoryIcon name={icon} color={theme.pine} size={18} />
                      </Pressable>
                    ))}
                  </ScrollView>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Simpan kategori item plan"
                    disabled={!categoryName.trim()}
                    onPress={() => void saveCategory()}
                    style={({ pressed }) => [
                      styles.planSaveCategory,
                      {
                        backgroundColor: categoryName.trim() ? theme.pine : theme.line,
                        opacity: pressed ? 0.78 : 1,
                      },
                    ]}
                  >
                    <ThemedText
                      type="smallBold"
                      style={{ color: categoryName.trim() ? theme.heroText : theme.muted }}
                    >
                      Simpan kategori
                    </ThemedText>
                  </Pressable>
                </View>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Simpan item plan"
                onPress={submit}
                style={[styles.saveGoal, { backgroundColor: theme.pine }]}
              >
                <ThemedText type="smallBold" style={{ color: theme.heroText }}>
                  {item ? 'Simpan perubahan' : 'Simpan item'}
                </ThemedText>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

function GoalSection({
  goals,
  wallets,
  theme,
  onSave,
  onArchive,
  onSaveAction,
  onWithdraw,
}: {
  goals: Goal[];
  wallets: Wallet[];
  theme: ReturnType<typeof useTheme>;
  onSave?: (goal: Goal | null, draft: GoalDraft) => void | Promise<void>;
  onArchive?: (goal: Goal) => void | Promise<void>;
  onSaveAction?: (goal: Goal) => void | Promise<void>;
  onWithdraw?: (goal: Goal, amount: number) => void | Promise<void>;
}) {
  const [editor, setEditor] = useState<Goal | 'new' | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const openNew = () => setEditor('new');
  const activeWallets = wallets.filter((wallet) => !wallet.archived);
  return (
    <>
      <PlanSection title="Goal" action="+ Tambah" theme={theme} onAction={openNew}>
        {goals.length === 0 ? (
          <View style={styles.emptyGoal}>
            <ThemedText type="small" themeColor="muted">
              Belum ada Goal.
            </ThemedText>
          </View>
        ) : (
          goals.map((goal) => {
            const saved = wallets.find((wallet) => wallet.id === goal.walletId)?.balance ?? 0;
            const achieved = saved >= goal.targetAmount;
            return (
              <View key={goal.id} style={[styles.goal, { borderBottomColor: theme.line }]}>
                <View style={styles.planItemTop}>
                  <View style={[styles.categoryIcon, { backgroundColor: theme.mint }]}>
                    <ThemedText style={{ color: theme.gold }}>✦</ThemedText>
                  </View>
                  <View style={styles.itemCopy}>
                    <ThemedText type="smallBold" style={styles.itemName}>
                      {goal.name}
                    </ThemedText>
                    <ThemedText type="small" themeColor="muted" style={styles.itemSubtitle}>
                      Kontribusi bulanan {formatMoney(goal.monthlyContribution)}
                    </ThemedText>
                  </View>
                  <ThemedText
                    type="code"
                    style={[styles.itemValueText, { color: achieved ? theme.income : theme.gold }]}
                  >
                    {formatMoney(saved)} / {formatMoney(goal.targetAmount)}
                  </ThemedText>
                </View>
                <Progress
                  value={Math.min((saved / goal.targetAmount) * 100, 100)}
                  color={achieved ? theme.income : theme.gold}
                  theme={theme}
                />
                <ThemedText type="small" themeColor="muted" style={styles.goalStatus}>
                  {achieved ? 'Tercapai' : `Target ${formatMoney(goal.targetAmount)}`}
                </ThemedText>
                <View style={styles.goalActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Edit Goal ${goal.name}`}
                    onPress={() => setEditor(goal)}
                  >
                    <ThemedText type="smallBold" themeColor="pine" style={styles.goalActionText}>
                      Edit
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Nabung ke Goal ${goal.name}`}
                    onPress={() => void onSaveAction?.(goal)}
                  >
                    <ThemedText type="smallBold" themeColor="pine" style={styles.goalActionText}>
                      Nabung
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Tarik dana darurat ${goal.name}`}
                    onPress={() =>
                      setConfirmation({
                        title: 'Penarikan darurat?',
                        message: `Saldo ${formatMoney(saved)} akan ditarik dari Wallet Goal.`,
                        confirmLabel: 'Tarik',
                        onConfirm: () => onWithdraw?.(goal, saved),
                      })
                    }
                  >
                    <ThemedText
                      type="smallBold"
                      style={[styles.goalActionText, { color: theme.expense }]}
                    >
                      Tarik
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Arsipkan Goal ${goal.name}`}
                    onPress={() =>
                      setConfirmation({
                        title: 'Arsipkan Goal?',
                        message: 'Goal dan riwayatnya tetap tersimpan.',
                        confirmLabel: 'Arsipkan',
                        onConfirm: () => onArchive?.(goal),
                      })
                    }
                  >
                    <ThemedText
                      type="smallBold"
                      style={[styles.goalActionText, { color: theme.expense }]}
                    >
                      Arsipkan
                    </ThemedText>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </PlanSection>
      {editor && (
        <GoalFormModal
          goal={editor === 'new' ? null : editor}
          wallets={activeWallets}
          theme={theme}
          onClose={() => setEditor(null)}
          onSave={async (draft) => {
            await onSave?.(editor === 'new' ? null : editor, draft);
            setEditor(null);
          }}
        />
      )}
      <ConfirmationModal
        visible={confirmation !== null}
        title={confirmation?.title ?? ''}
        message={confirmation?.message ?? ''}
        confirmLabel={confirmation?.confirmLabel ?? 'Konfirmasi'}
        destructive
        onCancel={() => setConfirmation(null)}
        onConfirm={async () => {
          const action = confirmation?.onConfirm;
          setConfirmation(null);
          await action?.();
        }}
      />
    </>
  );
}

function GoalFormModal({
  goal,
  wallets,
  theme,
  onClose,
  onSave,
}: {
  goal: Goal | null;
  wallets: Wallet[];
  theme: ReturnType<typeof useTheme>;
  onClose: () => void;
  onSave: (draft: GoalDraft) => void | Promise<void>;
}) {
  const [name, setName] = useState(goal?.name ?? '');
  const [target, setTarget] = useState(goal ? formatMoneyInput(goal.targetAmount) : '');
  const [targetDate, setTargetDate] = useState(goal?.targetDate ?? '');
  const [monthly, setMonthly] = useState(goal ? formatMoneyInput(goal.monthlyContribution) : '');
  const [walletId, setWalletId] = useState(goal?.walletId ?? wallets[0]?.id ?? null);
  const submit = () => {
    const targetAmount = parseMoneyInput(target);
    if (!name.trim() || !walletId || !targetAmount || targetAmount < 1) return;
    void onSave({
      name: name.trim(),
      targetAmount,
      targetDate: targetDate.trim() || null,
      walletId,
      monthlyContribution: parseMoneyInput(monthly) || 0,
    });
  };
  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: theme.overlay }]} onPress={onClose}>
        <KeyboardAvoidingView
          style={styles.sheetKeyboard}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <View style={[styles.goalSheet, { backgroundColor: theme.card }]}>
            <View style={styles.sheetHeader}>
              <ThemedText type="sectionHeading">{goal ? 'Edit Goal' : 'Goal baru'}</ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tutup form Goal"
                onPress={onClose}
              >
                <ThemedText type="subtitle" themeColor="muted">
                  ×
                </ThemedText>
              </Pressable>
            </View>
            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.goalSheetContent}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets
              keyboardDismissMode="interactive"
            >
              <ThemedText type="small" themeColor="muted">
                Progress Goal selalu mengikuti saldo Wallet tabungan.
              </ThemedText>
              <ThemedText type="code" themeColor="muted" style={styles.fieldLabel}>
                NAMA GOAL
              </ThemedText>
              <ThemedInput
                accessibilityLabel="Nama Goal"
                placeholder="Mis. Dana Nikah"
                value={name}
                onChangeText={setName}
                style={styles.goalInput}
              />
              <ThemedText type="code" themeColor="muted" style={styles.fieldLabel}>
                TARGET NOMINAL
              </ThemedText>
              <View style={styles.moneyInputRow}>
                <CurrencyMark />
                <ThemedInput
                  accessibilityLabel="Target Goal"
                  keyboardType="numeric"
                  placeholder="0"
                  value={target}
                  onChangeText={(value) => setTarget(formatMoneyInput(value))}
                  style={[styles.goalInput, styles.moneyInput]}
                />
              </View>
              <ThemedText type="code" themeColor="muted" style={styles.fieldLabel}>
                WALLET GOAL
              </ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.goalWallets}
              >
                {wallets.map((wallet) => (
                  <Pressable
                    key={wallet.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Wallet Goal ${wallet.name}`}
                    onPress={() => setWalletId(wallet.id)}
                    style={[
                      styles.goalWallet,
                      {
                        borderColor: walletId === wallet.id ? theme.pine : theme.line,
                        backgroundColor: walletId === wallet.id ? theme.mint : theme.card,
                      },
                    ]}
                  >
                    <ThemedText type="smallBold">{wallet.name}</ThemedText>
                    <ThemedText type="small" themeColor="muted">
                      {formatMoney(wallet.balance)}
                    </ThemedText>
                  </Pressable>
                ))}
              </ScrollView>
              <ThemedText type="code" themeColor="muted" style={styles.fieldLabel}>
                TANGGAL TARGET{' '}
                <ThemedText type="small" themeColor="muted">
                  (opsional)
                </ThemedText>
              </ThemedText>
              <ThemedInput
                accessibilityLabel="Tanggal target Goal"
                placeholder="YYYY-MM-DD"
                value={targetDate}
                onChangeText={setTargetDate}
                style={styles.goalInput}
              />
              <ThemedText type="code" themeColor="muted" style={styles.fieldLabel}>
                KONTRIBUSI BULANAN
              </ThemedText>
              <View style={styles.moneyInputRow}>
                <CurrencyMark />
                <ThemedInput
                  accessibilityLabel="Kontribusi bulanan Goal"
                  keyboardType="numeric"
                  placeholder="0"
                  value={monthly}
                  onChangeText={(value) => setMonthly(formatMoneyInput(value))}
                  style={[styles.goalInput, styles.moneyInput]}
                />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Simpan Goal"
                onPress={submit}
                style={[styles.saveGoal, { backgroundColor: theme.pine }]}
              >
                <ThemedText type="smallBold" style={{ color: theme.heroText }}>
                  {goal ? 'Simpan perubahan' : 'Simpan Goal'}
                </ThemedText>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

function PlanItem(props: {
  item: BudgetPlanItem;
  category?: Category;
  state?: PlanItemState;
  action: string;
  color: string;
  theme: ReturnType<typeof useTheme>;
  onAction: (item: BudgetPlanItem) => void;
  onPayment?: (item: BudgetPlanItem, paid: boolean) => void | Promise<void>;
  onEdit: () => void;
  onDelete?: (item: BudgetPlanItem) => void | Promise<void>;
}) {
  const [confirmation, setConfirmation] = useState(false);
  return (
    <>
      <PlanItemContent {...props} onRequestDelete={() => setConfirmation(true)} />
      <ConfirmationModal
        visible={confirmation}
        title="Hapus item plan?"
        message={`${props.item.name} dan targetnya akan dihapus dari Budget plan.`}
        confirmLabel="Hapus"
        destructive
        onCancel={() => setConfirmation(false)}
        onConfirm={async () => {
          setConfirmation(false);
          await props.onDelete?.(props.item);
        }}
      />
    </>
  );
}

function PlanItemContent({
  item,
  category,
  state,
  action,
  color,
  theme,
  onAction,
  onPayment,
  onEdit,
  onRequestDelete,
}: {
  item: BudgetPlanItem;
  category?: Category;
  state?: PlanItemState;
  action: string;
  color: string;
  theme: ReturnType<typeof useTheme>;
  onAction: (item: BudgetPlanItem) => void;
  onPayment?: (item: BudgetPlanItem, paid: boolean) => void | Promise<void>;
  onEdit: () => void;
  onRequestDelete: () => void;
}) {
  const amount = state?.realizedAmount ?? 0;
  const income = item.type === 'income';
  const paid = !income && !item.isAutomatic && amount >= item.targetAmount;
  const progress = state?.progressPercent ?? 0;
  return (
    <View style={[styles.item, { borderBottomColor: theme.line }]}>
      <View style={styles.planItemTop}>
        <View
          style={[
            styles.categoryIcon,
            { backgroundColor: income ? theme.incomeBackground : theme.expenseBackground },
          ]}
        >
          <CategoryIcon name={category?.icon} color={income ? theme.income : theme.expense} />
        </View>
        <View style={styles.itemCopy}>
          <ThemedText type="smallBold" style={styles.itemName}>
            {item.name}
          </ThemedText>
          <ThemedText type="small" themeColor="muted" style={styles.itemSubtitle}>
            {income ? 'Dari transaksi' : paid ? 'Sudah dibayar' : 'Belum dibayar'}
          </ThemedText>
        </View>
        <ThemedText
          type="code"
          style={[styles.itemValueText, { color: income ? theme.income : theme.ink }]}
        >
          {income
            ? formatMoney(amount)
            : `${formatMoney(amount)} / ${formatMoney(item.targetAmount)}`}
        </ThemedText>
      </View>
      {!income && <Progress value={progress} color={paid ? theme.income : color} theme={theme} />}
      <View style={styles.itemActions}>
        {!income && !item.isAutomatic && (
          <Pressable
            accessibilityRole="switch"
            accessibilityLabel={`${paid ? 'Tandai belum dibayar' : 'Tandai sudah dibayar'} ${item.name}`}
            accessibilityState={{ checked: paid }}
            onPress={() => void onPayment?.(item, !paid)}
            hitSlop={8}
            style={styles.itemAction}
          >
            <ThemedText
              type="smallBold"
              style={[styles.itemActionText, { color: paid ? theme.income : color }]}
            >
              {paid ? 'Sudah dibayar' : 'Belum dibayar'}
            </ThemedText>
          </Pressable>
        )}
        {action && !income && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${action} ${item.name}`}
            onPress={() => onAction(item)}
            hitSlop={8}
            style={styles.itemAction}
          >
            <ThemedText type="smallBold" style={[styles.itemActionText, { color }]}>
              {action} →
            </ThemedText>
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit ${item.name}`}
          onPress={onEdit}
          hitSlop={8}
          style={styles.itemAction}
        >
          <ThemedText type="smallBold" themeColor="pine" style={styles.itemActionText}>
            Edit
          </ThemedText>
        </Pressable>
        {!item.isAutomatic && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Hapus ${item.name}`}
            onPress={onRequestDelete}
            hitSlop={8}
            style={styles.itemAction}
          >
            <ThemedText type="smallBold" style={[styles.itemActionText, { color: theme.expense }]}>
              Hapus
            </ThemedText>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function LegacyPlanItem({
  item,
  category,
  state,
  action,
  color,
  theme,
  onAction,
  onEdit,
  onDelete,
}: {
  item: BudgetPlanItem;
  category?: Category;
  state?: PlanItemState;
  action: string;
  color: string;
  theme: ReturnType<typeof useTheme>;
  onAction: (item: BudgetPlanItem) => void;
  onEdit: () => void;
  onDelete?: (item: BudgetPlanItem) => void | Promise<void>;
}) {
  const progress = state?.progressPercent ?? 0;
  const amountLabel = state?.realizedAmount ?? 0;
  const subtitle = item.isAutomatic
    ? 'Dari transaksi'
    : item.type === 'income'
      ? 'Realisasi dari transaksi'
      : state?.overBudget
        ? 'Melebihi Budget'
        : 'Sisa budget';
  const iconBackground = item.type === 'income' ? theme.incomeBackground : theme.expenseBackground;
  const iconColor = item.type === 'income' ? theme.income : theme.expense;
  const displayAmount =
    item.targetAmount > 0
      ? `${formatMoney(amountLabel)} / ${formatMoney(item.targetAmount)}`
      : formatMoney(amountLabel);
  const confirmDelete = () => undefined;
  if (item.type === 'income')
    return (
      <View style={[styles.item, { borderBottomColor: theme.line }]}>
        <View style={styles.planItemTop}>
          <View style={[styles.categoryIcon, { backgroundColor: iconBackground }]}>
            <ThemedText style={{ color: iconColor }}>{category?.icon ?? '◈'}</ThemedText>
          </View>
          <View style={styles.itemCopy}>
            <ThemedText type="smallBold" style={styles.itemName}>
              {item.name}
            </ThemedText>
            <ThemedText type="small" themeColor="muted" style={styles.itemSubtitle}>
              {item.isAutomatic ? 'Dari transaksi' : 'Realisasi dari transaksi'}
            </ThemedText>
          </View>
          <ThemedText type="code" style={[styles.itemValueText, { color: theme.income }]}>
            {formatMoney(amountLabel)}
          </ThemedText>
        </View>
        <View style={styles.itemActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Edit ${item.name}`}
            onPress={onEdit}
            hitSlop={8}
            style={styles.itemAction}
          >
            <ThemedText type="smallBold" themeColor="pine" style={styles.itemActionText}>
              Edit
            </ThemedText>
          </Pressable>
          {!item.isAutomatic && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Hapus ${item.name}`}
              onPress={confirmDelete}
              hitSlop={8}
              style={styles.itemAction}
            >
              <ThemedText
                type="smallBold"
                style={[styles.itemActionText, { color: theme.expense }]}
              >
                Hapus
              </ThemedText>
            </Pressable>
          )}
        </View>
      </View>
    );
  return (
    <View style={[styles.item, { borderBottomColor: theme.line }]}>
      <View style={styles.planItemTop}>
        <View style={[styles.categoryIcon, { backgroundColor: iconBackground }]}>
          <ThemedText style={{ color: iconColor }}>{category?.icon ?? '◈'}</ThemedText>
        </View>
        <View style={styles.itemCopy}>
          <ThemedText type="smallBold" style={styles.itemName}>
            {item.name}
          </ThemedText>
          <ThemedText
            type="small"
            themeColor="muted"
            style={[styles.itemSubtitle, state?.overBudget && { color: theme.expense }]}
          >
            {subtitle}
          </ThemedText>
        </View>
        <ThemedText
          type="code"
          style={[styles.itemValueText, { color: state?.overBudget ? theme.expense : theme.ink }]}
        >
          {formatMoney(amountLabel)} / {formatMoney(item.targetAmount)}
        </ThemedText>
      </View>
      <Progress value={progress} color={state?.overBudget ? theme.expense : color} theme={theme} />
      <View style={styles.itemActions}>
        {action && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${action} ${item.name}`}
            onPress={() => onAction(item)}
            hitSlop={8}
            style={styles.itemAction}
          >
            <ThemedText type="smallBold" style={[styles.itemActionText, { color }]}>
              {action} →
            </ThemedText>
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit ${item.name}`}
          onPress={onEdit}
          hitSlop={8}
          style={styles.itemAction}
        >
          <ThemedText type="smallBold" themeColor="pine" style={styles.itemActionText}>
            Edit
          </ThemedText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Hapus ${item.name}`}
          onPress={confirmDelete}
          hitSlop={8}
          style={styles.itemAction}
        >
          <ThemedText type="smallBold" style={[styles.itemActionText, { color: theme.expense }]}>
            Hapus
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

function Progress({
  value,
  color,
  theme,
}: {
  value: number;
  color: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.min(Math.max(value, 0), 100) }}
      style={[styles.progress, { backgroundColor: theme.line }]}
    >
      <View
        style={[styles.progressFill, { backgroundColor: color, width: `${Math.min(value, 100)}%` }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    alignSelf: 'center',
    maxWidth: 430,
    paddingBottom: 104,
    paddingHorizontal: 21,
    paddingTop: 24,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  eyebrow: { ...Typography.eyebrow },
  title: {
    fontFamily: Fonts.serifSemiBold,
    fontSize: 29,
    lineHeight: 31,
    letterSpacing: -1.16,
    marginBottom: 5,
  },
  aiButton: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  aiButtonText: { fontSize: 11, lineHeight: 14 },
  periodLabel: { fontSize: 11, lineHeight: 14 },
  dropdown: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  available: { marginBottom: 17 },
  spare: {
    alignItems: 'center',
    borderRadius: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    padding: 18,
  },
  spareCopy: { flex: 1 },
  spareLabel: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 16, marginBottom: 3 },
  spareAmount: { fontFamily: Fonts.serifBold, fontSize: 26, lineHeight: 29, letterSpacing: -1.04 },
  spareNote: { fontFamily: Fonts.sans, fontSize: 9, lineHeight: 13 },
  calmRing: {
    alignItems: 'center',
    borderRadius: 25,
    borderWidth: 5,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  section: { marginBottom: 28 },
  sectionTitle: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    marginHorizontal: 2,
  },
  card: { borderTopWidth: 1, paddingBottom: 1, paddingTop: 19 },
  item: { paddingVertical: 14 },
  planItemTop: { alignItems: 'center', flexDirection: 'row', gap: 9 },
  itemHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  categoryIcon: {
    alignItems: 'center',
    borderRadius: 12,
    height: 35,
    justifyContent: 'center',
    width: 35,
  },
  itemCopy: { flex: 1, minWidth: 0 },
  itemName: { fontSize: 12, lineHeight: 16 },
  itemSubtitle: { fontSize: 10, lineHeight: 14, marginTop: 2 },
  itemValueText: { flexShrink: 0, fontSize: 10, lineHeight: 14, letterSpacing: -0.4 },
  itemAction: { alignSelf: 'flex-end', marginTop: 1 },
  itemActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'flex-end',
    marginTop: 6,
  },
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
  sheetKeyboard: { flex: 1, justifyContent: 'flex-end' },
  sheetScroll: { flexGrow: 1 },
  goalSheetContent: { gap: 8, paddingBottom: 4 },
  sheet: { borderTopLeftRadius: 27, borderTopRightRadius: 27, gap: 8, padding: 21 },
  goalSheet: {
    borderTopLeftRadius: 27,
    borderTopRightRadius: 27,
    gap: 8,
    maxHeight: '90%',
    padding: 21,
  },
  sheetHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  categoryEditorHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 28,
  },
  categoryLabelRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sheetOption: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 15 },
  fieldLabel: { ...Typography.eyebrow, marginTop: 8 },
  goalInput: { borderBottomWidth: 1, fontSize: 16, minHeight: 44, paddingHorizontal: 8 },
  moneyInputRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  moneyInput: { flex: 1 },
  goalWallets: { gap: 8, paddingVertical: 4 },
  goalWallet: { borderRadius: 12, borderWidth: 1, gap: 2, minWidth: 120, padding: 10 },
  inlineCategoryEditor: {
    alignSelf: 'stretch',
    borderRadius: 13,
    borderWidth: 1,
    gap: 8,
    marginTop: 4,
    padding: 11,
    width: '100%',
  },
  planIconScroll: { maxHeight: 196, width: '100%' },
  planIconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    justifyContent: 'flex-start',
    width: '100%',
  },
  planIconChoice: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    height: 39,
    justifyContent: 'center',
    width: '18%',
  },
  planSaveCategory: {
    alignItems: 'center',
    borderRadius: Radius.medium,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
    width: '100%',
  },
  saveGoal: { alignItems: 'center', borderRadius: 13, marginTop: 8, padding: 13 },
  loading: { alignItems: 'center', paddingVertical: 35 },
  loadingGlyph: { fontSize: 28, marginBottom: 12 },
  suggestion: {
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 15,
  },
  suggestionText: { flex: 1 },
  closeSheet: {
    alignItems: 'center',
    borderRadius: 13,
    marginTop: 8,
    padding: 13,
  },
});
