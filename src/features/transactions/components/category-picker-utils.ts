import type { Category, TransactionType } from '@/types/domain';

const CATEGORY_COLUMNS = 4;

export function filterTransactionCategories(categories: Category[], type: TransactionType) {
  if (type === 'adjustment') return [];
  const categoryType = type === 'income' ? 'income' : 'expense';
  return categories.filter(
    (category) =>
      category.type === categoryType &&
      !category.archived &&
      category.systemKey !== 'openingBalance',
  );
}

export function categoryRows(categories: Category[]) {
  const rows: (Category | null)[][] = [];
  for (let index = 0; index < categories.length; index += CATEGORY_COLUMNS) {
    const row = categories.slice(index, index + CATEGORY_COLUMNS) as (Category | null)[];
    while (row.length < CATEGORY_COLUMNS) row.push(null);
    rows.push(row);
  }
  return rows;
}
