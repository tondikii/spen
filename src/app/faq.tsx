import { useRouter } from 'expo-router';

import FaqScreen from '@/components/faq-screen';

export default function FaqRoute() {
  const router = useRouter();

  return <FaqScreen onBack={() => router.back()} />;
}
