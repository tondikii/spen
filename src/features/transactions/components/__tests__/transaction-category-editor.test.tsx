import { render } from '@testing-library/react-native';

import { TransactionCategoryEditor } from '@/features/transactions/components/transaction-category-editor';

describe('TransactionCategoryEditor', () => {
  it('keeps library icon cells at six-column width on the last row', async () => {
    const { getByLabelText } = await render(
      <TransactionCategoryEditor
        editing={false}
        type="expense"
        name=""
        icon="silverware-fork-knife"
        saving={false}
        onNameChange={jest.fn()}
        onIconChange={jest.fn()}
        onCancel={jest.fn()}
        onSave={jest.fn()}
      />,
    );

    const firstIcon = getByLabelText('Pilih ikon silverware-fork-knife');
    const seventhIcon = getByLabelText('Pilih ikon bottle-soda');

    expect(firstIcon.parent?.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: 39 })]),
    );
    expect(seventhIcon.parent?.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: 39 })]),
    );
  });
});
