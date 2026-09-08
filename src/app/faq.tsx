import { useRouter } from 'expo-router';

import { FaqScreen } from '@/features/settings';

export default function FaqRoute() {
  const router = useRouter();

  return <FaqScreen onBack={() => router.replace('/settings')} />;
}
