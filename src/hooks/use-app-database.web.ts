import type { SQLiteDatabase } from 'expo-sqlite';

export default function useAppDatabase(): SQLiteDatabase {
  throw new Error('Database lokal hanya tersedia di aplikasi native.');
}
