import { fireEvent, render } from '@testing-library/react-native';

import { AppThemeProvider } from '@/components/theme-provider';
import PublicDocumentScreen from '@/components/public-document-screen';
import { termsDocument } from '@/lib/public-documents';

describe('PublicDocumentScreen', () => {
  it('menampilkan dokumen dan penanda review pemilik', async () => {
    const { getByText } = await render(
      <AppThemeProvider>
        <PublicDocumentScreen document={termsDocument} onBack={() => undefined} />
      </AppThemeProvider>,
    );

    expect(getByText('Syarat & Ketentuan')).toBeTruthy();
    expect(getByText('Draf untuk ditinjau')).toBeTruthy();
    expect(getByText('Berlaku sejak 4 September 2026')).toBeTruthy();
  });

  it('meneruskan aksi kembali ke route', async () => {
    const onBack = jest.fn();
    const { getByLabelText } = await render(
      <AppThemeProvider>
        <PublicDocumentScreen document={termsDocument} onBack={onBack} />
      </AppThemeProvider>,
    );

    fireEvent.press(getByLabelText('Kembali'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
