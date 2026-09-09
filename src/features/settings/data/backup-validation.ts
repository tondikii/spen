import { AppError } from '@/utils/app-error';

import { BACKUP_MAX_JSON_LENGTH, BACKUP_MAX_RECORDS, BACKUP_VERSION } from './backup-format';
import type { BackupPayload } from './backup-format';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isArrayOfRecords(value: unknown) {
  return Array.isArray(value) && value.every(isRecord);
}

export function parseBackupPayload(value: string | unknown): BackupPayload {
  let parsed: unknown = value;
  if (typeof value === 'string') {
    if (value.length > BACKUP_MAX_JSON_LENGTH) throw new AppError('backupInvalid');
    try {
      parsed = JSON.parse(value) as unknown;
    } catch {
      throw new AppError('backupInvalid');
    }
  }
  if (!isRecord(parsed) || parsed.version !== BACKUP_VERSION || !isRecord(parsed.data)) {
    throw new AppError('backupInvalid', { version: BACKUP_VERSION });
  }
  const data = parsed.data;
  const keys = [
    'wallets',
    'categories',
    'transactions',
    'budgetPeriods',
    'budgetPlans',
    'incomeItems',
    'fixedExpenseItems',
    'allocationItems',
    'expenseItems',
    'goals',
    'settings',
  ];
  if (!keys.every((key) => isArrayOfRecords(data[key]))) {
    throw new AppError('backupInvalid');
  }
  const totalRecords = keys.reduce((total, key) => total + (data[key] as unknown[]).length, 0);
  if (totalRecords > BACKUP_MAX_RECORDS) throw new AppError('backupInvalid');
  return parsed as unknown as BackupPayload;
}
