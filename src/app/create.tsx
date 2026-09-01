import { router } from 'expo-router';

import { TransactionForm } from '@/components/transaction-form';

export default function CreateTransactionScreen() {
  return <TransactionForm mode="create" onClose={() => router.back()} onSave={() => router.back()} />;
}
