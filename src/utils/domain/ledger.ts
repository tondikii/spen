import type { Transaction, Wallet } from '@/types/domain';
import { AppError } from '@/utils/app-error';

export type LedgerType = 'income' | 'expense' | 'transfer';

export type LedgerTotals = {
  income: number;
  expense: number;
  transferIn: number;
  transferOut: number;
};

/** Menjaga invariant uang: hasil agregasi harus tetap integer aman (panduan seksi 9/19). */
function assertSafeMoney(value: number): number {
  if (!Number.isSafeInteger(value)) throw new AppError('validation', { value });
  return value;
}

function ledgerTypeOf(transaction: Transaction): LedgerType | null {
  return transaction.type === 'adjustment' ? null : transaction.type;
}

/**
 * Sums one ledger into Pendapatan, Pengeluaran, and both Transfer legs
 * (transfer out includes the admin fee). Transfer is neutral to net
 * worth: incoming and outgoing are reported separately. `resolveType`
 * lets a caller project raw transactions onto ledger types (e.g. map
 * adjustment transactions by their category type).
 */
export function summarizeLedger(
  transactions: Transaction[],
  resolveType: (transaction: Transaction) => LedgerType | null = ledgerTypeOf,
): LedgerTotals {
  const totals = transactions.reduce(
    (running, transaction) => {
      const type = resolveType(transaction);
      if (type === 'income') running.income += transaction.amount;
      if (type === 'expense') running.expense += transaction.amount;
      if (type === 'transfer' && transaction.toWalletId) running.transferIn += transaction.amount;
      if (type === 'transfer' && transaction.walletId)
        running.transferOut += transaction.amount + (transaction.adminFee ?? 0);
      return running;
    },
    { income: 0, expense: 0, transferIn: 0, transferOut: 0 },
  );
  return {
    income: assertSafeMoney(totals.income),
    expense: assertSafeMoney(totals.expense),
    transferIn: assertSafeMoney(totals.transferIn),
    transferOut: assertSafeMoney(totals.transferOut),
  };
}

/** Tabungan bersih: Pendapatan dikurangi Pengeluaran dan Transfer keluar, ditambah Transfer masuk. */
export function netSaving(totals: LedgerTotals): number {
  return assertSafeMoney(totals.income - totals.expense - totals.transferOut + totals.transferIn);
}

/** Realisasi satu Kategori dalam satu tipe ledger. */
export function realizedForCategory(
  transactions: Transaction[],
  categoryId: string,
  type: 'income' | 'expense',
): number {
  const sum = transactions.reduce(
    (running, transaction) =>
      running +
      (transaction.type === type && transaction.categoryId === categoryId ? transaction.amount : 0),
    0,
  );
  return assertSafeMoney(sum);
}

/** Progress Pengeluaran; boleh melebihi target dan ditandai Melebihi Anggaran. */
export function expenseProgress(
  realized: number,
  target: number,
): { progressPercent: number; overBudget: boolean } {
  return {
    progressPercent: target > 0 ? (realized / target) * 100 : 0,
    overBudget: target > 0 && realized > target,
  };
}

/** Saldo tersedia: total saldo seluruh Dompet. */
export function walletTotal(wallets: Wallet[]): number {
  return assertSafeMoney(wallets.reduce((total, wallet) => total + wallet.balance, 0));
}
