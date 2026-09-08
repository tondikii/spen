jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

import { fireEvent, render, waitFor } from '@testing-library/react-native';

import ReportScreen from '@/components/report-screen';
import { getReportView } from '@/services/report-service';

describe('ReportScreen', () => {
  it('menampilkan ringkasan, breakdown expense, dan net saving', async () => {
    const { getAllByText, getByText, queryByLabelText } = await render(<ReportScreen />);

    expect(getByText('Laporan')).toBeTruthy();
    expect(getAllByText('Pengeluaran').length).toBeGreaterThan(0);
    expect(getByText('Makan')).toBeTruthy();
    expect(getAllByText('Tabungan bersih').length).toBeGreaterThan(0);
    expect(queryByLabelText('Tanya insight')).toBeNull();
  });

  it('merender Pendapatan dan Pengeluaran panjang sebagai satu baris footer', async () => {
    const view = getReportView();
    const reportView = {
      ...view,
      snapshot: {
        ...view.snapshot,
        totalIncome: 12_345_678_901,
        totalExpense: 9_876_543_210,
        netSaving: 2_469_135_691,
      },
    };

    const { getAllByText, getByText } = await render(<ReportScreen reportView={reportView} />);

    expect(getByText('Pendapatan Rp 12.345.678.901')).toBeTruthy();
    expect(getByText('Pengeluaran Rp 9.876.543.210')).toBeTruthy();
    expect(
      getAllByText('Rp 9.876.543.210').some((node) => node.props.adjustsFontSizeToFit === true),
    ).toBe(true);
  });

  it('menampilkan empty state saat saving trend belum memiliki data', async () => {
    const view = { ...getReportView(), netSavingByPeriod: [] };

    const { getByText } = await render(<ReportScreen reportView={view} />);

    expect(getByText('Belum ada data tabungan bersih')).toBeTruthy();
  });

  it('menampilkan loading lalu insight Bahasa Indonesia', async () => {
    const { getByLabelText, getByText } = await render(<ReportScreen />);

    await fireEvent.press(getByLabelText('Tanya AI'));
    await waitFor(() => expect(getByText('Membaca pola keuanganmu…')).toBeTruthy());
    await waitFor(() => expect(getByText('Insight bulan ini')).toBeTruthy());
    expect(getByText('Mengerti')).toBeTruthy();
  });

  it('memakai picker Budget period yang sama dan menyimpan tanggal mulai', async () => {
    const onPeriodStartDayChange = jest.fn();
    const { getByLabelText, getByText } = await render(
      <ReportScreen onPeriodStartDayChange={onPeriodStartDayChange} />,
    );

    expect(getByText('1 Sep–30 Sep')).toBeTruthy();
    await fireEvent.press(getByLabelText('Pilih rentang Laporan'));
    await fireEvent.press(getByLabelText('Tanggal 5'));
    await fireEvent.press(getByLabelText('Terapkan'));
    await fireEvent.press(getByLabelText('Terapkan'));

    expect(onPeriodStartDayChange).toHaveBeenCalledWith(5);
    expect(getByText('5 Sep–4 Okt')).toBeTruthy();
  });

  it('menampilkan satu picker khusus untuk rentang chart Tabungan bersih di dalam card', async () => {
    const { getByLabelText, getByText } = await render(<ReportScreen />);

    expect(getByLabelText('Pilih rentang Tabungan bersih').props.accessibilityState).toEqual({
      expanded: false,
    });
    await fireEvent.press(getByLabelText('Pilih rentang Tabungan bersih'));
    await fireEvent.press(getByLabelText('Laporan 6 bulan'));

    expect(getByText('6 bulan')).toBeTruthy();
  });
});
