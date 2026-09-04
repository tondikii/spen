import PlanScreen from '@/components/plan-screen';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  applyDatabaseBudgetSuggestion,
  createDatabasePlanItem,
  deleteDatabasePlanItem,
  getDatabasePlanView,
  setBudgetPeriodStartDay,
  setDatabasePlanItemPaid,
  updateDatabasePlanItem,
} from '@/services/plan-service';
import type { BudgetSuggestion } from '@/services/ai-service';
import {
  getDatabaseTransactionCategories,
  saveDatabaseCategory,
} from '@/services/transaction-service';
import {
  archiveGoal,
  createGoal,
  updateGoal,
  withdrawFromGoal,
  type GoalDraft,
} from '@/services/goal-service';
import { DataState } from '@/components/screen-skeleton';
import { retryDatabaseRead } from '@/services/database-read-retry';
import useAppDatabase from '@/hooks/use-app-database';

export default function PlanRoute() {
  const database = useAppDatabase();
  const [planView, setPlanView] = useState<Awaited<ReturnType<typeof getDatabasePlanView>> | null>(
    null,
  );
  const [categories, setCategories] = useState<
    Awaited<ReturnType<typeof getDatabaseTransactionCategories>>
  >([]);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try {
      const [nextPlan, nextCategories] = await retryDatabaseRead(() =>
        Promise.all([getDatabasePlanView(database), getDatabaseTransactionCategories(database)]),
      );
      setPlanView(nextPlan);
      setCategories(nextCategories);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Budget plan tidak dapat dimuat.');
    }
  }, [database]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (error)
    return (
      <DataState
        kind="error"
        title="Rencana belum siap"
        description={error}
        onRetry={() => {
          void load();
        }}
      />
    );
  if (!planView)
    return (
      <DataState
        kind="loading"
        title="Memuat Rencana"
        description="Menghitung Budget plan dan Saldo tersedia."
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
        if (item && !('isAutomatic' in item && item.isAutomatic))
          await updateDatabasePlanItem(database, item, draft);
        else await createDatabasePlanItem(database, draft);
        await load();
      }}
      onPlanItemDelete={async (item) => {
        await deleteDatabasePlanItem(database, item);
        await load();
      }}
      onItemAction={(item, amount) => {
        router.push({
          pathname: '/create',
          params: {
            type: item.type === 'income' ? 'income' : 'expense',
            categoryId: item.categoryId,
            amount: String(amount),
          },
        });
      }}
      onItemPayment={async (item, paid) => {
        const wallet = [...planView.wallets]
          .filter((candidate) => !candidate.archived)
          .sort((left, right) => right.balance - left.balance)[0];
        if (!wallet) throw new Error('Belum ada Wallet aktif untuk pembayaran.');
        const now = new Date();
        await setDatabasePlanItemPaid(
          database,
          item,
          paid,
          wallet.id,
          `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
        );
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
      onGoalSaveAction={(goal) => {
        const source = planView.wallets.find(
          (wallet) => !wallet.archived && wallet.id !== goal.walletId,
        );
        if (source)
          router.push({
            pathname: '/create',
            params: {
              type: 'transfer',
              walletId: source.id,
              toWalletId: goal.walletId,
              goalId: goal.id,
              lockedToWalletId: goal.walletId,
            },
          });
      }}
      onGoalWithdraw={async (goal, amount) => {
        if (amount > 0) await withdrawFromGoal(database, goal.id, amount);
        await load();
      }}
    />
  );
}
