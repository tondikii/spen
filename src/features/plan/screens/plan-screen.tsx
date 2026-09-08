import { useCallback, useState, type ComponentProps } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AiSheetModal } from '@/components/ui/ai-sheet-modal';
import { BudgetPeriodPicker } from '@/components/ui/budget-period-picker';
import { MotionPressable as Pressable, MotionScreen } from '@/components/ui/motion';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Fonts, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { todayISO } from '@/lib/date';
import type { BudgetPlanItem, Category, Goal, PlanItemType } from '@/types/domain';
import type { PlanItemDraft } from '@/features/plan';
import type { BudgetAIInput, BudgetSuggestion } from '@/lib/ai-service';

import { usePlanAi } from '../hooks/use-plan-ai';
import type { PlanView } from '../read';
import { GoalSection } from './goal-section';
import { PlanItem } from './plan-item';
import { PlanItemFormModal } from './plan-item-form-modal';
import { PlanPaymentModal } from './plan-payment-modal';
import { EmptyPlan, PlanSection } from './plan-section';
import { PlanSummaryCard } from './plan-summary-card';

type GoalDraft = Omit<Goal, 'id' | 'archived'>;

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
  const { snapshot, plan, goals, wallets, period, startDay: configuredStartDay } = planView;
  const [startDay, setStartDay] = useState(configuredStartDay);
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
  const ai = usePlanAi({ aiInput, snapshot, onSuggestionApply });
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

  const itemState = (item: BudgetPlanItem) =>
    snapshot.planItems?.find((state) => state.itemId === item.id);
  const handleItemAction = (item: BudgetPlanItem) => {
    if (item.type === 'expense') setExpensePaymentEditor(item);
  };

  return (
    <ThemedView style={styles.page} onTouchStart={() => setDismissSignal((current) => current + 1)}>
      {ai.error && (
        <ThemedText
          type="small"
          accessibilityLiveRegion="polite"
          style={{ color: theme.expense, paddingHorizontal: 21, paddingTop: 8 }}
        >
          {ai.error}
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
            onPress={ai.openAi}
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
          onClose={() => setGoalSavingEditor(null)}
          onSubmit={async (amount) => {
            await onGoalAllocate(goalSavingEditor, amount);
            setGoalSavingEditor(null);
          }}
        />
      )}
      <AiSheetModal
        visible={ai.open}
        onClose={ai.closeAi}
        loading={ai.loading}
        heading={t('common.aiSuggestion')}
      >
        {ai.source === 'fallback' && (
          <ThemedText type="small" themeColor="muted">
            {t('common.aiUnavailablePlan')}
          </ThemedText>
        )}
        {ai.suggestions.map((suggestion) => (
          <View key={suggestion.title} style={[styles.suggestion, { borderTopColor: theme.line }]}>
            <ThemedText type="small" style={styles.suggestionText}>
              {suggestion.title}
              {`\n`}
              {suggestion.description}
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.applySuggestion', { title: suggestion.title })}
              onPress={() => void ai.applySuggestion(suggestion)}
            >
              <ThemedText
                type="smallBold"
                themeColor={ai.applied.includes(suggestion.title) ? 'income' : 'pine'}
              >
                {ai.applied.includes(suggestion.title)
                  ? `✓ ${t('common.applied')}`
                  : t('common.apply')}
              </ThemedText>
            </Pressable>
          </View>
        ))}
      </AiSheetModal>
    </ThemedView>
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
  suggestion: {
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 15,
  },
  suggestionText: { flex: 1 },
});
