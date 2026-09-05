import { useEffect, useMemo, useState, type ComponentProps, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

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
import { BudgetPeriodPicker } from '@/components/budget-period-picker';
import {
  MotionAnimatedView,
  MotionPressable as Pressable,
  MotionProgressBar,
  MotionPulse,
  MotionScreen,
  motionPresets,
} from '@/components/motion';
import { useTranslation } from 'react-i18next';
import type { Locale } from '@/types/domain';
import i18n from '@/i18n';
import { getCategoryLabel } from '@/i18n/categories';
import { getErrorTranslationKey } from '@/lib/app-error';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const SPARE_DONUT_SIZE = 64;
const SPARE_DONUT_RADIUS = 25;
const SPARE_DONUT_STROKE = 6;
const SPARE_DONUT_CIRCUMFERENCE = 2 * Math.PI * SPARE_DONUT_RADIUS;

type PlanView = ReturnType<typeof getPlanView> | Awaited<ReturnType<typeof getDatabasePlanView>>;

function chunk<T>(items: readonly T[], size: number) {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size) as T[]);
  }
  return rows;
}
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

function PlanScreenContent({
  planView = getPlanView(),
  categories = [],
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
  planView?: PlanView;
  categories?: Category[];
  onPeriodStartDayChange?: (day: number) => void | Promise<void>;
  onItemAction?: (item: BudgetPlanItem, amount: number, walletId: string) => void | Promise<void>;
  onPlanItemSave?: (item: BudgetPlanItem | null, draft: PlanItemDraft) => void | Promise<void>;
  onPlanItemDelete?: (item: BudgetPlanItem) => void | Promise<void>;
  onCategorySave?: (category: Category) => Category | Promise<Category>;
  onGoalSave?: (goal: Goal | null, draft: GoalDraft) => void | Promise<void>;
  onGoalArchive?: (goal: Goal) => void | Promise<void>;
  onGoalAllocate?: (goal: Goal, amount: number) => void | Promise<void>;
  onGoalWithdraw?: (goal: Goal, amount: number) => void | Promise<void>;
  aiInput?: BudgetAIInput;
  onSuggestionApply?: (suggestion: BudgetSuggestion) => void | Promise<void>;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const locale = (i18n.language === 'en' ? 'en' : 'id') as Locale;
  const { snapshot, plan, goals, wallets, period } = planView;
  const spareBudgetPercent = sparePercent(snapshot);
  const [startDay, setStartDay] = useState(Number(period.startDate.slice(-2)));
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
            goalContributions: snapshot.goalBalance,
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
      await onSuggestionApply?.(suggestion);
      setApplied((current) =>
        current.includes(suggestion.title) ? current : [...current, suggestion.title],
      );
    } catch (cause) {
      setAiError(t(getErrorTranslationKey(cause)));
    }
  };

  return (
    <ThemedView
      style={styles.page}
      onTouchStart={() => setDismissSignal((current) => current + 1)}
    >
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
                return onPeriodStartDayChange?.(day);
              }}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.aiSuggestion')}
            accessibilityHint={t('common.aiSuggestion')}
            onPress={() => setAiOpen(true)}
            style={[styles.aiButton, { borderColor: theme.line, backgroundColor: theme.mint }]}
          >
            <ThemedText type="smallBold" themeColor="pine" style={styles.aiButtonText}>
              ✦ {t('common.aiSuggestion')}
            </ThemedText>
          </Pressable>
        </View>
        <FinanceHeroCard
          label={t('common.availableBalance')}
          amount={snapshot.availableBalance}
          footer={[
            { label: t('common.freeBalance'), value: formatMoney(snapshot.freeBalance) },
            { label: t('common.tiedGoal'), value: formatMoney(snapshot.goalBalance) },
          ]}
          style={styles.available}
        />
        <View style={[styles.spare, { backgroundColor: theme.spareBackground }]}>
          <View style={styles.spareCopy}>
            <ThemedText style={[styles.spareLabel, { color: theme.spareText }]}>
              {t('common.spareBudget')}
            </ThemedText>
            <ThemedText style={[styles.spareAmount, { color: theme.spareText }]}>
              {formatMoney(snapshot.spareBudget)}
            </ThemedText>
            <ThemedText style={[styles.spareNote, { color: theme.spareText }]}>
              {t('common.spareBudgetNote')}
            </ThemedText>
          </View>
          <SpareBudgetDonut
            accessibilityLabel={`${t('common.spareBudget')} ${spareBudgetPercent}%`}
            percent={spareBudgetPercent}
            progressColor={theme.spareText}
            textColor={theme.spareText}
            trackColor={theme.pine}
          />
        </View>
        <PlanSection
          title={t('common.incomePlan')}
          action={t('common.add')}
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
                action={'isAutomatic' in item && item.isAutomatic ? '' : t('common.addTransaction')}
                color={theme.income}
                theme={theme}
                onAction={handleItemAction}
                onEdit={() => setPlanItemEditor({ type: item.type, item })}
                onDelete={onPlanItemDelete}
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
          dismissSignal={dismissSignal}
        />
      </ScrollView>
      {planItemEditor && (
        <PlanItemFormModal
          item={planItemEditor.item}
          type={planItemEditor.type}
          categories={categories}
          wallets={wallets}
          theme={theme}
          onCategorySave={onCategorySave}
          onClose={() => setPlanItemEditor(null)}
          onSave={async (draft) => {
            await onPlanItemSave?.(planItemEditor.item ?? null, draft);
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
          theme={theme}
          onClose={() => setExpensePaymentEditor(null)}
          onSubmit={async (amount, walletId) => {
            if (!walletId) return;
            await onItemAction?.(expensePaymentEditor, amount, walletId);
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
            await onGoalAllocate?.(goalSavingEditor, amount);
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
}: {
  title: string;
  action: string;
  children: ReactNode;
  theme: ReturnType<typeof useTheme>;
  onAction?: () => void;
}) {
  return (
    <MotionAnimatedView
      entering={motionPresets.itemEntering}
      layout={motionPresets.layout}
      style={styles.section}
    >
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
  return (
    <MotionScreen>
      <SafeAreaView style={styles.safeArea}>
        <PlanScreenContent {...props} />
      </SafeAreaView>
    </MotionScreen>
  );
}

function sparePercent(snapshot: { spareBudget: number; totalIncome: number }) {
  if (snapshot.totalIncome <= 0) return 0;
  return Math.max(
    0,
    Math.min(100, Math.round((snapshot.spareBudget / snapshot.totalIncome) * 100)),
  );
}

function SpareBudgetDonut({
  accessibilityLabel,
  percent,
  progressColor,
  textColor,
  trackColor,
}: {
  accessibilityLabel: string;
  percent: number;
  progressColor: string;
  textColor: string;
  trackColor: string;
}) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const target = Math.max(0, Math.min(100, percent)) / 100;

  useEffect(() => {
    cancelAnimation(progress);
    progress.value = reduceMotion
      ? target
      : withTiming(target, { duration: 700 });

    return () => cancelAnimation(progress);
  }, [progress, reduceMotion, target]);
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: SPARE_DONUT_CIRCUMFERENCE * (1 - progress.value),
  }));

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      style={styles.spareDonut}
    >
      <Svg height={SPARE_DONUT_SIZE} width={SPARE_DONUT_SIZE} viewBox="0 0 64 64">
        <Circle
          cx={SPARE_DONUT_SIZE / 2}
          cy={SPARE_DONUT_SIZE / 2}
          fill="none"
          r={SPARE_DONUT_RADIUS}
          stroke={trackColor}
          strokeWidth={SPARE_DONUT_STROKE}
          opacity={0.24}
        />
        <AnimatedCircle
          animatedProps={animatedProps}
          cx={SPARE_DONUT_SIZE / 2}
          cy={SPARE_DONUT_SIZE / 2}
          fill="none"
          r={SPARE_DONUT_RADIUS}
          stroke={progressColor}
          strokeDasharray={`${SPARE_DONUT_CIRCUMFERENCE} ${SPARE_DONUT_CIRCUMFERENCE}`}
          strokeLinecap="butt"
          strokeWidth={SPARE_DONUT_STROKE}
          transform="rotate(-90 32 32)"
        />
      </Svg>
      <View pointerEvents="none" style={styles.spareDonutLabel}>
        <ThemedText type="code" style={{ color: textColor }}>
          {percent}%
        </ThemedText>
      </View>
    </View>
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
  useEffect(() => {
    setOpen(false);
    onOpenChange?.(false);
  }, [dismissSignal, onOpenChange]);
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
          <ThemedText type="subtitle" themeColor="muted" style={styles.kebabGlyph}>•••</ThemedText>
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
              style={[
                styles.actionMenuItem,
                { borderBottomColor: theme.line },
              ]}
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
  showWalletPicker,
  theme,
  onClose,
  onSubmit,
}: {
  title: string;
  amount: number;
  wallets: Wallet[];
  showWalletPicker: boolean;
  theme: ReturnType<typeof useTheme>;
  onClose: () => void;
  onSubmit: (amount: number, walletId?: string) => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const activeWallets = wallets
    .filter((wallet) => !wallet.archived)
    .sort((left, right) => right.balance - left.balance);
  const [amount, setAmount] = useState(initialAmount ? formatMoneyInput(initialAmount) : '');
  const [walletId, setWalletId] = useState(activeWallets[0]?.id ?? null);
  const submit = () => {
    const parsedAmount = parseMoneyInput(amount);
    if (parsedAmount <= 0) return;
    if (showWalletPicker) {
      if (!walletId) return;
      void onSubmit(parsedAmount, walletId);
    } else {
      void onSubmit(parsedAmount);
    }
  };

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <Pressable
        wrapperStyle={{ flex: 1 }}
        style={[styles.overlay, { backgroundColor: theme.overlay }]}
        onPress={onClose}
      >
        <KeyboardAvoidingView
          style={styles.sheetKeyboard}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.goalSheet, { backgroundColor: theme.card }]}> 
            <View style={styles.sheetHeader}>
              <ThemedText type="sectionHeading">{title}</ThemedText>
              <Pressable accessibilityRole="button" accessibilityLabel={t('common.cancel')} onPress={onClose}>
                <ThemedText type="subtitle" themeColor="muted">×</ThemedText>
              </Pressable>
            </View>
            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.goalSheetContent}
              keyboardShouldPersistTaps="handled"
            >
              <ThemedText type="code" themeColor="muted" style={styles.fieldLabel}>
                {t('common.nominal')}
              </ThemedText>
              <View style={styles.moneyInputRow}>
                <CurrencyMark />
                <ThemedInput
                  accessibilityLabel={t('common.paymentAmount')}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={(value) => setAmount(formatMoneyInput(value))}
                  style={[styles.goalInput, styles.moneyInput]}
                  autoFocus
                />
              </View>
              {showWalletPicker && (
                <>
                  <ThemedText type="code" themeColor="muted" style={styles.fieldLabel}>
                    {t('common.sourceWallet').toUpperCase()}
                  </ThemedText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.goalWallets}>
                    {activeWallets.map((wallet) => (
                      <Pressable
                        key={wallet.id}
                        accessibilityRole="button"
                        accessibilityLabel={t('common.selectWallet', { name: wallet.name })}
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
                </>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t(showWalletPicker ? 'common.confirmPayment' : 'common.saveGoalMoney')}
                onPress={submit}
                style={[styles.saveGoal, { backgroundColor: theme.pine }]}
              >
                <ThemedText type="smallBold" style={{ color: theme.heroText }}>
                  {t(showWalletPicker ? 'common.confirmPayment' : 'common.saveGoalMoney')}
                </ThemedText>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

function PlanItemFormModal({
  item,
  type,
  categories: categoriesProp,
  wallets,
  theme,
  onCategorySave,
  onClose,
  onSave,
}: {
  item?: BudgetPlanItem;
  type: PlanItemType;
  categories: Category[];
  wallets: Wallet[];
  theme: ReturnType<typeof useTheme>;
  onCategorySave?: (category: Category) => Category | Promise<Category>;
  onClose: () => void;
  onSave: (draft: PlanItemDraft) => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const [categories, setCategories] = useState(categoriesProp);
  const [target, setTarget] = useState(item ? formatMoneyInput(item.targetAmount) : '');
  const [walletId, setWalletId] = useState<string | null>(
    item?.type === 'income' ? (item.walletId ?? wallets[0]?.id ?? null) : (wallets[0]?.id ?? null),
  );
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
    const saved = onCategorySave ? await onCategorySave(draft) : draft;
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
    });
  };
  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <Pressable
        wrapperStyle={{ flex: 1 }}
        style={[styles.overlay, { backgroundColor: theme.overlay }]}
        onPress={onClose}
      >
        <KeyboardAvoidingView
          style={styles.sheetKeyboard}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <View style={[styles.goalSheet, { backgroundColor: theme.card }]}>
            <View style={styles.sheetHeader}>
              <ThemedText type="sectionHeading">
                {item ? t('common.itemPlanEdit') : t('common.itemPlanNew')}
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.closePlanItemForm')}
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
                {type === 'income' ? t('common.incomePlanNote') : t('common.expensePlanNote')}
              </ThemedText>
              <ThemedText type="code" themeColor="muted" style={styles.fieldLabel}>
                {type === 'income' ? t('common.nominal') : t('common.targetNominal')}
              </ThemedText>
              <View style={styles.moneyInputRow}>
                <CurrencyMark />
                <ThemedInput
                  accessibilityLabel={t('common.targetPlanItem')}
                  keyboardType="numeric"
                  placeholder="0"
                  value={target}
                  onChangeText={(value) => setTarget(formatMoneyInput(value))}
                  style={[styles.goalInput, styles.moneyInput]}
                />
              </View>
              {type === 'income' && (
                <>
                  <ThemedText type="code" themeColor="muted" style={styles.fieldLabel}>
                    {t('common.incomeWallet')}
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
                        accessibilityLabel={t('common.selectWallet', { name: wallet.name })}
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
                </>
              )}
              <View style={styles.categoryLabelRow}>
                <ThemedText type="code" themeColor="muted" style={styles.fieldLabel}>
                  {t('common.category').toUpperCase()}
                </ThemedText>
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
  onOpenSaveAction,
  onWithdraw,
  dismissSignal = 0,
}: {
  goals: Goal[];
  wallets: Wallet[];
  theme: ReturnType<typeof useTheme>;
  onSave?: (goal: Goal | null, draft: GoalDraft) => void | Promise<void>;
  onArchive?: (goal: Goal) => void | Promise<void>;
  onOpenSaveAction: (goal: Goal) => void;
  onWithdraw?: (goal: Goal, amount: number) => void | Promise<void>;
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
                    <ThemedText
                      type="code"
                      style={[styles.itemValueText, { color: achieved ? theme.income : theme.gold }]}
                    >
                      {formatMoney(saved)} / {formatMoney(goal.targetAmount)}
                    </ThemedText>
                    <PlanActionMenu
                      label={goal.name}
                      theme={theme}
                      dismissSignal={dismissSignal}
                      actions={[
                        { icon: '✎', label: t('common.edit'), onPress: () => setEditor(goal) },
                        { icon: '+', label: t('common.saveGoalMoney'), onPress: () => onOpenSaveAction(goal), tone: 'primary' },
                        {
                          icon: '↙',
                          label: t('common.withdraw'),
                          onPress: () =>
                            setConfirmation({
                              title: t('common.emergencyWithdrawal'),
                              message: t('common.emergencyWithdrawalCopy', { amount: formatMoney(saved) }),
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
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <Pressable
        wrapperStyle={{ flex: 1 }}
        style={[styles.overlay, { backgroundColor: theme.overlay }]}
        onPress={onClose}
      >
        <KeyboardAvoidingView
          style={styles.sheetKeyboard}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <View style={[styles.goalSheet, { backgroundColor: theme.card }]}>
            <View style={styles.sheetHeader}>
              <ThemedText type="sectionHeading">
                {goal ? t('common.editGoal', { name: goal.name }) : t('common.goalNew')}
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.closeGoalForm')}
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
                {t('common.goalProgressCopy')}
              </ThemedText>
              <ThemedText type="code" themeColor="muted" style={styles.fieldLabel}>
                {t('common.goalName').toUpperCase()}
              </ThemedText>
              <ThemedInput
                accessibilityLabel={t('common.goalName')}
                placeholder={t('common.goalNamePlaceholder')}
                value={name}
                onChangeText={setName}
                style={styles.goalInput}
              />
              <ThemedText type="code" themeColor="muted" style={styles.fieldLabel}>
                {t('common.targetNominal')}
              </ThemedText>
              <View style={styles.moneyInputRow}>
                <CurrencyMark />
                <ThemedInput
                  accessibilityLabel={t('common.goalTarget')}
                  keyboardType="numeric"
                  placeholder="0"
                  value={target}
                  onChangeText={(value) => setTarget(formatMoneyInput(value))}
                  style={[styles.goalInput, styles.moneyInput]}
                />
              </View>
              <ThemedText type="code" themeColor="muted" style={styles.fieldLabel}>
                {t('common.goalWallet').toUpperCase()}
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
                    accessibilityLabel={t('common.selectWallet', { name: wallet.name })}
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
                {t('common.targetOptional')}
              </ThemedText>
              <ThemedInput
                accessibilityLabel={t('common.goalDate')}
                placeholder="YYYY-MM-DD"
                value={targetDate}
                onChangeText={setTargetDate}
                style={styles.goalInput}
              />
              <ThemedText type="code" themeColor="muted" style={styles.fieldLabel}>
                {t('common.monthlyContributionLabel')}
              </ThemedText>
              <View style={styles.moneyInputRow}>
                <CurrencyMark />
                <ThemedInput
                  accessibilityLabel={t('common.goalContribution')}
                  keyboardType="numeric"
                  placeholder="0"
                  value={monthly}
                  onChangeText={(value) => setMonthly(formatMoneyInput(value))}
                  style={[styles.goalInput, styles.moneyInput]}
                />
              </View>
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
  onEdit: () => void;
  onDelete?: (item: BudgetPlanItem) => void | Promise<void>;
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
  dismissSignal?: number;
}) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
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
        <View style={styles.itemValueActions}>
          <ThemedText
            type="code"
            style={[styles.itemValueText, { color: income ? theme.income : theme.ink }]}
          >
            {income
              ? formatMoney(incomeAmount)
              : `${formatMoney(amount)} / ${formatMoney(item.targetAmount)}`}
          </ThemedText>
          {!item.isAutomatic && (
            <PlanActionMenu
              label={itemName}
              theme={theme}
              onOpenChange={setMenuOpen}
              dismissSignal={dismissSignal}
              actions={[
                ...(!income && action
                  ? [{ icon: '→', label: action, onPress: () => onAction(item), tone: 'primary' as const }]
                  : []),
                { icon: '✎', label: t('common.edit'), onPress: onEdit },
                { icon: '×', label: t('common.delete'), onPress: onRequestDelete, tone: 'danger' as const },
              ]}
            />
          )}
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
  const { t } = useTranslation();
  const itemName = category ? getCategoryLabel(category) : item.name;
  const progress = state?.progressPercent ?? 0;
  const amountLabel = state?.realizedAmount ?? 0;
  const subtitle = item.isAutomatic
    ? t('common.planItemIncomeSource')
    : item.type === 'income'
      ? t('common.realizedFromTransactions')
      : state?.overBudget
        ? t('common.overBudget')
        : t('common.remainingBudget');
  const iconBackground = item.type === 'income' ? theme.incomeBackground : theme.expenseBackground;
  const iconColor = item.type === 'income' ? theme.income : theme.expense;
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
              {itemName}
            </ThemedText>
            <ThemedText type="small" themeColor="muted" style={styles.itemSubtitle}>
              {item.isAutomatic
                ? t('common.planItemIncomeSource')
                : t('common.realizedFromTransactions')}
            </ThemedText>
          </View>
          <ThemedText type="code" style={[styles.itemValueText, { color: theme.income }]}>
            {formatMoney(amountLabel)}
          </ThemedText>
        </View>
        <View style={styles.itemActions}>
          {!item.isAutomatic && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${t('common.edit')} ${itemName}`}
              onPress={onEdit}
              hitSlop={8}
              style={styles.itemAction}
            >
              <ThemedText type="smallBold" themeColor="pine" style={styles.itemActionText}>
                {t('common.edit')}
              </ThemedText>
            </Pressable>
          )}
          {!item.isAutomatic && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${t('common.delete')} ${itemName}`}
              onPress={confirmDelete}
              hitSlop={8}
              style={styles.itemAction}
            >
              <ThemedText
                type="smallBold"
                style={[styles.itemActionText, { color: theme.expense }]}
              >
                {t('common.delete')}
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
            {itemName}
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
            accessibilityLabel={`${action} ${itemName}`}
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
          accessibilityLabel={`${t('common.edit')} ${itemName}`}
          onPress={onEdit}
          hitSlop={8}
          style={styles.itemAction}
        >
          <ThemedText type="smallBold" themeColor="pine" style={styles.itemActionText}>
            {t('common.edit')}
          </ThemedText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t('common.delete')} ${itemName}`}
          onPress={confirmDelete}
          hitSlop={8}
          style={styles.itemAction}
        >
          <ThemedText type="smallBold" style={[styles.itemActionText, { color: theme.expense }]}>
            {t('common.delete')}
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
  spareDonut: {
    alignItems: 'center',
    height: SPARE_DONUT_SIZE,
    justifyContent: 'center',
    position: 'relative',
    width: SPARE_DONUT_SIZE,
  },
  spareDonutLabel: { alignItems: 'center', justifyContent: 'center', position: 'absolute' },
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
  planItemOpen: { elevation: 100, zIndex: 100 },
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
  itemValueActions: {
    alignItems: 'center',
    elevation: 100,
    flexDirection: 'row',
    gap: 3,
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
  quietAction: { fontSize: 12, lineHeight: 15 },
  progressRow: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 10 },
  progress: { flex: 1, borderRadius: 9, height: 5, marginBottom: 7, overflow: 'hidden' },
  progressPercent: { minWidth: 34, textAlign: 'right' },
  progressFill: { borderRadius: 9, height: '100%' },
  goal: { paddingVertical: 12 },
  goalActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
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
