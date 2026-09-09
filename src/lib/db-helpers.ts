import type { SQLiteDatabase } from 'expo-sqlite';

import { AppError } from '@/utils/app-error';

/** Domain `validation` error for an unparseable prefixed id (ADR-0006: language-neutral). */
function invalidPrefixedId(detail?: string | number) {
  return detail === undefined
    ? new AppError('validation')
    : new AppError('validation', { value: detail });
}

/**
 * Parses a prefixed ID like `wallet-12` or `category-3` into numeric DB id.
 * Supports multiple prefixes; strips all matching prefixes before parsing.
 * Throws a code-only domain error on invalid input; the offending value is
 * kept on `error.params` when `detail` is provided.
 */
export function parsePrefixedId(
  value: string | number | null,
  prefixes: string[],
  detail?: string | number,
): number | null {
  if (value === null || value === '') return null;
  if (typeof value === 'number') {
    if (!Number.isInteger(value) || value < 1) throw invalidPrefixedId(detail);
    return value;
  }
  let stripped = String(value);
  for (const prefix of prefixes) {
    if (stripped.startsWith(prefix)) stripped = stripped.slice(prefix.length);
  }
  // Also support generic regex fallback for compound prefixes like "income-item-"
  const id = Number(stripped);
  if (!Number.isInteger(id) || id < 1) throw invalidPrefixedId(detail);
  return id;
}

/**
 * Parses required prefixed ID — throws if null/empty.
 */
export function parseRequiredPrefixedId(
  value: string | number,
  prefixes: string[],
  detail?: string | number,
): number {
  const result = parsePrefixedId(value, prefixes, detail);
  if (result === null) throw invalidPrefixedId(detail);
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
