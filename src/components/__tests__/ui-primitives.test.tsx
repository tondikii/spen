import { fireEvent, render } from '@testing-library/react-native';

import {
  BoxedCard,
  PageHeader,
  PrimaryButton,
  SectionHeader,
  StatusBadge,
} from '@/components/ui-primitives';

describe('UI primitives', () => {
  it('exposes labelled actions and status through the shared vocabulary', async () => {
    const onPress = jest.fn();
    const { getByLabelText, getByText } = await render(
      <BoxedCard>
        <PageHeader eyebrow="SPEN" title="Beranda" />
        <SectionHeader title="Wallet" action="Tambah Wallet" onPress={onPress} />
        <StatusBadge label="Tercapai" tone="positive" />
        <PrimaryButton label="Simpan" onPress={onPress} />
      </BoxedCard>,
    );

    expect(getByText('Beranda')).toBeTruthy();
    expect(getByText('Tambah Wallet')).toHaveProp('numberOfLines', 1);
    expect(getByLabelText('Tercapai')).toBeTruthy();
    fireEvent.press(getByLabelText('Tambah Wallet'));
    fireEvent.press(getByLabelText('Simpan'));
    expect(onPress).toHaveBeenCalledTimes(2);
  });
});
