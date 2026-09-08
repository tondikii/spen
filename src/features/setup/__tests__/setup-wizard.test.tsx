import { cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';

import { SetupWizard } from '@/features/setup';
import { currencyOptions, setSelectedLocale } from '@/services/settings-service';
import { changeLocale } from '@/i18n';

describe('SetupWizard', () => {
  beforeEach(async () => {
    setSelectedLocale('en');
    await changeLocale('en');
  });

  afterEach(async () => {
    cleanup();
    setSelectedLocale('en');
    await changeLocale('en');
  });

  it('memulai dalam bahasa Inggris dan menampilkan tiga langkah onboarding', async () => {
    const onComplete = jest.fn();
    const { getByLabelText, getByText, queryByText } = await render(
      <SetupWizard onComplete={onComplete} />,
    );

    expect(getByText('Choose the app language')).toBeTruthy();
    expect(getByLabelText('Choose language English')).toBeTruthy();
    expect(getByLabelText('Choose language Indonesian')).toBeTruthy();
    await fireEvent.press(getByLabelText('Start'));
    expect(getByText('Create Wallet')).toBeTruthy();
    expect(queryByText('Make a plan for your money.')).toBeNull();
    await fireEvent.press(getByLabelText('Next'));
    expect(getByText('Choose currency')).toBeTruthy();
    currencyOptions.forEach((option) => {
      expect(getByLabelText(`Choose currency ${option}`)).toBeTruthy();
    });
    expect(queryByText(/periode/i)).toBeNull();
    expect(queryByText(/tipe wallet/i)).toBeNull();
  });

  it('mengubah bahasa dari langkah awal onboarding', async () => {
    const onComplete = jest.fn();
    const { getByLabelText, getByText } = await render(<SetupWizard onComplete={onComplete} />);

    await fireEvent.press(getByLabelText('Choose language Indonesian'));

    await waitFor(() => expect(getByText('Pilih bahasa aplikasi')).toBeTruthy());
  });

  it('menyimpan wallet pertama dan currency saat masuk ke Spen', async () => {
    const onComplete = jest.fn();
    const { getByLabelText } = await render(<SetupWizard onComplete={onComplete} />);

    await fireEvent.press(getByLabelText('Start'));
    await fireEvent.changeText(getByLabelText('First Wallet name'), 'BCA');
    await fireEvent.changeText(getByLabelText('First Wallet starting balance'), '2000000');
    await fireEvent.press(getByLabelText('Next'));
    await fireEvent.press(getByLabelText('Choose currency USD'));
    await fireEvent.press(getByLabelText('Enter Spen'));

    await waitFor(() =>
      expect(onComplete).toHaveBeenCalledWith(
        [{ name: 'BCA', initialBalance: 2000000 }],
        'USD',
        'en',
      ),
    );
  });

  it('memungkinkan menambahkan beberapa Wallet sebelum menyelesaikan onboarding', async () => {
    const onComplete = jest.fn();
    const { getByLabelText } = await render(<SetupWizard onComplete={onComplete} />);

    await fireEvent.press(getByLabelText('Start'));
    await fireEvent.changeText(getByLabelText('First Wallet name'), 'BCA');
    await fireEvent.changeText(getByLabelText('First Wallet starting balance'), '2000000');
    await fireEvent.press(getByLabelText('Add Wallet'));
    await fireEvent.changeText(getByLabelText('Wallet name 2'), 'Tunai');
    await fireEvent.changeText(getByLabelText('Wallet 2 starting balance'), '500000');
    await fireEvent.press(getByLabelText('Next'));
    await fireEvent.press(getByLabelText('Enter Spen'));

    await waitFor(() =>
      expect(onComplete).toHaveBeenCalledWith(
        [
          { name: 'BCA', initialBalance: 2000000 },
          { name: 'Tunai', initialBalance: 500000 },
        ],
        'IDR',
        'en',
      ),
    );
  });

  it('bisa berpindah langkah lewat indikator', async () => {
    const onComplete = jest.fn();
    const { getByLabelText, getByText } = await render(<SetupWizard onComplete={onComplete} />);

    await fireEvent.press(getByLabelText('Open step 3'));
    expect(getByText('Choose currency')).toBeTruthy();

    await fireEvent.press(getByLabelText('Open step 1'));
    expect(getByText('Choose the app language')).toBeTruthy();
  });
});
