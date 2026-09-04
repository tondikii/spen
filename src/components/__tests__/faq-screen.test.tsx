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
    expect(getByText('Apakah data Spen tersimpan online?')).toBeTruthy();
    expect(queryByText('Data Spen tersimpan lokal di perangkatmu. Tidak ada sinkronisasi cloud.')).toBeNull();

    await fireEvent.press(getByLabelText('Apakah data Spen tersimpan online?'));

    expect(getByText('Data Spen tersimpan lokal di perangkatmu. Tidak ada sinkronisasi cloud.')).toBeTruthy();
  });

  it('membuka beberapa jawaban tanpa menutup jawaban lain dan dapat menutupnya kembali', async () => {
    const { getByLabelText, getByText, queryByText } = await render(
      <AppThemeProvider>
        <FaqScreen onBack={() => undefined} />
      </AppThemeProvider>,
    );
    const firstQuestion = 'Apakah data Spen tersimpan online?';
    const firstAnswer = 'Data Spen tersimpan lokal di perangkatmu. Tidak ada sinkronisasi cloud.';
    const secondQuestion = 'Apa yang dikirim saat memakai AI?';
    const secondAnswer = 'Saat kamu meminta saran atau insight, ringkasan angka dan nama Wallet, kategori, atau Goal yang diperlukan dapat dikirim ke Groq untuk diproses.';

    await fireEvent.press(getByLabelText(firstQuestion));
    await fireEvent.press(getByLabelText(secondQuestion));

    expect(getByText(firstAnswer)).toBeTruthy();
    expect(getByText(secondAnswer)).toBeTruthy();

    await fireEvent.press(getByLabelText(firstQuestion));

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
