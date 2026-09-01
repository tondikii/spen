import mockData from '@/data/mock-data';
import type { Category, Transaction, TransactionDraft, TransactionType, Wallet } from '@/types/domain';

export const TRANSACTION_ICON_CHOICES = ['◒', '◉', '▧', '⌂', '◈', '♫', '✦', '☕', '♧', '◌', '☀', '◈', '♡', '♨', '✿'];

export function getActiveTransactionWallets() {
  return mockData.wallets.filter((wallet) => !wallet.archived);
}

export function getActiveTransactionCategories() {
  return mockData.categories.filter((category) => !category.archived);
}

export function getTransactionCategories(categories: Category[], type: TransactionType) {
  const categoryType = type === 'income' ? 'income' : 'expense';
  return categories.filter((category) => category.type === categoryType && !category.archived && !category.isAdjustment);
}

export function getAllocationLimit(categoryId: string | null) {
  const item = mockData.budgetSnapshot.planItems.find((planItem) => {
    const plan = mockData.budgetPlans[0];
    return [...plan.allocationItems, ...plan.fixedExpenseItems].some((candidate) => candidate.id === planItem.itemId && candidate.categoryId === categoryId);
  });
  return item ? [...mockData.budgetPlans[0].allocationItems, ...mockData.budgetPlans[0].fixedExpenseItems].find((candidate) => candidate.id === item.itemId)?.targetAmount ?? 0 : 0;
}

export function archiveMockCategory(categories: Category[], categoryId: string) {
  return categories.map((category) => category.id === categoryId ? { ...category, archived: true } : category);
}

export function saveMockCategory(categories: Category[], category: Category) {
  return categories.some((item) => item.id === category.id)
    ? categories.map((item) => item.id === category.id ? category : item)
    : [...categories, category];
}

export function getMockTransaction(transactionId: string | undefined) {
  return mockData.transactions.find((transaction) => transaction.id === transactionId);
}

export function saveMockTransaction(transactions: Transaction[], draft: TransactionDraft, transactionId?: string) {
  if (!transactionId) return [...transactions, { ...draft, id: `transaction-${Date.now()}` }];
  return transactions.map((transaction) => transaction.id === transactionId ? { ...draft, id: transactionId } : transaction);
}

export function deleteMockTransaction(transactions: Transaction[], transactionId: string) {
  return transactions.filter((transaction) => transaction.id !== transactionId);
}

export function getWalletById(wallets: Wallet[], walletId: string | null) {
  return wallets.find((wallet) => wallet.id === walletId);
}
