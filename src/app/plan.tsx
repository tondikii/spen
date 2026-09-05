import PlanScreen from '@/components/plan-screen';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  applyDatabaseBudgetSuggestion,
  createDatabasePlanItem,
  deleteDatabasePlanItem,
  setBudgetPeriodStartDay,
  updateDatabasePlanItem,
} from '@/features/budget';
import { getBudgetGoalOverview } from '@/features/budget';
import type { BudgetSuggestion } from '@/services/ai-service';
import { saveDatabaseCategory, saveDatabaseTransaction } from '@/features/transactions';
import {
  archiveGoal,
  createGoal,
  updateGoal,
  withdrawFromGoal,
  type GoalDraft,
} from '@/features/budget';
import { DataState } from '@/components/screen-skeleton';
import useAppDatabase from '@/hooks/use-app-database';
import { useFocusedRead } from '@/hooks/use-focused-read';

export default function PlanRoute() {
  const { t } = useTranslation();
  const database = useAppDatabase();
  const read = useCallback(() => getBudgetGoalOverview(database), [database]);
  const { data, error, retry } = useFocusedRead(read, t('common.planLoadError'));
  const load = async () => retry();
  const planView = data?.[0] ?? null;
  const categories = data?.[1] ?? [];

  if (error)
    return (
      <DataState
        kind="error"
        title={t('common.planNotReady')}
        description={t('errors.unknown')}
        onRetry={() => {
          void load();
        }}
      />
    );
  if (!planView)
    return (
      <DataState
        kind="loading"
        title={t('common.loadingPlan')}
        description={t('common.loadingPlanCopy')}
      />
    );
  return (
    <PlanScreen
      key={planView.period.id}
      planView={planView}
      categories={categories}
      onCategorySave={(category) => saveDatabaseCategory(database, category)}
      onPeriodStartDayChange={async (day) => {
        await setBudgetPeriodStartDay(database, day);
        await load();
      }}
      onPlanItemSave={async (item, draft) => {
        if (item?.isAutomatic) return;
        if (item) await updateDatabasePlanItem(database, item, draft);
        else await createDatabasePlanItem(database, draft);
        await load();
      }}
      onPlanItemDelete={async (item) => {
        await deleteDatabasePlanItem(database, item);
        await load();
      }}
      onItemAction={async (item, amount, walletId) => {
        const now = new Date();
        await saveDatabaseTransaction(database, {
          type: 'expense',
          walletId,
          toWalletId: null,
          categoryId: item.categoryId,
          amount,
          date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
          time: now.toTimeString().slice(0, 5),
          note: t('common.planPaymentNote', { name: item.name }),
          sourceExpenseItemId: item.id,
        });
        await load();
      }}
      onSuggestionApply={async (suggestion: BudgetSuggestion) => {
        await applyDatabaseBudgetSuggestion(database, suggestion, {
          plan: planView.plan,
          goals: planView.goals,
          wallets: planView.wallets,
          categories,
        });
        await load();
      }}
      aiInput={{
        spareBudget: planView.snapshot.spareBudget,
        totalIncome: planView.snapshot.totalIncome,
        fixedExpense: planView.plan.expenseItems.reduce((sum, item) => sum + item.targetAmount, 0),
        goalContributions: planView.goals.reduce((sum, goal) => sum + goal.monthlyContribution, 0),
        netSaving: planView.snapshot.netSaving,
        goals: planView.goals.map((goal) => ({
          name: goal.name,
          targetAmount: goal.targetAmount,
          savedAmount: planView.wallets.find((wallet) => wallet.id === goal.walletId)?.balance ?? 0,
        })),
        wallets: planView.wallets
          .filter((wallet) => !wallet.archived)
          .map((wallet) => ({ name: wallet.name, balance: wallet.balance })),
      }}
      onGoalSave={async (goal, draft: GoalDraft) => {
        if (goal) await updateGoal(database, goal.id, draft);
        else await createGoal(database, draft);
        await load();
      }}
      onGoalArchive={async (goal) => {
        await archiveGoal(database, goal.id);
        await load();
      }}
      onGoalAllocate={async (goal, amount) => {
        await updateGoal(database, goal.id, {
          name: goal.name,
          targetAmount: goal.targetAmount,
          targetDate: goal.targetDate,
          walletId: goal.walletId,
          monthlyContribution: amount,
        });
        await load();
      }}
      onGoalWithdraw={async (goal, amount) => {
        if (amount > 0) await withdrawFromGoal(database, goal.id, amount);
        await load();
      }}
    />
  );
}
