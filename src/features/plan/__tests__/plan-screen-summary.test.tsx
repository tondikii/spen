import { fireEvent, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { makePlanView, renderScreen } from './plan-screen-test-utils';

describe('PlanScreen summary', () => {
  it('menampilkan ringkasan plan yang ringkas bersama section plan', async () => {
    const { getAllByText, getByText, queryByLabelText, queryByText } = await renderScreen();

    expect(getByText('SISA ANGGARAN')).toBeTruthy();
    expect(getByText('masih bisa dialokasikan')).toBeTruthy();
    expect(getByText('Pendapatan Rp 6.500.000')).toBeTruthy();
    expect(getByText('Pengeluaran Rp 2.950.000')).toBeTruthy();
    expect(getAllByText('45%').length).toBeGreaterThan(0);
    expect(getByText('Pendapatan')).toBeTruthy();
    expect(getByText('Pengeluaran')).toBeTruthy();
    expect(getByText('Tabungan')).toBeTruthy();
    expect(queryByText('Tersedia bebas')).toBeNull();
    expect(queryByText('Terikat goal')).toBeNull();
    expect(queryByText('SALDO TERSEDIA')).toBeNull();
    expect(queryByLabelText('SISA ANGGARAN 44%')).toBeNull();
    expect(queryByText('44% dari pendapatan')).toBeNull();
    expect(() => getByText('Fixed expense')).toThrow();
    expect(() => getByText('Alokasi')).toThrow();
    expect(getByText('Tercapai')).toBeTruthy();
  });

  it('mewarnai nominal Pengeluaran merah dan nominal Goal gold', async () => {
    const { getByText } = await renderScreen();

    expect(StyleSheet.flatten(getByText('Rp 175.000 / Rp 350.000').props.style)).toEqual(
      expect.objectContaining({ color: '#C85C55' }),
    );
    expect(StyleSheet.flatten(getByText('Rp 1.750.000 / Rp 15.000.000').props.style)).toEqual(
      expect.objectContaining({ color: '#BD8A30' }),
    );
  });

  it('membuat track progress Spare Budget tetap terlihat di dark mode', async () => {
    const { getByLabelText } = await renderScreen(makePlanView(), {}, 'dark');

    expect(StyleSheet.flatten(getByLabelText('SISA ANGGARAN').props.style)).toEqual(
      expect.objectContaining({ backgroundColor: '#FFFFFF1F' }),
    );
  });

  it('menjelaskan saat target Pengeluaran melebihi Pendapatan aktual', async () => {
    const planView = makePlanView();
    planView.snapshot = { ...planView.snapshot, spareBudget: -500000 };
    const { getByText } = await renderScreen(planView);

    expect(getByText('Rp -500.000')).toBeTruthy();
    expect(getByText('Target Pengeluaran melebihi Pendapatan aktual')).toBeTruthy();
  });

  it('mengubah Budget period dan menerapkan saran AI', async () => {
    const { getAllByText, getByLabelText, getByText } = await renderScreen();

    await fireEvent.press(getByLabelText('Pilih rentang Laporan'));
    await fireEvent.press(getByLabelText('Tanggal 5'));
    await fireEvent.press(getByLabelText('Terapkan'));
    await fireEvent.press(getByLabelText('Terapkan'));
    await waitFor(() => expect(getByText('5 Sep–4 Okt')).toBeTruthy());
    await fireEvent.press(getByLabelText('Saran AI'));
    await waitFor(() => expect(getAllByText('Terapkan').length).toBeGreaterThan(0));
    await fireEvent.press(getAllByText('Terapkan')[0]!);
    expect(getByText('✓ Diterapkan')).toBeTruthy();
  });
});
