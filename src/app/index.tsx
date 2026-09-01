import { useRouter } from 'expo-router';

import HomeScreen from '@/components/home-screen';

export default function HomeRoute() {
  const router = useRouter();
  return <HomeScreen onTransactionPress={(transaction) => router.push({ pathname: '/create', params: { transactionId: transaction.id } })} onDailyPress={() => router.push('/daily' as never)} />;
}
