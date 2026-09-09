/**
 * Model domain fitur Rencana (ADR-0009): tipe milik fitur dikunci di dekat
 * pemiliknya, bukan di `src/types/domain.ts` (keputusan D3). Yang tersisa di
 * sana hanya tipe lintas fitur/lapisan bersama.
 */

export type PlanItemType = 'income' | 'expense' | 'fixedExpense' | 'allocation';

export type PaymentStatus =
  | { kind: 'Lunas' }
  | { kind: 'Sebagian dibayar'; paidAmount: number; targetAmount: number }
  | { kind: 'Belum dibayar' };

export type IncomeItem = {
  id: string;
  type: 'income';
  name: string;
  categoryId: string;
  targetAmount: number;
  walletId?: string;
  isAutomatic?: boolean;
};

export type ExpenseItem = {
  id: string;
  type: 'expense';
  name: string;
  categoryId: string;
  targetAmount: number;
  isAutomatic?: boolean;
  isPaid?: boolean;
};

/** Baca-kompatibilitas untuk DB lama yang masih punya tabel `fixed_expense_items`. */
export type FixedExpenseItem = Omit<ExpenseItem, 'type'> & { type: 'fixedExpense' };
/** Baca-kompatibilitas untuk DB lama yang masih punya tabel `allocation_items`. */
export type AllocationItem = Omit<ExpenseItem, 'type'> & { type: 'allocation' };

export type BudgetPlanItem = IncomeItem | ExpenseItem | FixedExpenseItem | AllocationItem;

export type PlanItemState = {
  itemId: string;
  realizedAmount: number;
  progressPercent: number;
  paymentStatus?: PaymentStatus;
  overBudget: boolean;
};

export type BudgetPlan = {
  id: string;
  budgetPeriodId: string;
  incomeItems: IncomeItem[];
  expenseItems: ExpenseItem[];
  fixedExpenseItems: FixedExpenseItem[];
  allocationItems: AllocationItem[];
  goalIds: string[];
};

export type BudgetSnapshot = {
  totalIncome: number;
  totalExpense: number;
  totalTransferIn: number;
  totalTransferOut: number;
  netSaving: number;
  spareBudget: number;
  availableBalance: number;
  freeBalance: number;
  goalBalance: number;
  planItems: PlanItemState[];
};
