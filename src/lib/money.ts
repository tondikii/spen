// Formatter uang Spen: format id-ID, tanpa desimal, simbol sesuai currency.
// Nilai disimpan integer (rupiah tanpa desimal) — lihat spen-db & ADR-0001.
const CURRENCY_SYMBOLS: Record<string, string> = {
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

export function formatMoney(amount: number, currency = 'IDR'): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? '';
  const formatted = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(amount);
  return `${symbol} ${formatted}`.trim();
}
