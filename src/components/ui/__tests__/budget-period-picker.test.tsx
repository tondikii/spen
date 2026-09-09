import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { BudgetPeriodPicker } from '@/components/ui/budget-period-picker';

describe('BudgetPeriodPicker', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 8, 7, 12));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('previews a not-yet-started anchor from the current date', async () => {
    const { getByLabelText, getByText } = await render(
      <BudgetPeriodPicker
        period={{ startDate: '2026-09-01', endDate: '2026-09-30' }}
        startDay={1}
        onStartDayChange={jest.fn()}
      />,
    );

    await fireEvent.press(getByLabelText('Pilih rentang Laporan'));
    await fireEvent.press(getByLabelText('Tanggal 31'));

    expect(getByText('31 Agu–29 Sep')).toBeTruthy();
  });

  it('keeps each date option within seven columns without horizontal overflow', async () => {
    const { getByLabelText } = await render(
      <BudgetPeriodPicker
        period={{ startDate: '2026-09-01', endDate: '2026-09-30' }}
        startDay={1}
        onStartDayChange={jest.fn()}
      />,
    );

    await fireEvent.press(getByLabelText('Pilih rentang Laporan'));

    // Style grid diukur pada wrapper (Animated.View) yang membungkus tiap opsi;
    // StyleSheet.flatten membuat asersi kebal terhadap style animasi dari mock.
    const option31 = StyleSheet.flatten(getByLabelText('Tanggal 31').parent?.props.style);
    expect(option31.width).toBe('13%');
    expect(option31.marginRight).toBe('1.5%');

    const option28 = StyleSheet.flatten(getByLabelText('Tanggal 28').parent?.props.style);
    expect(option28.width).toBe('13%');
    expect(option28.marginRight).toBeUndefined();
  });
});
