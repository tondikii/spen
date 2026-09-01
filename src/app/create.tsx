import { router } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { TransactionForm } from '@/components/transaction-form';
import mockData from '@/data/mock-data';
import { deleteMockTransaction, saveMockTransaction } from '@/services/transaction-service';
import type { Transaction } from '@/types/domain';

export default function CreateTransactionScreen() {
  const { transactionId } = useLocalSearchParams<{ transactionId?: string }>();
  const [transactions, setTransactions] = useState<Transaction[]>(mockData.transactions);
  const transaction = transactions.find((item) => item.id === transactionId);

  return <TransactionForm
    mode={transaction ? 'edit' : 'create'}
    transaction={transaction}
    onClose={() => router.back()}
    onSave={(draft) => { setTransactions((current) => saveMockTransaction(current, draft, transaction?.id)); router.back(); }}
    onDelete={transaction ? () => { setTransactions((current) => deleteMockTransaction(current, transaction.id)); router.back(); } : undefined}
  />;
}
