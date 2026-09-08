import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type { ComponentProps } from 'react';

import ReportScreen from '@/components/report-screen';
import type { BudgetPeriod } from '@/types/domain';

const period: BudgetPeriod = {
  id: 'period-1',
  startDate: '2026-09-01',
  endDate: '2026-09-30',
  durationMonths: 1,
};

function makeReportView() {
  return {
    snapshot: {
      totalIncome: 6_500_000,
      totalExpense: 2_950_000,
      totalTransferIn: 0,
      totalTransferOut: 0,
      netSaving: 3_550_000,
      spareBudget: 3_550_000,
      availableBalance: 10_000_000,
      freeBalance: 8_000_000,
      goalBalance: 2_000_000,
      planItems: [],
    },
    expenses: [
      {
        categoryId: 'category-food',
        name: 'Makan',
        systemKey: 'food' as const,
        icon: 'cart-outline',
        amount: 2_950_000,
      },
    ],
    period,
    startDay: 1,
    periods: [period],
    netSavingByPeriod: [{ period, netSaving: 3_550_000 }],
  };
}

function renderScreen(
  reportView = makeReportView(),
  props: Partial<ComponentProps<typeof ReportScreen>> = {},
) {
  return render(
    <ReportScreen
      reportView={reportView}
      onRangeChange={jest.fn()}
      onPeriodStartDayChange={jest.fn()}
      onPeriodChange={jest.fn()}
      {...props}
    />,
  );
}

describe('ReportScreen', () => {
  it('menampilkan ringkasan, breakdown expense, dan net saving', async () => {
    const { getAllByText, getByText, queryByLabelText } = await renderScreen();

    expect(getByText('Laporan')).toBeTruthy();
    expect(getAllByText('Pengeluaran').length).toBeGreaterThan(0);
    expect(getByText('Makan')).toBeTruthy();
    expect(getAllByText('Tabungan bersih').length).toBeGreaterThan(0);
    expect(queryByLabelText('Tanya insight')).toBeNull();
  });

  it('merender Pendapatan dan Pengeluaran panjang sebagai satu baris footer', async () => {
    const reportView = makeReportView();
    reportView.snapshot = {
      ...reportView.snapshot,
      totalIncome: 12_345_678_901,
      totalExpense: 9_876_543_210,
      netSaving: 2_469_135_691,
    };

    const { getAllByText, getByText } = await renderScreen(reportView);

    expect(getByText('Pendapatan Rp 12.345.678.901')).toBeTruthy();
    expect(getByText('Pengeluaran Rp 9.876.543.210')).toBeTruthy();
    expect(
      getAllByText('Rp 9.876.543.210').some((node) => node.props.adjustsFontSizeToFit === true),
    ).toBe(true);
  });

  it('menampilkan empty state saat saving trend belum memiliki data', async () => {
    const reportView = { ...makeReportView(), netSavingByPeriod: [] };

    const { getByText } = await renderScreen(reportView);

    expect(getByText('Belum ada data tabungan bersih')).toBeTruthy();
  });

  it('menampilkan loading lalu insight Bahasa Indonesia', async () => {
    const { getByLabelText, getByText } = await renderScreen();

    await fireEvent.press(getByLabelText('Tanya AI'));
    await waitFor(() => expect(getByText('Insight bulan ini')).toBeTruthy());
    expect(getByText('Mengerti')).toBeTruthy();
  });

  it('memakai picker Budget period yang sama dan menyimpan tanggal mulai', async () => {
    const onPeriodStartDayChange = jest.fn();
    const { getByLabelText, getByText } = await renderScreen(makeReportView(), {
      onPeriodStartDayChange,
    });

    expect(getByText('1 Sep–30 Sep')).toBeTruthy();
    await fireEvent.press(getByLabelText('Pilih rentang Laporan'));
    await fireEvent.press(getByLabelText('Tanggal 5'));
    await fireEvent.press(getByLabelText('Terapkan'));
    await fireEvent.press(getByLabelText('Terapkan'));

    expect(onPeriodStartDayChange).toHaveBeenCalledWith(5);
    expect(getByText('5 Sep–4 Okt')).toBeTruthy();
  });

  it('menampilkan satu picker khusus untuk rentang chart Tabungan bersih di dalam card', async () => {
    const { getByLabelText, getByText } = await renderScreen();

    expect(getByLabelText('Pilih rentang Tabungan bersih').props.accessibilityState).toEqual({
      expanded: false,
    });
    await fireEvent.press(getByLabelText('Pilih rentang Tabungan bersih'));
    await fireEvent.press(getByLabelText('Laporan 6 bulan'));

    expect(getByText('6 bulan')).toBeTruthy();
  });
});
