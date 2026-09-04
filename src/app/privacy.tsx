import PublicDocumentScreen from '@/components/public-document-screen';
import { privacyDocument } from '@/lib/public-documents';
import { useRouter } from 'expo-router';

export default function PrivacyRoute() {
  const router = useRouter();
  return <PublicDocumentScreen document={privacyDocument} onBack={() => router.back()} />;
}
