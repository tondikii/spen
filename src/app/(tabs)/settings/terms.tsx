import { useRouter } from 'expo-router';

import { PublicDocumentScreen, termsDocument } from '@/features/settings';

export default function TermsRoute() {
  const router = useRouter();

  return (
    <PublicDocumentScreen document={termsDocument} onBack={() => router.replace('/settings')} />
  );
}