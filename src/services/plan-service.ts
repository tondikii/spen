import mockData from '@/data/mock-data';

export function getPlanView() {
  const snapshot = mockData.budgetSnapshot;
  const plan = mockData.budgetPlans[0];
  return { snapshot, plan, goals: mockData.goals.filter((goal) => !goal.archived), wallets: mockData.wallets };
}

export function getPlanItemState(itemId: string) {
  return mockData.budgetSnapshot.planItems.find((item) => item.itemId === itemId);
}

export function getPaymentLabel(kind: string, paidAmount?: number, targetAmount?: number) {
  if (kind === 'Lunas') return 'Lunas ✓';
  if (kind === 'Sebagian dibayar') return `${paidAmount ?? 0}/${targetAmount ?? 0} dibayar`;
  return 'Belum dibayar';
}
