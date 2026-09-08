import type { SQLiteDatabase } from 'expo-sqlite';

import { retryDatabase } from '@/lib/retry';

export async function configureDatabase(database: SQLiteDatabase) {
  await retryDatabase(() => database.execAsync('PRAGMA journal_mode = WAL;'));
  await retryDatabase(() => database.execAsync('PRAGMA foreign_keys = ON;'));
}
