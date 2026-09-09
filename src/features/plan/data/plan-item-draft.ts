import { AppError } from '@/utils/app-error';

import type { PlanItemType } from '../model';
import { databaseId } from './plan-item-mapping';

/** Draft item plan dari form/saran AI, sebelum divalidasi dan disimpan. */
export type PlanItemDraft = {
  type: PlanItemType;
  categoryId: string;
  targetAmount: number;
  walletId?: string;
  name?: string;
  date?: string;
};

/** Validasi draft item plan (nominal, kategori, dan dompet untuk income). */
export function validatePlanItem(draft: PlanItemDraft) {
  if (
    !Number.isSafeInteger(draft.targetAmount) ||
    draft.targetAmount < 0 ||
    (draft.type === 'expense' && draft.targetAmount <= 0)
  )
    throw new AppError('validation', { targetAmount: draft.targetAmount });
  databaseId(draft.categoryId);
  if (draft.type === 'income') {
    if (!draft.walletId) throw new AppError('validation');
    databaseId(draft.walletId);
  }
}
