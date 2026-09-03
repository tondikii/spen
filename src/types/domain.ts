export type TransactionType = 'income' | 'expense' | 'transfer' | 'adjustment';
export type CategoryType = 'income' | 'expense' | 'transfer';
export type WalletTint = 'pine' | 'coral' | 'gold' | 'goal';
export type PlanItemType = 'income' | 'fixedExpense' | 'allocation';
export type ThemeMode = 'system' | 'light' | 'dark';
export type CurrencyCode = 'IDR' | 'USD' | 'SGD' | 'MYR' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'SAR' | 'AED';
export type PaymentStatus =
  | { kind: 'Lunas' }
  | { kind: 'Sebagian dibayar'; paidAmount: number; targetAmount: number }
  | { kind: 'Belum dibayar' };

export type Wallet = {
  id: string;
  name: string;
  initialBalance: number;
  balance: number;
  isSavings: boolean;
  archived: boolean;
  tint: WalletTint;
};

export type Category = {
  id: string;
  name: string;
  type: CategoryType;
  icon: string;
  archived: boolean;
  isAdjustment: boolean;
};

export type Transaction = {
  id: string;
  type: TransactionType;
  walletId: string | null;
  toWalletId: string | null;
  categoryId: string | null;
  amount: number;
  adminFee?: number;
  date: string;
  time: string;
  note: string;
  isInitial?: boolean;
  isAdjustment?: boolean;
};

export type TransactionDraft = Omit<Transaction, 'id'>;

export type BudgetPeriod = {
  id: string;
  startDate: string;
  endDate: string;
  durationMonths: 1;
};

export type IncomeItem = {
  id: string;
  type: 'income';
  name: string;
  categoryId: string;
  targetAmount: number;
};

export type FixedExpenseItem = {
  id: string;
  type: 'fixedExpense';
  name: string;
  categoryId: string;
  targetAmount: number;
};

export type AllocationItem = {
  id: string;
  type: 'allocation';
  name: string;
  categoryId: string;
  targetAmount: number;
};

export type BudgetPlanItem = IncomeItem | FixedExpenseItem | AllocationItem;

export type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  targetDate: string | null;
  walletId: string;
  monthlyContribution: number;
  archived: boolean;
};

export type GoalProgress = {
  goalId: string;
  savedAmount: number;
  progressPercent: number;
  achieved: boolean;
};

export type BudgetPlan = {
  id: string;
  budgetPeriodId: string;
  incomeItems: IncomeItem[];
  fixedExpenseItems: FixedExpenseItem[];
  allocationItems: AllocationItem[];
  goalIds: string[];
};

export type MockPlanItemState = {
  itemId: string;
  realizedAmount: number;
  progressPercent: number;
  paymentStatus?: PaymentStatus;
  overBudget: boolean;
};

export type MockBudgetSnapshot = {
  totalIncome: number;
  totalExpense: number;
  totalTransferIn: number;
  totalTransferOut: number;
  netSaving: number;
  spareBudget: number;
  availableBalance: number;
  freeBalance: number;
  goalBalance: number;
  planItems: MockPlanItemState[];
};

export type AppSettings = {
  currency: CurrencyCode;
  themeMode: ThemeMode;
};

export type SpenMockData = {
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  budgetPeriods: BudgetPeriod[];
  budgetPlans: BudgetPlan[];
  goals: Goal[];
  goalProgress: GoalProgress[];
  settings: AppSettings;
  budgetSnapshot: MockBudgetSnapshot;
};
