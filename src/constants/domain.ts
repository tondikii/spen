import type { WalletTint } from '@/types/domain';

export const WALLET_TINTS: WalletTint[] = ['coral', 'pine', 'gold', 'goal'];

// Keep same order as existing TINTS but exported centrally
export const WALLET_TINT_SEQUENCE: WalletTint[] = ['coral', 'pine', 'gold', 'goal'];

export const SYSTEM_CATEGORY_NAMES = {
  openingBalance: 'Saldo Awal',
  balanceAdjustment: 'Penyesuaian Saldo',
  fallbackExpense: 'Belanja',
} as const;

export const CURRENCY_CODES = ['IDR', 'USD', 'SGD', 'MYR', 'EUR', 'GBP', 'JPY', 'AUD', 'SAR', 'AED'] as const;
