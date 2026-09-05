import type { SQLiteDatabase } from 'expo-sqlite';
import { AppError } from '@/lib/app-error';

export default function useAppDatabase(): SQLiteDatabase {
  throw new AppError('unknown');
}
