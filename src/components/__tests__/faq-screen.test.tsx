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
    expect(faqEntries).toHaveLength(4);
    expect(getByText('Apa yang terjadi saat memakai AI?')).toBeTruthy();
    expect(queryByText('Data utama tersimpan lokal. Saat kamu memicu AI, ringkasan angka serta nama Wallet, kategori, dan Goal yang diperlukan dikirim ke Groq. AI hanya memberi saran atau insight; saat layanan tidak tersedia, Spen memakai fallback lokal.')).toBeNull();

    await fireEvent.press(getByLabelText('Apa yang terjadi saat memakai AI?'));

    expect(getByText('Data utama tersimpan lokal. Saat kamu memicu AI, ringkasan angka serta nama Wallet, kategori, dan Goal yang diperlukan dikirim ke Groq. AI hanya memberi saran atau insight; saat layanan tidak tersedia, Spen memakai fallback lokal.')).toBeTruthy();
  });

  it('membuka beberapa jawaban tanpa menutup jawaban lain dan dapat menutupnya kembali', async () => {
    const { getByLabelText, getByText, queryByText } = await render(
      <AppThemeProvider>
        <FaqScreen onBack={() => undefined} />
      </AppThemeProvider>,
    );
    const firstQuestion = 'Apa yang terjadi saat memakai AI?';
    const firstAnswer = 'Data utama tersimpan lokal. Saat kamu memicu AI, ringkasan angka serta nama Wallet, kategori, dan Goal yang diperlukan dikirim ke Groq. AI hanya memberi saran atau insight; saat layanan tidak tersedia, Spen memakai fallback lokal.';
    const secondQuestion = 'Apa yang terjadi saat backup dan restore?';
    const secondAnswer = 'Backup dilakukan manual sebagai file JSON. Restore menghapus lalu mengganti seluruh data lokal setelah kamu mengonfirmasinya.';

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
