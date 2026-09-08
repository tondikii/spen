import { render } from '@testing-library/react-native';

import { CurrencyPicker } from '@/components/currency-picker';
import { LanguagePicker } from '@/components/language-picker';
import { currencyOptions } from '@/lib/selection';

describe('picker option layout', () => {
  it('uses four equal columns for currency options', async () => {
    const { getByLabelText } = await render(<CurrencyPicker selected="IDR" onSelect={jest.fn()} />);

    const firstOption = getByLabelText(`Pilih mata uang ${currencyOptions[0]}`);
    expect(firstOption.parent?.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: '22.5%' })]),
    );
    expect(firstOption.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: '100%' })]),
    );
  });

  it('uses two equal columns for language options', async () => {
    const { getByLabelText } = await render(<LanguagePicker selected="id" onSelect={jest.fn()} />);

    const firstOption = getByLabelText('Pilih bahasa English');
    expect(firstOption.parent?.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: '47%' })]),
    );
    expect(firstOption.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: '100%' })]),
    );
  });
});
