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
  ])('%s leaves back navigation to the device or browser', async (_name, Route) => {
    const { queryByLabelText } = await render(
      <AppThemeProvider>
        <Route />
      </AppThemeProvider>,
    );

    expect(queryByLabelText('Kembali')).toBeNull();
    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
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
