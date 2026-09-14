import { useRouter } from 'expo-router';

import { PublicDocumentScreen, privacyDocument } from '@/features/settings';

export default function PrivacyRoute() {
  const router = useRouter();

  return (
    <PublicDocumentScreen document={privacyDocument} onBack={() => router.replace('/settings')} />
  );
}