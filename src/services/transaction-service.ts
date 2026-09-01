import mockData from '@/data/mock-data';
import type { Category, Transaction, TransactionDraft, TransactionType, Wallet } from '@/types/domain';

export const TRANSACTION_ICON_CHOICES = ['◒', '◉', '▧', '⌂', '◈', '♫', '✦', '☕', '♧', '◌', '☀', '◍', '♡', '♨', '✿'];

let mockCategories: Category[] = [...mockData.categories];
let mockTransactions: Transaction[] = [...mockData.transactions];

export function getActiveTransactionWallets() {
  return mockData.wallets.filter((wallet) => !wallet.archived);
}

export function getActiveTransactionCategories() {
  return mockCategories.filter((category) => !category.archived);
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
  const updated = categories.map((category) => category.id === categoryId ? { ...category, archived: true } : category);
  mockCategories = mockCategories.map((category) => category.id === categoryId ? { ...category, archived: true } : category);
  return updated;
}

export function saveMockCategory(categories: Category[], category: Category) {
  const updated = categories.some((item) => item.id === category.id)
    ? categories.map((item) => item.id === category.id ? category : item)
    : [...categories, category];
  mockCategories = mockCategories.some((item) => item.id === category.id)
    ? mockCategories.map((item) => item.id === category.id ? category : item)
    : [...mockCategories, category];
  return updated;
}

export function getMockTransactions() {
  return [...mockTransactions];
}

export function saveMockTransaction(transactions: Transaction[], draft: TransactionDraft, transactionId?: string) {
  const updated = !transactionId
    ? [...transactions, { ...draft, id: `transaction-${Date.now()}` }]
    : transactions.map((transaction) => transaction.id === transactionId ? { ...draft, id: transactionId } : transaction);
  mockTransactions = !transactionId
    ? [...mockTransactions, updated[updated.length - 1]]
    : mockTransactions.map((transaction) => transaction.id === transactionId ? { ...draft, id: transactionId } : transaction);
  return updated;
}

export function deleteMockTransaction(transactions: Transaction[], transactionId: string) {
  mockTransactions = mockTransactions.filter((transaction) => transaction.id !== transactionId);
  return transactions.filter((transaction) => transaction.id !== transactionId);
}
