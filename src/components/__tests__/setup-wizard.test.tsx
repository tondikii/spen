import { cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';

import { SetupWizard } from '@/components/setup-wizard';
import { currencyOptions, setSelectedLocale } from '@/services/settings-service';
import { changeLocale } from '@/i18n';

describe('SetupWizard', () => {
  afterEach(async () => {
    cleanup();
    setSelectedLocale('id');
    await changeLocale('id');
  });

  it('menampilkan pilihan bahasa dan currency tanpa periode atau tipe wallet', async () => {
    const onComplete = jest.fn();
    const { getByLabelText, getByText, queryByText } = await render(
      <SetupWizard onComplete={onComplete} />,
    );

    expect(getByText('Pilih bahasa aplikasi')).toBeTruthy();
    expect(getByLabelText('Pilih bahasa Bahasa Indonesia')).toBeTruthy();
    expect(getByLabelText('Pilih bahasa Inggris')).toBeTruthy();
    await fireEvent.press(getByLabelText('Lanjut'));
    expect(getByText('Buat rencana untuk uangmu.')).toBeTruthy();
    await fireEvent.press(getByLabelText('Mulai'));
    expect(getByText('Buat Wallet')).toBeTruthy();
    await fireEvent.press(getByLabelText('Lanjut'));
    expect(getByText('Pilih mata uang')).toBeTruthy();
    currencyOptions.forEach((option) => {
      expect(getByLabelText(`Pilih mata uang ${option}`)).toBeTruthy();
    });
    expect(queryByText(/periode/i)).toBeNull();
    expect(queryByText(/tipe wallet/i)).toBeNull();
  });

  it('mengubah bahasa dari langkah awal onboarding', async () => {
    const onComplete = jest.fn();
    const { getByLabelText, getByText } = await render(<SetupWizard onComplete={onComplete} />);

    await fireEvent.press(getByLabelText('Pilih bahasa Inggris'));

    await waitFor(() => expect(getByText('Choose the app language')).toBeTruthy());
  });

  it('menyimpan wallet pertama dan currency saat masuk ke Spen', async () => {
    const onComplete = jest.fn();
    const { getByLabelText } = await render(<SetupWizard onComplete={onComplete} />);

    await fireEvent.press(getByLabelText('Lanjut'));
    await fireEvent.press(getByLabelText('Mulai'));
    await fireEvent.changeText(getByLabelText('Nama Wallet pertama'), 'BCA');
    await fireEvent.changeText(getByLabelText('Saldo awal Wallet pertama'), '2000000');
    await fireEvent.press(getByLabelText('Lanjut'));
    await fireEvent.press(getByLabelText('Pilih mata uang USD'));
    await fireEvent.press(getByLabelText('Masuk ke Spen'));

    await waitFor(() =>
      expect(onComplete).toHaveBeenCalledWith(
        [{ name: 'BCA', initialBalance: 2000000 }],
        'USD',
        'id',
      ),
    );
  });

  it('memungkinkan menambahkan beberapa Wallet sebelum menyelesaikan onboarding', async () => {
    const onComplete = jest.fn();
    const { getByLabelText } = await render(<SetupWizard onComplete={onComplete} />);

    await fireEvent.press(getByLabelText('Lanjut'));
    await fireEvent.press(getByLabelText('Mulai'));
    await fireEvent.changeText(getByLabelText('Nama Wallet pertama'), 'BCA');
    await fireEvent.changeText(getByLabelText('Saldo awal Wallet pertama'), '2000000');
    await fireEvent.press(getByLabelText('Tambah Wallet'));
    await fireEvent.changeText(getByLabelText('Nama Wallet 2'), 'Tunai');
    await fireEvent.changeText(getByLabelText('Saldo awal Wallet 2'), '500000');
    await fireEvent.press(getByLabelText('Lanjut'));
    await fireEvent.press(getByLabelText('Masuk ke Spen'));

    await waitFor(() =>
      expect(onComplete).toHaveBeenCalledWith(
        [
          { name: 'BCA', initialBalance: 2000000 },
          { name: 'Tunai', initialBalance: 500000 },
        ],
        'IDR',
        'id',
      ),
    );
  });

  it('bisa berpindah langkah lewat indikator', async () => {
    const onComplete = jest.fn();
    const { getByLabelText, getByText } = await render(<SetupWizard onComplete={onComplete} />);

    await fireEvent.press(getByLabelText('Buka langkah 4'));
    expect(getByText('Pilih mata uang')).toBeTruthy();

    await fireEvent.press(getByLabelText('Buka langkah 1'));
    expect(getByText('Pilih bahasa aplikasi')).toBeTruthy();
  });
});
