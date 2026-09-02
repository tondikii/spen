import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { SetupWizard } from '@/components/setup-wizard';

describe('SetupWizard', () => {
  it('menampilkan tiga langkah tanpa periode atau tipe wallet', async () => {
    const onComplete = jest.fn();
    const { getByLabelText, getByText, queryByText } = await render(<SetupWizard onComplete={onComplete} />);

    expect(getByText('SPEN, RUANG UNTUK UANGMU')).toBeTruthy();
    await fireEvent.press(getByLabelText('Lanjut'));
    expect(getByText('WALLET PERTAMA')).toBeTruthy();
    await fireEvent.press(getByLabelText('Lanjut'));
    expect(getByText('Pilih mata uang')).toBeTruthy();
    expect(queryByText(/periode/i)).toBeNull();
    expect(queryByText(/tipe wallet/i)).toBeNull();
  });

  it('menyimpan wallet pertama dan currency saat masuk ke Spen', async () => {
    const onComplete = jest.fn();
    const { getByLabelText } = await render(<SetupWizard onComplete={onComplete} />);

    await fireEvent.press(getByLabelText('Lanjut'));
    await fireEvent.changeText(getByLabelText('Nama wallet pertama'), 'BCA');
    await fireEvent.changeText(getByLabelText('Saldo awal wallet pertama'), '2000000');
    await fireEvent.press(getByLabelText('Lanjut'));
    await fireEvent.press(getByLabelText('Pilih mata uang USD'));
    await fireEvent.press(getByLabelText('Masuk ke Spen'));

    await waitFor(() => expect(onComplete).toHaveBeenCalledWith('BCA', 2000000, 'USD'));
  });
});
