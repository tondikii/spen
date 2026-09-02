import PlanScreen from '@/components/plan-screen';
import { useSQLiteContext } from 'expo-sqlite';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { createDatabasePlanItem, getDatabasePlanView, setBudgetPeriodStartDay, updateDatabasePlanItem } from '@/services/plan-service';
import type { BudgetSuggestion } from '@/services/ai-service';
import { getDatabaseTransactionCategories } from '@/services/transaction-service';
import { archiveGoal, createGoal, updateGoal, withdrawFromGoal, type GoalDraft } from '@/services/goal-service';
import { DataState } from '@/components/screen-skeleton';

export default function PlanRoute() {
  const database = useSQLiteContext();
  const [planView, setPlanView] = useState<Awaited<ReturnType<typeof getDatabasePlanView>> | null>(null);
  const [categories, setCategories] = useState<Awaited<ReturnType<typeof getDatabaseTransactionCategories>>>([]);
  const [error, setError] = useState('');
  const load = useCallback(async () => { try { const [nextPlan, nextCategories] = await Promise.all([getDatabasePlanView(database), getDatabaseTransactionCategories(database)]); setPlanView(nextPlan); setCategories(nextCategories); setError(''); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Budget plan tidak dapat dimuat.'); } }, [database]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  if (error) return <DataState kind="error" title="Rencana belum siap" description={error} onRetry={() => { void load(); }} />;
  if (!planView) return <DataState kind="loading" title="Memuat Rencana" description="Menghitung Budget plan dan Saldo tersedia." />;
  return <PlanScreen key={planView.period.id} planView={planView} categories={categories} onPeriodStartDayChange={async (day) => {
    await setBudgetPeriodStartDay(database, day);
    await load();
  }} onPlanItemSave={async (item, draft) => {
    if (item) await updateDatabasePlanItem(database, item, draft);
    else await createDatabasePlanItem(database, draft);
    await load();
  }} onItemAction={(item, amount) => {
    router.push({ pathname: '/create', params: { type: item.type === 'income' ? 'income' : 'expense', categoryId: item.categoryId, amount: String(amount) } });
  }} onSuggestionApply={async (suggestion: BudgetSuggestion) => {
    if (suggestion.action === 'review_expense') return;
    if (suggestion.action === 'add_goal') throw new Error('Saran Goal perlu dilengkapi manual di bagian Goal.');
    const category = categories.find((item) => item.type === 'expense' && !item.archived && item.name.toLowerCase() === suggestion.categoryName?.toLowerCase())
      ?? categories.find((item) => item.type === 'expense' && !item.archived && item.name === 'Belanja');
    if (!category || !suggestion.amount || suggestion.amount <= 0) throw new Error('Saran belum memiliki kategori atau nominal yang bisa diterapkan.');
    if (suggestion.action === 'increase_allocation') {
      const existing = planView.plan.allocationItems.find((item) => item.categoryId === category.id);
      if (existing) await updateDatabasePlanItem(database, existing, { type: 'allocation', name: existing.name, categoryId: category.id, targetAmount: existing.targetAmount + suggestion.amount });
      else await createDatabasePlanItem(database, { type: 'allocation', name: `Alokasi ${category.name}`, categoryId: category.id, targetAmount: suggestion.amount });
    } else {
      await createDatabasePlanItem(database, { type: 'allocation', name: 'Alokasi spare budget', categoryId: category.id, targetAmount: suggestion.amount });
    }
    await load();
  }} onGoalSave={async (goal, draft: GoalDraft) => {
    if (goal) await updateGoal(database, goal.id, draft);
    else await createGoal(database, draft);
    await load();
  }} onGoalArchive={async (goal) => {
    await archiveGoal(database, goal.id);
    await load();
  }} onGoalSaveAction={(goal) => {
    const source = planView.wallets.find((wallet) => !wallet.archived && wallet.id !== goal.walletId);
    if (source) router.push({ pathname: '/create', params: { type: 'transfer', walletId: source.id, toWalletId: goal.walletId, goalId: goal.id, lockedToWalletId: goal.walletId } });
  }} onGoalWithdraw={async (goal, amount) => {
    if (amount > 0) await withdrawFromGoal(database, goal.id, amount);
    await load();
  }} />;
}
