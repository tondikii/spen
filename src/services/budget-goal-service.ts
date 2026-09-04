import type { SQLiteDatabase } from 'expo-sqlite';
import { getDatabasePlanView } from '@/services/plan-service';
import { getDatabaseTransactionCategories } from '@/services/transaction-service';

export async function getBudgetGoalOverview(database: SQLiteDatabase) {
  return Promise.all([getDatabasePlanView(database), getDatabaseTransactionCategories(database)]);
}
