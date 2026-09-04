import { fireEvent, render } from '@testing-library/react-native';

import FaqScreen from '@/components/faq-screen';
import { AppThemeProvider } from '@/components/theme-provider';

describe('FaqScreen', () => {
  it('menampilkan FAQ utama dan membuka jawaban yang dipilih', async () => {
    const { getByText, getByLabelText, queryByText } = await render(
      <AppThemeProvider>
        <FaqScreen onBack={() => undefined} />
      </AppThemeProvider>,
    );

    expect(getByText('FAQ')).toBeTruthy();
    expect(getByText('Apa itu Spen?')).toBeTruthy();
    expect(queryByText('Spen membantu mencatat Transaksi dan menyusun Budget plan pribadi.')).toBeNull();

    await fireEvent.press(getByLabelText('Apa itu Spen?'));

    expect(getByText('Spen membantu mencatat Transaksi dan menyusun Budget plan pribadi.')).toBeTruthy();
  });

  it('membuka beberapa jawaban tanpa menutup jawaban lain dan dapat menutupnya kembali', async () => {
    const { getByLabelText, getByText, queryByText } = await render(
      <AppThemeProvider>
        <FaqScreen onBack={() => undefined} />
      </AppThemeProvider>,
    );
    const firstAnswer = 'Spen membantu mencatat Transaksi dan menyusun Budget plan pribadi.';
    const secondAnswer = 'Data Spen tersimpan lokal di perangkatmu. Tidak ada sinkronisasi cloud.';

    await fireEvent.press(getByLabelText('Apa itu Spen?'));
    await fireEvent.press(getByLabelText('Apakah data Spen tersimpan online?'));

    expect(getByText(firstAnswer)).toBeTruthy();
    expect(getByText(secondAnswer)).toBeTruthy();

    await fireEvent.press(getByLabelText('Apa itu Spen?'));

    expect(queryByText(firstAnswer)).toBeNull();
    expect(getByText(secondAnswer)).toBeTruthy();
  });

  it('meneruskan aksi kembali', async () => {
    const onBack = jest.fn();
    const { getByLabelText } = await render(
      <AppThemeProvider>
        <FaqScreen onBack={onBack} />
      </AppThemeProvider>,
    );

    await fireEvent.press(getByLabelText('Kembali'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
