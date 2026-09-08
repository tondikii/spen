import type { SQLiteDatabase } from 'expo-sqlite';

import { AppError } from '@/utils/app-error';

/**
 * Parses a prefixed ID like `wallet-12` or `category-3` into numeric DB id.
 * Supports multiple prefixes; strips all matching prefixes before parsing.
 */
export function parsePrefixedId(
  value: string | number | null,
  prefixes: string[],
  errorMessage: string,
): number | null {
  if (value === null || value === '') return null;
  if (typeof value === 'number') {
    if (!Number.isInteger(value) || value < 1)
      throw new AppError('validation', undefined, errorMessage);
    return value;
  }
  let stripped = String(value);
  for (const prefix of prefixes) {
    if (stripped.startsWith(prefix)) stripped = stripped.slice(prefix.length);
  }
  // Also support generic regex fallback for compound prefixes like "income-item-"
  const id = Number(stripped);
  if (!Number.isInteger(id) || id < 1) throw new AppError('validation', undefined, errorMessage);
  return id;
}

/**
 * Parses required prefixed ID — throws if null/empty.
 */
export function parseRequiredPrefixedId(
  value: string | number,
  prefixes: string[],
  errorMessage: string,
): number {
  const result = parsePrefixedId(value, prefixes, errorMessage);
  if (result === null) throw new AppError('validation', undefined, errorMessage);
  return result;
}

/**
 * Centralized exclusive-write helper. Supports both modern
 * `withExclusiveTransactionAsync` and fallback for test doubles.
 */
export async function withExclusiveWrite<T>(
  database: SQLiteDatabase,
  action: (connection: SQLiteDatabase) => Promise<T>,
): Promise<T> {
  const conn = database as SQLiteDatabase & {
    withExclusiveTransactionAsync?: (task: (tx: SQLiteDatabase) => Promise<void>) => Promise<void>;
  };
  let result: T;
  if (conn.withExclusiveTransactionAsync) {
    await conn.withExclusiveTransactionAsync(async (transaction) => {
      result = await action(transaction as unknown as SQLiteDatabase);
    });
  } else {
    result = await action(database);
  }
  return result!;
}
