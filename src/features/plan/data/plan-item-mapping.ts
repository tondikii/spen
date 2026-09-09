import { parseRequiredPrefixedId } from '@/lib/db-helpers';

import type { PlanItemType } from '../model';

/**
 * Pemetaan murni tipe item plan → tabel/tipe kategori di DB dan pem-parse id
 * ber-prefiks. Dipakai repository (create/update/delete item) dan sibling
 * data-nya; tidak menyentuh DB langsung.
 */

/** Nama tabel item yang dipakai tipe item plan tertentu. */
export function tableFor(type: PlanItemType) {
  if (type === 'income') return 'income_items';
  if (type === 'fixedExpense') return 'fixed_expense_items';
  if (type === 'allocation') return 'allocation_items';
  return 'expense_items';
}

/** Tipe kategori (kolom categories.type) untuk tipe item plan tertentu. */
export function categoryTypeFor(type: PlanItemType) {
  return type === 'income' ? 'income' : 'expense';
}

/** Mem-parse id ber-prefiks (`category-3`, `income-item-7`, …) ke id numerik DB. */
export function databaseId(value: string | number) {
  return parseRequiredPrefixedId(
    value,
    [
      'category-',
      'wallet-',
      'income-item-',
      'expense-item-',
      'fixed-expense-item-',
      'allocation-item-',
    ],
    `ID plan tidak valid: ${value}`,
  );
}
