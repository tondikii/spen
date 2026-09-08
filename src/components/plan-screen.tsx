import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';

import { BudgetPeriodPicker } from '@/components/budget-period-picker';
import { CATEGORY_ICON_CHOICES, CategoryIcon } from '@/components/category-icon';
import { ConfirmationModal } from '@/components/confirmation-modal';
import { FinanceHeroCard } from '@/components/finance-hero-card';
import { FieldLabel, MoneyField } from '@/components/form-fields';
import {
  MotionAnimatedView,
  MotionProgressBar,
  MotionPulse,
  MotionScreen,
  MotionPressable as Pressable,
  motionPresets,
} from '@/components/motion';
import { SheetModal } from '@/components/sheet-modal';
import { MonthCalendar } from '@/components/month-calendar';
import { WalletPicker } from '@/components/wallet-picker';
import { ThemedInput } from '@/components/themed-input';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import i18n from '@/i18n';
import { getCategoryLabel } from '@/i18n/categories';
import { formatDate } from '@/i18n/format';
import { chunk } from '@/lib/array';
import { getErrorTranslationKey } from '@/lib/app-error';
import { todayISO } from '@/lib/date';
import { formatMoney } from '@/lib/money';
import { formatMoneyInput, parseMoneyInput } from '@/lib/money-input';
import { aiService, type BudgetAIInput, type BudgetSuggestion } from '@/services/ai-service';
import { getDatabasePlanView, type PlanItemDraft } from '@/services/plan-service';
import type { BudgetPlanItem, Category, Goal, PlanItemType, Wallet } from '@/types/domain';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

type PlanView = Awaited<ReturnType<typeof getDatabasePlanView>>;
type PlanItemState = { realizedAmount: number; progressPercent: number; overBudget: boolean };
type GoalDraft = Omit<Goal, 'id' | 'archived'>;
type Confirmation = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
};

type PlanAction = {
  icon?: string;
  label: string;
  onPress: () => void | Promise<void>;
  tone?: 'default' | 'danger' | 'primary';
};

