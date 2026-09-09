export type TransactionType = 'income' | 'expense' | 'transfer' | 'adjustment';
export type CategoryType = 'income' | 'expense' | 'transfer';
export type WalletTint = 'pine' | 'coral' | 'gold' | 'goal';
export type ThemeMode = 'system' | 'light' | 'dark';
export type Locale = 'id' | 'en';
export type SystemCategoryKey =
  | 'salary'
  | 'freelance'
  | 'bonus'
  | 'business'
  | 'sales'
  | 'allowance'
  | 'investment'
  | 'giftIncome'
  | 'refund'
  | 'food'
  | 'transport'
  | 'shopping'
  | 'rent'
  | 'internet'
  | 'entertainment'
  | 'dailyNeeds'
  | 'electricity'
  | 'water'
  | 'phoneAndData'
  | 'health'
  | 'education'
  | 'installment'
  | 'insurance'
  | 'tax'
  | 'subscription'
  | 'personalCare'
  | 'family'
  | 'childcare'
  | 'pets'
  | 'travel'
  | 'donation'
  | 'sports'
  | 'homeMaintenance'
  | 'fuel'
  | 'parkingAndTolls'
  | 'clothing'
  | 'adminFee'
  | 'transfer'
  | 'openingBalance'
  | 'balanceAdjustment';
export type CurrencyCode =
  'IDR' | 'USD' | 'SGD' | 'MYR' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'SAR' | 'AED';

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
  systemKey?: SystemCategoryKey | null;
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
  sourceIncomeItemId?: string | null;
  sourceExpenseItemId?: string | null;
};

export type TransactionDraft = Omit<Transaction, 'id'> & {
  systemCategoryKey?: SystemCategoryKey | null;
};

export type BudgetPeriod = {
  id: string;
  startDate: string;
  endDate: string;
  durationMonths: 1;
};

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

export type AppSettings = {
  currency: CurrencyCode;
  themeMode: ThemeMode;
  locale: Locale;
};

export type ReminderSettings = {
  remindersEnabled: boolean;
  transactionReminderEnabled: boolean;
  periodReminderEnabled: boolean;
  goalReminderEnabled: boolean;
  transactionReminderTime: string;
  notificationPermissionRequested: boolean;
};
