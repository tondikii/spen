import { fireEvent, render } from '@testing-library/react-native';

import FaqScreen from '@/components/faq-screen';
import { AppThemeProvider } from '@/components/theme-provider';
import { faqEntries } from '@/lib/faq';

describe('FaqScreen', () => {
  it('menampilkan FAQ utama dan membuka jawaban yang dipilih', async () => {
    const { getByText, getByLabelText, queryByText } = await render(
      <AppThemeProvider>
        <FaqScreen onBack={() => undefined} />
      </AppThemeProvider>,
    );

    expect(getByText('FAQ')).toBeTruthy();
    expect(faqEntries).toHaveLength(8);
    expect(getByText('Apakah data dan input AI dikirim ke internet?')).toBeTruthy();
    expect(queryByText('Data keuangan tersimpan lokal. Saat kamu memicu AI, ringkasan angka serta nama Wallet, kategori, dan Goal yang diperlukan dikirim ke Groq untuk diproses.')).toBeNull();

    await fireEvent.press(getByLabelText('Apakah data dan input AI dikirim ke internet?'));

    expect(getByText('Data keuangan tersimpan lokal. Saat kamu memicu AI, ringkasan angka serta nama Wallet, kategori, dan Goal yang diperlukan dikirim ke Groq untuk diproses.')).toBeTruthy();
  });

  it('membuka beberapa jawaban tanpa menutup jawaban lain dan dapat menutupnya kembali', async () => {
    const { getByLabelText, getByText, queryByText } = await render(
      <AppThemeProvider>
        <FaqScreen onBack={() => undefined} />
      </AppThemeProvider>,
    );
    const firstQuestion = 'Apakah data dan input AI dikirim ke internet?';
    const firstAnswer = 'Data keuangan tersimpan lokal. Saat kamu memicu AI, ringkasan angka serta nama Wallet, kategori, dan Goal yang diperlukan dikirim ke Groq untuk diproses.';
    const secondQuestion = 'Apakah AI mengubah data atau tetap bekerja tanpa internet?';
    const secondAnswer = 'AI hanya memberi saran atau insight. Data berubah setelah kamu melakukan tindakan seperti Terapkan atau menyimpan Transaksi. Saat layanan AI tidak tersedia, saran Budget plan dan insight report memakai fallback lokal.';

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
