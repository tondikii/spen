import { fireEvent, render, waitFor } from '@testing-library/react-native';

import PlanScreen from '@/components/plan-screen';

describe('PlanScreen', () => {
  it('menampilkan saldo tersedia, spare budget, dan seluruh section plan', async () => {
    const { getByText } = await render(<PlanScreen />);

    expect(getByText('SALDO TERSEDIA')).toBeTruthy();
    expect(getByText('SPARE BUDGET')).toBeTruthy();
    expect(getByText('Pendapatan')).toBeTruthy();
    expect(getByText('Fixed expense')).toBeTruthy();
    expect(getByText('Goal')).toBeTruthy();
    expect(getByText('Alokasi')).toBeTruthy();
    expect(getByText('Melebihi Budget')).toBeTruthy();
    expect(getByText('Tercapai')).toBeTruthy();
  });

  it('mengubah Budget period dan menerapkan saran AI', async () => {
    const { getAllByText, getByLabelText, getByText } = await render(<PlanScreen />);

    await fireEvent.press(getByLabelText('Ubah Budget period'));
    await fireEvent.press(getByLabelText('Mulai tanggal 5'));
    await waitFor(() => expect(getByText('5–30 Sep⌄')).toBeTruthy());
    await fireEvent.press(getByLabelText('AI Suggestion'));
    await waitFor(() => expect(getByText('Membaca pola keuanganmu…')).toBeTruthy());
    await waitFor(() => expect(getAllByText('Terapkan').length).toBe(2));
    await fireEvent.press(getAllByText('Terapkan')[0]);
    expect(getByText('✓ Diterapkan')).toBeTruthy();
  });
});
