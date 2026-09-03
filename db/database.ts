import type { SQLiteDatabase } from 'expo-sqlite';

export async function configureDatabase(database: SQLiteDatabase) {
  await retryDatabase(() => database.execAsync('PRAGMA journal_mode = WAL;'));
  await retryDatabase(() => database.execAsync('PRAGMA foreign_keys = ON;'));
}

async function retryDatabase(action: () => Promise<void>, attempts = 3) {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      await action();
      return;
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) await new Promise((resolve) => setTimeout(resolve, 60 * 2 ** attempt));
    }
  }
  throw lastError;
}
