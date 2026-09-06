import { fireEvent, render } from '@testing-library/react-native';

import { BudgetPeriodPicker } from '@/components/budget-period-picker';

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
});
