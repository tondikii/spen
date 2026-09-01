import mockData from '@/data/mock-data';

export function getReportView() {
  const expenses = mockData.categories.filter((category) => category.type === 'expense' && !category.isAdjustment).map((category) => ({
    categoryId: category.id,
    name: category.name,
    icon: category.icon,
    amount: mockData.transactions.filter((transaction) => transaction.categoryId === category.id).reduce((sum, transaction) => sum + transaction.amount, 0),
  })).filter((item) => item.amount > 0).sort((a, b) => b.amount - a.amount);
  return { snapshot: mockData.budgetSnapshot, expenses };
}

export function getReportNetSavingLabel(netSaving: number) {
  return netSaving < 0 ? 'Defisit' : 'Net saving';
}
