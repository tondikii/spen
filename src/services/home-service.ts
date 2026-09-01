import mockData from '@/data/mock-data';
import type { Transaction, Wallet } from '@/types/domain';

export function getHomeSnapshot() {
  return mockData.budgetSnapshot;
}

export function getTransactionPresentation(transaction: Transaction) {
  const category = mockData.categories.find((item) => item.id === transaction.categoryId);
  const wallet = mockData.wallets.find((item) => item.id === transaction.walletId);
  return { categoryName: category?.name ?? 'Transaksi', categoryIcon: category?.icon ?? '◇', walletName: wallet?.name ?? 'Wallet' };
}

export function getHomeWallets() {
  return mockData.wallets.filter((wallet) => !wallet.archived);
}

export function getHomeRecentTransactions() {
  return mockData.transactions.slice(0, 3);
}

export function getWalletTotal(wallets: Wallet[]) {
  return wallets.reduce((total, wallet) => total + wallet.balance, 0);
}

export function addMockWallet(wallets: Wallet[], name: string, balance: number, tint: Wallet['tint']) {
  return [...wallets, { id: `wallet-${Date.now()}`, name, initialBalance: balance, balance, isSavings: false, archived: false, tint } satisfies Wallet];
}

export function renameMockWallet(wallets: Wallet[], walletId: string, name: string) {
  return wallets.map((wallet) => wallet.id === walletId ? { ...wallet, name } : wallet);
}

export function updateMockWallet(wallets: Wallet[], walletId: string, name: string, balance: number) {
  return wallets.map((wallet) => wallet.id === walletId ? { ...wallet, name, balance } : wallet);
}

export function archiveMockWallet(wallets: Wallet[], walletId: string) {
  return wallets.filter((wallet) => wallet.id !== walletId);
}