function PlanSummaryCard({ snapshot }: { snapshot: PlanView['snapshot'] }) {
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

function PlanScreenContent({
  planView,
  categories,
  onPeriodStartDayChange,
  onItemAction,
  onPlanItemSave,
  onPlanItemDelete,
  onCategorySave,
  onGoalSave,
  onGoalArchive,
  onGoalAllocate,
  onGoalWithdraw,
  aiInput,
  onSuggestionApply,
}: {
  planView: PlanView;
  categories: Category[];
  onPeriodStartDayChange: (day: number) => void | Promise<void>;
  onItemAction: (
    item: BudgetPlanItem,
    amount: number,
    walletId: string,
    date: string,
  ) => void | Promise<void>;
  onPlanItemSave: (item: BudgetPlanItem | null, draft: PlanItemDraft) => void | Promise<void>;
  onPlanItemDelete: (item: BudgetPlanItem) => void | Promise<void>;
  onCategorySave: (category: Category) => Category | Promise<Category>;
  onGoalSave: (goal: Goal | null, draft: GoalDraft) => void | Promise<void>;
  onGoalArchive: (goal: Goal) => void | Promise<void>;
  onGoalAllocate: (goal: Goal, amount: number) => void | Promise<void>;
  onGoalWithdraw: (goal: Goal, amount: number) => void | Promise<void>;
  aiInput?: BudgetAIInput;
  onSuggestionApply: (suggestion: BudgetSuggestion) => void | Promise<void>;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  const { snapshot, plan, goals, wallets, period, startDay: configuredStartDay } = planView;
  const [startDay, setStartDay] = useState(configuredStartDay);
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
  const [expensePaymentEditor, setExpensePaymentEditor] = useState<BudgetPlanItem | null>(null);
  const [goalSavingEditor, setGoalSavingEditor] = useState<Goal | null>(null);
  const [dismissSignal, setDismissSignal] = useState(0);
  const [openMenuSection, setOpenMenuSection] = useState<'income' | 'expense' | 'goal' | null>(
    null,
  );
  const updateMenuSection = useCallback((section: 'income' | 'expense' | 'goal', open: boolean) => {
    setOpenMenuSection(open ? section : null);
  }, []);
  const handleIncomeMenuOpenChange = useCallback(
    (open: boolean) => updateMenuSection('income', open),
    [updateMenuSection],
  );
  const handleExpenseMenuOpenChange = useCallback(
    (open: boolean) => updateMenuSection('expense', open),
    [updateMenuSection],
  );
  const handleGoalMenuOpenChange = useCallback(
    (open: boolean) => updateMenuSection('goal', open),
    [updateMenuSection],
  );

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
        .suggestBudget({
          ...(aiInput ?? {
            spareBudget: snapshot.spareBudget,
            totalIncome: snapshot.totalIncome,
            fixedExpense: 0,
            goalContributions: 0,
            netSaving: snapshot.netSaving,
          }),
          locale,
        })
        .then((result) => {
          if (cancelled) return;
          setSuggestions(result.suggestions);
          setAiSource(result.source);
          setAiLoading(false);
        })
        .catch((cause) => {
          if (!cancelled) {
            setAiError(t(getErrorTranslationKey(cause)));
            setAiLoading(false);
          }
        });
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    aiInput,
    aiOpen,
    locale,
    snapshot.goalBalance,
    snapshot.netSaving,
    snapshot.spareBudget,
    snapshot.totalIncome,
    t,
  ]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const itemState = (item: BudgetPlanItem) =>
    snapshot.planItems.find((state) => state.itemId === item.id);
  const handleItemAction = (item: BudgetPlanItem) => {
    if (item.type === 'expense') setExpensePaymentEditor(item);
  };

  const applySuggestion = async (suggestion: BudgetSuggestion) => {
    try {
      await onSuggestionApply(suggestion);
      setApplied((current) =>
        current.includes(suggestion.title) ? current : [...current, suggestion.title],
      );
    } catch (cause) {
      setAiError(t(getErrorTranslationKey(cause)));
    }
  };

  return (
    <ThemedView style={styles.page} onTouchStart={() => setDismissSignal((current) => current + 1)}>
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
              {t('common.plan')}
            </ThemedText>
            <BudgetPeriodPicker
              period={period}
              startDay={startDay}
              dismissSignal={dismissSignal}
              onStartDayChange={(day) => {
                setStartDay(day);
                return onPeriodStartDayChange(day);
              }}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.aiSuggestion')}
            accessibilityHint={t('common.aiSuggestion')}
            onPress={() => setAiOpen(true)}
            wrapperStyle={styles.aiAction}
            style={[styles.aiButton, { borderColor: theme.line, backgroundColor: theme.mint }]}
          >
            <ThemedText
              type="smallBold"
              themeColor="pine"
              style={styles.aiButtonText}
              numberOfLines={1}
            >
              ✦ {t('common.aiSuggestion')}
            </ThemedText>
          </Pressable>
        </View>
        <PlanSummaryCard snapshot={snapshot} />
        <PlanSection
          title={t('common.incomePlan')}
          action={t('common.add')}
          theme={theme}
          menuOpen={openMenuSection === 'income'}
          onAction={() => setPlanItemEditor({ type: 'income' })}
        >
          {plan.incomeItems.length ? (
            plan.incomeItems.map((item) => (
              <PlanItem
                key={item.id}
                item={item}
                category={categories.find((category) => category.id === item.categoryId)}
                state={itemState(item)}
                action={'isAutomatic' in item && item.isAutomatic ? '' : t('common.addTransaction')}
                color={theme.income}
                theme={theme}
                onAction={handleItemAction}
                onEdit={() => setPlanItemEditor({ type: item.type, item })}
                onDelete={onPlanItemDelete}
                onMenuOpenChange={handleIncomeMenuOpenChange}
                dismissSignal={dismissSignal}
              />
            ))
          ) : (
            <EmptyPlan message={t('common.noIncomePlan')} />
          )}
        </PlanSection>
        <PlanSection
          title={t('common.expensePlan')}
          action={t('common.add')}
          theme={theme}
          menuOpen={openMenuSection === 'expense'}
          testID="plan-section-expense"
          onAction={() => setPlanItemEditor({ type: 'expense' })}
        >
          {plan.expenseItems.length ? (
            plan.expenseItems.map((item) => (
              <PlanItem
                key={item.id}
                item={item}
                category={categories.find((category) => category.id === item.categoryId)}
                state={itemState(item)}
                action={
                  itemState(item)?.progressPercent && itemState(item)!.progressPercent >= 100
                    ? ''
                    : t('common.pay')
                }
                color={theme.expense}
                theme={theme}
                onAction={handleItemAction}
                onEdit={() => setPlanItemEditor({ type: item.type, item })}
                onDelete={onPlanItemDelete}
                onMenuOpenChange={handleExpenseMenuOpenChange}
                dismissSignal={dismissSignal}
              />
            ))
          ) : (
            <EmptyPlan message={t('common.noExpensePlan')} />
          )}
        </PlanSection>
        <GoalSection
          goals={goals}
          wallets={wallets}
          theme={theme}
          onSave={onGoalSave}
          onArchive={onGoalArchive}
          onOpenSaveAction={setGoalSavingEditor}
          onWithdraw={onGoalWithdraw}
          menuOpen={openMenuSection === 'goal'}
          onMenuOpenChange={handleGoalMenuOpenChange}
          dismissSignal={dismissSignal}
        />
      </ScrollView>
      {planItemEditor && (
        <PlanItemFormModal
          item={planItemEditor.item}
          type={planItemEditor.type}
          categories={categories}
          wallets={wallets}
          minDate={period.startDate}
          theme={theme}
          onCategorySave={onCategorySave}
          onClose={() => setPlanItemEditor(null)}
          onSave={async (draft) => {
            await onPlanItemSave(planItemEditor.item ?? null, draft);
            setPlanItemEditor(null);
          }}
        />
      )}
      {expensePaymentEditor && (
        <PlanPaymentModal
          title={t('common.planPaymentTitle', { name: expensePaymentEditor.name })}
          amount={Math.max(
            expensePaymentEditor.targetAmount -
              (itemState(expensePaymentEditor)?.realizedAmount ?? 0),
            0,
          )}
          wallets={wallets}
          showWalletPicker
          minDate={period.startDate}
          theme={theme}
          onClose={() => setExpensePaymentEditor(null)}
          onSubmit={async (amount, walletId, date) => {
            if (!walletId) return;
            await onItemAction(expensePaymentEditor, amount, walletId, date ?? todayISO());
            setExpensePaymentEditor(null);
          }}
        />
      )}
      {goalSavingEditor && (
        <PlanPaymentModal
          title={t('common.goalSavingTitle', { name: goalSavingEditor.name })}
          amount={0}
          wallets={[]}
          showWalletPicker={false}
          theme={theme}
          onClose={() => setGoalSavingEditor(null)}
          onSubmit={async (amount, walletId) => {
            await onGoalAllocate(goalSavingEditor, amount);
            setGoalSavingEditor(null);
          }}
        />
      )}
      <Modal
        transparent
        animationType="slide"
        visible={aiOpen}
        onRequestClose={() => setAiOpen(false)}
      >
        <Pressable
          wrapperStyle={{ flex: 1 }}
          style={[styles.overlay, { backgroundColor: theme.overlay }]}
          onPress={() => setAiOpen(false)}
        >
          <MotionAnimatedView
            entering={motionPresets.itemEntering}
            style={[styles.sheet, { backgroundColor: theme.card }]}
          >
            <ThemedText type="sectionHeading">✦ {t('common.aiSuggestion')}</ThemedText>
            {aiLoading ? (
              <MotionPulse style={styles.loading}>
                <ThemedText style={[styles.loadingGlyph, { color: theme.pine }]}>✦</ThemedText>
                <ThemedText type="smallBold">{t('common.aiReading')}</ThemedText>
                <ThemedText type="small" themeColor="muted">
                  {t('common.holdOn')}
                </ThemedText>
              </MotionPulse>
            ) : (
              <>
                {aiSource === 'fallback' && (
                  <ThemedText type="small" themeColor="muted">
                    {t('common.aiUnavailablePlan')}
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
                      accessibilityLabel={t('common.applySuggestion', { title: suggestion.title })}
                      onPress={() => void applySuggestion(suggestion)}
                    >
                      <ThemedText
                        type="smallBold"
                        themeColor={applied.includes(suggestion.title) ? 'income' : 'pine'}
                      >
                        {applied.includes(suggestion.title)
                          ? `✓ ${t('common.applied')}`
                          : t('common.apply')}
                      </ThemedText>
                    </Pressable>
                  </View>
                ))}
              </>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.closeSuggestion')}
              onPress={() => setAiOpen(false)}
              style={[styles.closeSheet, { backgroundColor: theme.pine }]}
            >
              <ThemedText type="smallBold" style={{ color: theme.heroText }}>
                {t('common.understand')}
              </ThemedText>
            </Pressable>
          </MotionAnimatedView>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

function PlanSection({
  title,
  action,
  children,
  theme,
  onAction,
  testID,
  menuOpen = false,
}: {
  title: string;
  action: string;
  children: ReactNode;
  theme: ReturnType<typeof useTheme>;
  onAction?: () => void;
  testID?: string;
  menuOpen?: boolean;
}) {
  return (
    <MotionAnimatedView
      entering={motionPresets.itemEntering}
      layout={motionPresets.layout}
      style={[styles.section, menuOpen && styles.sectionMenuOpen]}
      testID={testID}
    >
      <View style={styles.sectionTitle}>
        <ThemedText type="sectionHeading">{title}</ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${action} ${title}`}
          hitSlop={8}
          onPress={onAction}
        >
          <ThemedText type="smallBold" themeColor="pine">
            {action}
          </ThemedText>
        </Pressable>
      </View>
      <View style={styles.card}>{children}</View>
    </MotionAnimatedView>
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
  const theme = useTheme();
  return (
    <MotionScreen>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.paper }]}>
        <PlanScreenContent {...props} />
      </SafeAreaView>
    </MotionScreen>
  );
}

function PlanActionMenu({
  label,
  actions,
  theme,
  onOpenChange,
  dismissSignal = 0,
}: {
  label: string;
  actions: PlanAction[];
  theme: ReturnType<typeof useTheme>;
  onOpenChange?: (open: boolean) => void;
  dismissSignal?: number;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  /* eslint-disable react-hooks/set-state-in-effect -- dismissSignal closes an external menu. */
  useEffect(() => {
    setOpen(false);
    onOpenChange?.(false);
  }, [dismissSignal, onOpenChange]);
  /* eslint-enable react-hooks/set-state-in-effect */
  return (
    <View style={[styles.actionMenuAnchor, open && styles.actionMenuAnchorOpen]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t('common.moreActions')} ${label}`}
        accessibilityState={{ expanded: open }}
        onTouchStart={(event) => event.stopPropagation()}
        onPress={() => {
          setOpen((current) => {
            onOpenChange?.(!current);
            return !current;
          });
        }}
        style={styles.kebabButton}
        hitSlop={8}
      >
        <ThemedText type="subtitle" themeColor="muted" style={styles.kebabGlyph}>
          •••
        </ThemedText>
      </Pressable>
      {open && (
        <MotionAnimatedView
          entering={motionPresets.itemEntering}
          onTouchStart={(event) => event.stopPropagation()}
          style={[styles.actionMenu, { backgroundColor: theme.card, borderColor: theme.line }]}
        >
          {actions.map((action) => (
            <Pressable
              key={action.label}
              accessibilityRole="button"
              accessibilityLabel={`${action.label} ${label}`}
              onPress={() => {
                setOpen(false);
                onOpenChange?.(false);
                void action.onPress();
              }}
              onTouchStart={(event) => event.stopPropagation()}
              style={[styles.actionMenuItem, { borderBottomColor: theme.line }]}
            >
              <ThemedText
                type="smallBold"
                style={{ color: action.tone === 'danger' ? theme.expense : theme.ink }}
              >
                {action.label}
              </ThemedText>
            </Pressable>
          ))}
        </MotionAnimatedView>
      )}
    </View>
  );
}

function PlanPaymentModal({
  title,
  amount: initialAmount,
  wallets,
  minDate,
  showWalletPicker,
  theme,
  onClose,
  onSubmit,
}: {
  title: string;
  amount: number;
  wallets: Wallet[];
  showWalletPicker: boolean;
  minDate?: string;
  theme: ReturnType<typeof useTheme>;
  onClose: () => void;
  onSubmit: (amount: number, walletId?: string, date?: string) => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const activeWallets = wallets
    .filter((wallet) => !wallet.archived)
    .sort((left, right) => right.balance - left.balance);
  const [amount, setAmount] = useState(initialAmount ? formatMoneyInput(initialAmount) : '');
  const [walletId, setWalletId] = useState(activeWallets[0]?.id ?? null);
  const today = todayISO();
  const [date, setDate] = useState(today);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(today.slice(0, 7));
  const submit = () => {
    const parsedAmount = parseMoneyInput(amount);
    if (parsedAmount <= 0) return;
    if (showWalletPicker) {
      if (!walletId) return;
      void onSubmit(parsedAmount, walletId, date);
    } else {
      void onSubmit(parsedAmount, undefined, date);
    }
  };

  return (
    <SheetModal
      title={title}
      closeLabel={t('common.cancel')}
      onClose={onClose}
      keyboardAvoiding
      sheetStyle={styles.goalSheet}
    >
      <ScrollView
        style={styles.sheetScroll}
        contentContainerStyle={styles.goalSheetContent}
        keyboardShouldPersistTaps="handled"
      >
        <MoneyField
          label={t('common.nominal')}
          value={amount}
          onChangeText={(value) => setAmount(formatMoneyInput(value))}
          accessibilityLabel={t('common.paymentAmount')}
          autoFocus
          inputStyle={styles.goalInput}
        />
        <FieldLabel>{t('common.transactionDate')}</FieldLabel>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.openCalendar')}
          onPress={() => setCalendarOpen((current) => !current)}
          style={[styles.dateButton, { borderColor: theme.line }]}
        >
          <ThemedText type="smallBold">
            {formatDate(date, i18n.language === 'en' ? 'en' : 'id')}
          </ThemedText>
          <ThemedText type="small" themeColor="muted">
            {t('common.openCalendar')}
          </ThemedText>
        </Pressable>
        {calendarOpen && (
          <MonthCalendar
            month={calendarMonth}
            selected={date}
            maxMonth={today.slice(0, 7)}
            onSelect={(candidate) => {
              setDate(candidate);
              setCalendarOpen(false);
            }}
            onMonthChange={setCalendarMonth}
            isDisabled={(candidate) => candidate > today || (minDate ? candidate < minDate : false)}
            selectedVariant="mint"
          />
        )}
        {showWalletPicker && (
          <>
            <FieldLabel>{t('common.sourceWallet')}</FieldLabel>
            <WalletPicker wallets={activeWallets} selected={walletId} onSelect={setWalletId} />
          </>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t(
            showWalletPicker ? 'common.confirmPayment' : 'common.saveGoalMoney',
          )}
          onPress={submit}
          style={[styles.saveGoal, { backgroundColor: theme.pine }]}
        >
          <ThemedText type="smallBold" style={{ color: theme.heroText }}>
            {t(showWalletPicker ? 'common.confirmPayment' : 'common.saveGoalMoney')}
          </ThemedText>
        </Pressable>
      </ScrollView>
    </SheetModal>
  );
}

function PlanItemFormModal({
  item,
  type,
  categories: categoriesProp,
  wallets,
  minDate,
  theme,
  onCategorySave,
  onClose,
  onSave,
}: {
  item?: BudgetPlanItem;
  type: PlanItemType;
  categories: Category[];
  wallets: Wallet[];
  minDate: string;
  theme: ReturnType<typeof useTheme>;
  onCategorySave: (category: Category) => Category | Promise<Category>;
  onClose: () => void;
  onSave: (draft: PlanItemDraft) => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const [categories, setCategories] = useState(categoriesProp);
  const [target, setTarget] = useState(item ? formatMoneyInput(item.targetAmount) : '');
  const [walletId, setWalletId] = useState<string | null>(
    item?.type === 'income' ? (item.walletId ?? wallets[0]?.id ?? null) : (wallets[0]?.id ?? null),
  );
  const transactionToday = todayISO();
  const [incomeDate, setIncomeDate] = useState(transactionToday);
  const [incomeCalendarOpen, setIncomeCalendarOpen] = useState(false);
  const [incomeCalendarMonth, setIncomeCalendarMonth] = useState(transactionToday.slice(0, 7));
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
  const iconRows = useMemo(() => chunk(CATEGORY_ICON_CHOICES, 5), []);
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
    const saved = await onCategorySave(draft);
    setCategories((current) => [...current, saved]);
    setCategoryId(saved.id);
    setCategoryEditorOpen(false);
    setCategoryName('');
  };
  const submit = () => {
    const targetAmount = parseMoneyInput(target);
    if (
      !categoryId ||
      !Number.isSafeInteger(targetAmount) ||
      targetAmount <= 0 ||
      (type === 'income' && !walletId)
    )
      return;
    void onSave({
      type,
      categoryId,
      targetAmount,
      ...(type === 'income' ? { walletId: walletId as string } : {}),
      ...(type === 'income' ? { date: incomeDate } : {}),
    });
  };
  return (
    <SheetModal
      title={item ? t('common.itemPlanEdit') : t('common.itemPlanNew')}
      closeLabel={t('common.closePlanItemForm')}
      onClose={onClose}
      keyboardAvoiding
      sheetStyle={styles.goalSheet}
    >
      <ScrollView
        style={styles.sheetScroll}
        contentContainerStyle={styles.goalSheetContent}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="interactive"
      >
        <ThemedText type="small" themeColor="muted">
          {type === 'income' ? t('common.incomePlanNote') : t('common.expensePlanNote')}
        </ThemedText>
        <MoneyField
          label={type === 'income' ? t('common.nominal') : t('common.targetNominal')}
          value={target}
          onChangeText={(value) => setTarget(formatMoneyInput(value))}
          accessibilityLabel={t('common.targetPlanItem')}
          inputStyle={styles.goalInput}
        />
        {type === 'income' && (
          <>
            <FieldLabel>{t('common.incomeWallet')}</FieldLabel>
            <WalletPicker wallets={wallets} selected={walletId} onSelect={setWalletId} />
            <FieldLabel>{t('common.transactionDate')}</FieldLabel>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.openCalendar')}
              onPress={() => setIncomeCalendarOpen((current) => !current)}
              style={[styles.dateButton, { borderColor: theme.line }]}
            >
              <ThemedText type="smallBold">
                {formatDate(incomeDate, i18n.language === 'en' ? 'en' : 'id')}
              </ThemedText>
              <ThemedText type="small" themeColor="muted">
                {t('common.openCalendar')}
              </ThemedText>
            </Pressable>
            {incomeCalendarOpen && (
              <MonthCalendar
                month={incomeCalendarMonth}
                selected={incomeDate}
                maxMonth={transactionToday.slice(0, 7)}
                onSelect={(candidate) => {
                  setIncomeDate(candidate);
                  setIncomeCalendarOpen(false);
                }}
                onMonthChange={setIncomeCalendarMonth}
                isDisabled={(candidate) => candidate > transactionToday || candidate < minDate}
                selectedVariant="mint"
              />
            )}
          </>
        )}
        <View style={styles.categoryLabelRow}>
          <FieldLabel>{t('common.category')}</FieldLabel>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.addCategoryFromPlan')}
            onPress={() => setCategoryEditorOpen(true)}
          >
            <ThemedText type="smallBold" themeColor="pine">
              {t('common.add')}
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
              wrapperStyle={styles.planCategoryCell}
              accessibilityRole="button"
              accessibilityLabel={t('common.categoryFor', {
                name: getCategoryLabel(category),
              })}
              onPress={() => setCategoryId(category.id)}
              style={[
                styles.planCategoryChoice,
                {
                  borderColor: categoryId === category.id ? theme.pine : theme.line,
                  backgroundColor: categoryId === category.id ? theme.mint : theme.card,
                },
              ]}
            >
              <CategoryIcon name={category.icon} color={theme.pine} size={18} />
              <ThemedText type="smallBold" style={styles.planCategoryName}>
                {getCategoryLabel(category)}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
        {options.length === 0 && (
          <ThemedText type="small" style={{ color: theme.expense }}>
            {t('common.noMatchingCategory')}
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
              <ThemedText type="smallBold">{t('common.addCategory')}</ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.cancelCategoryEdit')}
                onPress={() => {
                  setCategoryEditorOpen(false);
                  setCategoryName('');
                }}
                hitSlop={8}
              >
                <ThemedText type="smallBold" style={{ color: theme.expense }}>
                  {t('common.cancel')}
                </ThemedText>
              </Pressable>
            </View>
            <ThemedInput
              accessibilityLabel={t('common.newCategory')}
              placeholder={t('common.categoryName')}
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
              {iconRows.map((row, rowIndex) => (
                <View key={`plan-icon-row-${rowIndex}`} style={styles.planIconRow}>
                  {row.map((icon) => (
                    <Pressable
                      key={icon}
                      wrapperStyle={styles.planIconCell}
                      accessibilityRole="button"
                      accessibilityLabel={t('common.chooseIcon', { icon })}
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
                </View>
              ))}
            </ScrollView>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.saveCategory')}
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
                {t('common.saveCategory')}
              </ThemedText>
            </Pressable>
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.savePlanItem')}
          onPress={submit}
          style={[styles.saveGoal, { backgroundColor: theme.pine }]}
        >
          <ThemedText type="smallBold" style={{ color: theme.heroText }}>
            {item ? t('common.saveChanges') : t('common.saveItem')}
          </ThemedText>
        </Pressable>
      </ScrollView>
    </SheetModal>
  );
}

function GoalSection({
  goals,
  wallets,
  theme,
  onSave,
  onArchive,
  onOpenSaveAction,
  onWithdraw,
  menuOpen = false,
  onMenuOpenChange,
  dismissSignal = 0,
}: {
  goals: Goal[];
  wallets: Wallet[];
  theme: ReturnType<typeof useTheme>;
  onSave?: (goal: Goal | null, draft: GoalDraft) => void | Promise<void>;
  onArchive?: (goal: Goal) => void | Promise<void>;
  onOpenSaveAction: (goal: Goal) => void;
  onWithdraw?: (goal: Goal, amount: number) => void | Promise<void>;
  menuOpen?: boolean;
  onMenuOpenChange?: (open: boolean) => void;
  dismissSignal?: number;
}) {
  const { t } = useTranslation();
  const [editor, setEditor] = useState<Goal | 'new' | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const openNew = () => setEditor('new');
  const activeWallets = wallets.filter((wallet) => !wallet.archived);
  return (
    <>
      <PlanSection
        title={t('common.goal')}
        action={t('common.add')}
        theme={theme}
        menuOpen={menuOpen}
        onAction={openNew}
      >
        {goals.length === 0 ? (
          <View style={styles.emptyGoal}>
            <ThemedText type="small" themeColor="muted">
              {t('common.noRecords')}
            </ThemedText>
          </View>
        ) : (
          goals.map((goal) => {
            const saved = wallets.find((wallet) => wallet.id === goal.walletId)?.balance ?? 0;
            const achieved = saved >= goal.targetAmount;
            return (
              <MotionAnimatedView
                key={goal.id}
                entering={motionPresets.itemEntering}
                exiting={motionPresets.itemExiting}
                layout={motionPresets.layout}
                style={[styles.goal, { borderBottomColor: theme.line }]}
              >
                <View style={styles.planItemTop}>
                  <View style={[styles.categoryIcon, { backgroundColor: theme.walletGold }]}>
                    <ThemedText style={{ color: theme.gold }}>✦</ThemedText>
                  </View>
                  <View style={styles.itemCopy}>
                    <ThemedText type="smallBold" style={styles.itemName}>
                      {goal.name}
                    </ThemedText>
                    <ThemedText type="small" themeColor="muted" style={styles.itemSubtitle}>
                      {t('common.goalContributionSummary', {
                        amount: formatMoney(goal.monthlyContribution),
                      })}
                    </ThemedText>
                  </View>
                  <View style={styles.itemValueActions}>
                    <ThemedText type="code" style={[styles.itemValueText, { color: theme.gold }]}>
                      {formatMoney(saved)} / {formatMoney(goal.targetAmount)}
                    </ThemedText>
                    <PlanActionMenu
                      label={goal.name}
                      theme={theme}
                      onOpenChange={onMenuOpenChange}
                      dismissSignal={dismissSignal}
                      actions={[
                        { icon: '✎', label: t('common.edit'), onPress: () => setEditor(goal) },
                        {
                          icon: '+',
                          label: t('common.saveGoalMoney'),
                          onPress: () => onOpenSaveAction(goal),
                          tone: 'primary',
                        },
                        {
                          icon: '↙',
                          label: t('common.withdraw'),
                          onPress: () =>
                            setConfirmation({
                              title: t('common.emergencyWithdrawal'),
                              message: t('common.emergencyWithdrawalCopy', {
                                amount: formatMoney(saved),
                              }),
                              confirmLabel: t('common.withdraw'),
                              onConfirm: () => onWithdraw?.(goal, saved),
                            }),
                          tone: 'danger',
                        },
                        {
                          icon: '—',
                          label: t('common.archive'),
                          onPress: () =>
                            setConfirmation({
                              title: t('common.archiveGoalConfirm'),
                              message: t('common.archiveGoalCopy'),
                              confirmLabel: t('common.archive'),
                              onConfirm: () => onArchive?.(goal),
                            }),
                        },
                      ]}
                    />
                  </View>
                </View>
                <Progress
                  value={Math.min((saved / goal.targetAmount) * 100, 100)}
                  color={achieved ? theme.income : theme.gold}
                  theme={theme}
                />
                <ThemedText type="small" themeColor="muted" style={styles.goalStatus}>
                  {achieved
                    ? t('common.achieved')
                    : t('common.goalTargetSummary', { amount: formatMoney(goal.targetAmount) })}
                </ThemedText>
              </MotionAnimatedView>
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
        confirmLabel={confirmation?.confirmLabel ?? t('common.confirm')}
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
  const { t } = useTranslation();
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
    <SheetModal
      title={goal ? t('common.editGoal', { name: goal.name }) : t('common.goalNew')}
      closeLabel={t('common.closeGoalForm')}
      onClose={onClose}
      keyboardAvoiding
      sheetStyle={styles.goalSheet}
    >
      <ScrollView
        style={styles.sheetScroll}
        contentContainerStyle={styles.goalSheetContent}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="interactive"
      >
        <ThemedText type="small" themeColor="muted">
          {t('common.goalProgressCopy')}
        </ThemedText>
        <FieldLabel>{t('common.goalName')}</FieldLabel>
        <ThemedInput
          accessibilityLabel={t('common.goalName')}
          placeholder={t('common.goalNamePlaceholder')}
          value={name}
          onChangeText={setName}
          style={styles.goalInput}
        />
        <MoneyField
          label={t('common.targetNominal')}
          value={target}
          onChangeText={(value) => setTarget(formatMoneyInput(value))}
          accessibilityLabel={t('common.goalTarget')}
          inputStyle={styles.goalInput}
        />
        <FieldLabel>{t('common.goalWallet')}</FieldLabel>
        <WalletPicker wallets={wallets} selected={walletId} onSelect={setWalletId} />
        <FieldLabel>{t('common.targetOptional')}</FieldLabel>
        <ThemedInput
          accessibilityLabel={t('common.goalDate')}
          placeholder="YYYY-MM-DD"
          value={targetDate}
          onChangeText={setTargetDate}
          style={styles.goalInput}
        />
        <MoneyField
          label={t('common.monthlyContributionLabel')}
          value={monthly}
          onChangeText={(value) => setMonthly(formatMoneyInput(value))}
          accessibilityLabel={t('common.goalContribution')}
          inputStyle={styles.goalInput}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.saveGoal')}
          onPress={submit}
          style={[styles.saveGoal, { backgroundColor: theme.pine }]}
        >
          <ThemedText type="smallBold" style={{ color: theme.heroText }}>
            {goal ? t('common.saveChanges') : t('common.saveGoal')}
          </ThemedText>
        </Pressable>
      </ScrollView>
    </SheetModal>
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
  onEdit: () => void;
  onDelete?: (item: BudgetPlanItem) => void | Promise<void>;
  onMenuOpenChange?: (open: boolean) => void;
  dismissSignal?: number;
}) {
  const { t } = useTranslation();
  const [confirmation, setConfirmation] = useState(false);
  const itemName = props.category ? getCategoryLabel(props.category) : props.item.name;
  return (
    <>
      <PlanItemContent {...props} onRequestDelete={() => setConfirmation(true)} />
      <ConfirmationModal
        visible={confirmation}
        title={t('common.planDeleteConfirm')}
        message={t('common.planDeleteCopy', { name: itemName })}
        confirmLabel={t('common.delete')}
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
  onMenuOpenChange,
  dismissSignal = 0,
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
  onMenuOpenChange?: (open: boolean) => void;
  dismissSignal?: number;
}) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const handleMenuOpenChange = useCallback(
    (open: boolean) => {
      setMenuOpen(open);
      onMenuOpenChange?.(open);
    },
    [onMenuOpenChange],
  );
  const itemName = category ? getCategoryLabel(category) : item.name;
  const amount = state?.realizedAmount ?? 0;
  const income = item.type === 'income';
  const incomeAmount = item.targetAmount > 0 ? item.targetAmount : amount;
  const progress = state?.progressPercent ?? 0;
  return (
    <MotionAnimatedView
      entering={motionPresets.itemEntering}
      exiting={motionPresets.itemExiting}
      layout={motionPresets.layout}
      style={[styles.item, { borderBottomColor: theme.line }, menuOpen && styles.planItemOpen]}
    >
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
            {itemName}
          </ThemedText>
          {income ? (
            <ThemedText type="small" themeColor="muted" style={styles.itemSubtitle}>
              {t('common.planItemIncomeSource')}
            </ThemedText>
          ) : null}
        </View>
        <View testID={`plan-value-actions-${item.id}`} style={styles.itemValueActions}>
          <PlanActionMenu
            label={itemName}
            theme={theme}
            onOpenChange={handleMenuOpenChange}
            dismissSignal={dismissSignal}
            actions={[
              ...(!income && action
                ? [
                    {
                      icon: '→',
                      label: action,
                      onPress: () => onAction(item),
                      tone: 'primary' as const,
                    },
                  ]
                : []),
              { icon: '✎', label: t('common.edit'), onPress: onEdit },
              {
                icon: '×',
                label: t('common.delete'),
                onPress: onRequestDelete,
                tone: 'danger' as const,
              },
            ]}
          />
          <ThemedText
            type="code"
            style={[styles.itemValueText, { color: income ? theme.income : theme.expense }]}
          >
            {income
              ? formatMoney(incomeAmount)
              : `${formatMoney(amount)} / ${formatMoney(item.targetAmount)}`}
          </ThemedText>
        </View>
      </View>
      {!income && (
        <Progress
          value={progress}
          color={state?.overBudget ? theme.expense : color}
          theme={theme}
        />
      )}
    </MotionAnimatedView>
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
    <View style={styles.progressRow}>
      <MotionProgressBar
        value={value}
        color={color}
        trackColor={theme.line}
        style={styles.progress}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.min(Math.max(value, 0), 100) }}
      />
      <ThemedText type="code" themeColor="muted" style={styles.progressPercent}>
        {Math.max(0, Math.round(value))}%
      </ThemedText>
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
  sectionMenuOpen: { elevation: 10, position: 'relative', zIndex: 10 },
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
  aiAction: { flexShrink: 0 },
  aiButtonText: { fontSize: 11, lineHeight: 14 },
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
  section: { marginBottom: Spacing.six },
  sectionTitle: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 0,
  },
  card: { marginTop: 12, paddingBottom: 1 },
  item: { borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 12 },
  planItemOpen: { elevation: 100, zIndex: 100 },
  planItemTop: { alignItems: 'center', flexDirection: 'row', gap: 11 },
  itemHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  categoryIcon: {
    alignItems: 'center',
    borderRadius: 12,
    height: 35,
    justifyContent: 'center',
    width: 35,
  },
  itemCopy: { flex: 1, minWidth: 0 },
  itemValueActions: {
    alignItems: 'flex-end',
    elevation: 100,
    flexDirection: 'column',
    gap: 1,
    position: 'relative',
    zIndex: 100,
  },
  itemName: { fontSize: 12, lineHeight: 16 },
  itemSubtitle: { fontSize: 10, lineHeight: 14, marginTop: 2 },
  itemValueText: { flexShrink: 0, fontSize: 10, lineHeight: 14, letterSpacing: -0.4 },
  itemAction: { alignSelf: 'flex-end', marginTop: 1 },
  actionButton: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: Radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 30,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionButtonDanger: { backgroundColor: 'transparent' },
  kebabButton: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  kebabGlyph: { fontSize: 15, letterSpacing: 1, lineHeight: 18, transform: [{ translateY: -2 }] },
  actionMenuAnchor: { position: 'relative' },
  actionMenuAnchorOpen: { elevation: 100, zIndex: 100 },
  actionMenu: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 4,
    position: 'absolute',
    right: 0,
    top: 30,
    width: 148,
    elevation: 100,
    zIndex: 100,
  },
  actionMenuItem: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 11,
  },
  itemActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  itemActionText: { fontSize: 10, lineHeight: 14 },
  progressRow: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 10 },
  progress: { flex: 1, borderRadius: 9, height: 5, overflow: 'hidden' },
  progressPercent: { minWidth: 34, textAlign: 'right' },
  progressFill: { borderRadius: 9, height: '100%' },
  goal: { borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 12 },
  goalActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  goalActionText: { fontSize: 10, lineHeight: 14 },
  goalStatus: { fontSize: 10, lineHeight: 14 },
  emptyGoal: { paddingVertical: 16 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
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
  dateButton: {
    alignItems: 'center',
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: 12,
  },
  goalInput: { borderBottomWidth: 1, fontSize: 16, minHeight: 44, paddingHorizontal: 8 },
  goalWallets: { gap: 8, paddingVertical: 4 },
  planCategoryCell: { width: 132 },
  planCategoryChoice: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    gap: 3,
    height: 72,
    justifyContent: 'center',
    padding: 10,
    width: '100%',
  },
  planCategoryName: { textAlign: 'center', width: '100%' },
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
    gap: 7,
    width: '100%',
  },
  planIconRow: { flexDirection: 'row', gap: 7, width: '100%' },
  planIconChoice: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    height: 39,
    justifyContent: 'center',
    width: '100%',
  },
  planIconCell: { flex: 1, minWidth: 0 },
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
