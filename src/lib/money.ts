import { getCurrentLocale } from '@/i18n';
import { getIntlLocale } from '@/i18n/format';
import { getSelectedCurrency } from '@/lib/selection';

const CurrencySymbols: Record<string, string> = {
  IDR: 'Rp',
  USD: 'US$',
  SGD: 'S$',
  MYR: 'RM',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  SAR: '﷼',
  AED: 'د.إ',
};

export function formatMoney(amount: number, currency = getSelectedCurrency()) {
  const symbol = CurrencySymbols[currency] ?? currency;
  const formattedAmount = new Intl.NumberFormat(getIntlLocale(getCurrentLocale()), {
    maximumFractionDigits: 0,
  }).format(amount);
  return `${symbol} ${formattedAmount}`;
}
