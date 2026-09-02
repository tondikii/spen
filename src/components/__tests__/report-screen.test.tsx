jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

import { fireEvent, render, waitFor } from '@testing-library/react-native';

import ReportScreen from '@/components/report-screen';

describe('ReportScreen', () => {
  it('menampilkan ringkasan, breakdown expense, dan net saving', async () => {
    const { getAllByText, getByText } = await render(<ReportScreen />);

    expect(getByText('Keuanganmu')).toBeTruthy();
    expect(getByText('Pengeluaran per kategori')).toBeTruthy();
    expect(getByText('Makan')).toBeTruthy();
    expect(getAllByText('Net saving').length).toBeGreaterThan(0);
  });

  it('menampilkan loading lalu insight Bahasa Indonesia', async () => {
    const { getByLabelText, getByText } = await render(<ReportScreen />);

    await fireEvent.press(getByLabelText('Tanya insight'));
    await waitFor(() => expect(getByText('Menghubungkan titik-titik…')).toBeTruthy());
    await waitFor(() => expect(getByText('Insight bulan ini')).toBeTruthy());
    expect(getByText('Mengerti')).toBeTruthy();
  });

  it('meneruskan drill-down kategori beserta Budget period', async () => {
    const onCategoryPress = jest.fn();
    const { getByLabelText } = await render(<ReportScreen onCategoryPress={onCategoryPress} />);

    await fireEvent.press(getByLabelText('Lihat kategori Makan'));

    expect(onCategoryPress).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 'category-makan' }), expect.objectContaining({ startDate: '2026-09-01', endDate: '2026-09-30' }));
  });
});
