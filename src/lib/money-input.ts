export function parseMoneyInput(value: string) {
  return Number(value.replace(/[^0-9]/g, '')) || 0;
}

export function formatMoneyInput(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return '';
  const numericValue = typeof value === 'number' ? value : parseMoneyInput(String(value));
  if (!numericValue) return value === 0 ? '0' : '';
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(numericValue);
}
