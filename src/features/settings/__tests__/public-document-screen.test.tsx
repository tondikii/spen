import { fireEvent, render } from '@testing-library/react-native';

import { PublicDocumentScreen, termsDocument } from '@/features/settings';
import { AppThemeProvider } from '@/providers/theme-provider';

describe('PublicDocumentScreen', () => {
  it('menampilkan dokumen dan penanda review pemilik', async () => {
    const { getByText } = await render(
      <AppThemeProvider>
        <PublicDocumentScreen document={termsDocument} />
      </AppThemeProvider>,
    );

    expect(getByText('Syarat & Ketentuan')).toBeTruthy();
    expect(getByText('Draf untuk ditinjau')).toBeTruthy();
    expect(getByText('Berlaku sejak 4 September 2026')).toBeTruthy();
  });

  it('tidak menampilkan tombol kembali agar memakai tombol back perangkat', async () => {
    const { getByLabelText } = await render(
      <AppThemeProvider>
        <PublicDocumentScreen document={termsDocument} />
      </AppThemeProvider>,
    );

    expect(() => getByLabelText('Kembali')).toThrow();
  });
});
