import PlanScreen from '@/components/plan-screen';
import { useSQLiteContext } from 'expo-sqlite';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { getDatabasePlanView, setBudgetPeriodStartDay } from '@/services/plan-service';
import { archiveGoal, createGoal, updateGoal, withdrawFromGoal, type GoalDraft } from '@/services/goal-service';

export default function PlanRoute() {
  const database = useSQLiteContext();
  const [planView, setPlanView] = useState<Awaited<ReturnType<typeof getDatabasePlanView>> | null>(null);
  const load = useCallback(async () => setPlanView(await getDatabasePlanView(database)), [database]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  if (!planView) return null;
  return <PlanScreen key={planView.period.id} planView={planView} onPeriodStartDayChange={async (day) => {
    await setBudgetPeriodStartDay(database, day);
    await load();
  }} onItemAction={(item, amount) => {
    router.push({ pathname: '/create', params: { type: item.type === 'income' ? 'income' : 'expense', categoryId: item.categoryId, amount: String(amount) } });
  }} onGoalSave={async (goal, draft: GoalDraft) => {
    if (goal) await updateGoal(database, goal.id, draft);
    else await createGoal(database, draft);
    await load();
  }} onGoalArchive={async (goal) => {
    await archiveGoal(database, goal.id);
    await load();
  }} onGoalSaveAction={(goal) => {
    const source = planView.wallets.find((wallet) => !wallet.archived && wallet.id !== goal.walletId);
    if (source) router.push({ pathname: '/create', params: { type: 'transfer', walletId: source.id, toWalletId: goal.walletId } });
  }} onGoalWithdraw={async (goal, amount) => {
    if (amount > 0) await withdrawFromGoal(database, goal.id, amount);
    await load();
  }} />;
}
