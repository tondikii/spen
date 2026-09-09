import { useCallback, useState, type ComponentProps } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MotionScreen } from '@/components/ui/motion';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { todayISO } from '@/utils/date';
import type { Category, Goal } from '@/types/domain';
import type { BudgetPlanItem, PlanItemType } from '../model';
import type { PlanItemDraft } from '../data/plan-repository';
import type { BudgetAIInput, BudgetSuggestion } from '@/lib/ai-service';

import { usePlanAi } from '../hooks/use-plan-ai';
import type { PlanView } from '../read';
import { GoalSection } from '../components/goal-section';
import { PlanAiSheet } from '../components/plan-ai-sheet';
import { PlanHeader } from '../components/plan-header';
import { PlanItemFormModal } from '../components/plan-item-form-modal';
import { PlanItemsSection } from '../components/plan-items-section';
import { PlanPaymentModal } from '../components/plan-payment-modal';
import { PlanSummaryCard } from '../components/plan-summary-card';

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
  const { snapshot, plan, goals, wallets, period } = planView;
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
        <PlanHeader
          period={period}
          configuredStartDay={planView.startDay}
          dismissSignal={dismissSignal}
          onPeriodStartDayChange={onPeriodStartDayChange}
          onOpenAi={ai.openAi}
        />
        <PlanSummaryCard snapshot={snapshot} />
        <PlanItemsSection
          incomeItems={plan.incomeItems}
          expenseItems={plan.expenseItems}
          categories={categories}
          itemStates={snapshot.planItems}
          incomeMenuOpen={openMenuSection === 'income'}
          expenseMenuOpen={openMenuSection === 'expense'}
          onAddItem={(type) => setPlanItemEditor({ type })}
          onEditItem={(item) => setPlanItemEditor({ type: item.type, item })}
          onDeleteItem={onPlanItemDelete}
          onItemAction={handleItemAction}
          onIncomeMenuOpenChange={handleIncomeMenuOpenChange}
          onExpenseMenuOpenChange={handleExpenseMenuOpenChange}
          dismissSignal={dismissSignal}
        />
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
      <PlanAiSheet
        visible={ai.open}
        onClose={ai.closeAi}
        loading={ai.loading}
        source={ai.source}
        suggestions={ai.suggestions}
        applied={ai.applied}
        onApply={ai.applySuggestion}
      />
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
});
