import { useCallback, useState } from 'react';

import { formatMoneyInput, parseMoneyInput } from '@/lib/money-input';

export function useMoneyField(initial: string | number = '') {
  const [value, setValue] = useState(() => formatMoneyInput(initial as string));
  const onChange = useCallback((next: string) => setValue(formatMoneyInput(next)), []);
  const amount = parseMoneyInput(value);
  const setAmount = useCallback((next: number) => setValue(formatMoneyInput(next)), []);
  return { value, setValue, onChange, amount, setAmount, parseMoneyInput, formatMoneyInput };
}
