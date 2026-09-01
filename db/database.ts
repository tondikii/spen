import type { SQLiteDatabase } from 'expo-sqlite';

export async function configureDatabase(database: SQLiteDatabase) {
  await database.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
}
