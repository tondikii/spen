import { fireEvent, render } from '@testing-library/react-native';

import { BoxedCard, PageHeader, PrimaryButton } from '@/components/ui-primitives';

describe('UI primitives', () => {
  it('exposes labelled actions through the shared vocabulary', async () => {
    const onPress = jest.fn();
    const { getByLabelText, getByText } = await render(
      <BoxedCard>
        <PageHeader eyebrow="SPEN" title="Beranda" />
        <PrimaryButton label="Simpan" onPress={onPress} />
      </BoxedCard>,
    );

    expect(getByText('Beranda')).toBeTruthy();
    fireEvent.press(getByLabelText('Simpan'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
