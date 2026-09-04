import { fireEvent, render } from '@testing-library/react-native';

import FaqRoute from '@/app/faq';
import PrivacyRoute from '@/app/privacy';
import TermsRoute from '@/app/terms';
import { AppThemeProvider } from '@/components/theme-provider';

const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, back: mockBack }),
}));

describe('public document and FAQ route navigation', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockBack.mockClear();
  });

  it.each([
    ['terms', TermsRoute],
    ['privacy', PrivacyRoute],
  ])('%s returns to the web home route without relying on history', async (_name, Route) => {
    const { getByLabelText } = await render(
      <AppThemeProvider>
        <Route />
      </AppThemeProvider>,
    );

    fireEvent.press(getByLabelText('Kembali'));

    expect(mockReplace).toHaveBeenCalledWith('/');
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('FAQ returns to Settings instead of the default Beranda tab', async () => {
    const { getByLabelText } = await render(
      <AppThemeProvider>
        <FaqRoute />
      </AppThemeProvider>,
    );

    fireEvent.press(getByLabelText('Kembali'));

    expect(mockReplace).toHaveBeenCalledWith('/settings');
    expect(mockBack).not.toHaveBeenCalled();
  });
});
