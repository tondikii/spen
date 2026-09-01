import type { CurrencyCode } from '@/types/domain';

let selectedCurrency: CurrencyCode = 'IDR';

export const currencyOptions: CurrencyCode[] = ['IDR', 'USD', 'SGD', 'MYR', 'EUR', 'GBP', 'JPY', 'AUD', 'SAR', 'AED'];

export function getSelectedCurrency() { return selectedCurrency; }
export function setSelectedCurrency(currency: CurrencyCode) { selectedCurrency = currency; return selectedCurrency; }
