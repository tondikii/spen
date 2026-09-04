import PublicDocumentScreen from '@/components/public-document-screen';
import { termsDocument } from '@/lib/public-documents';
import { useRouter } from 'expo-router';

export default function TermsRoute() {
  const router = useRouter();
  return <PublicDocumentScreen document={termsDocument} onBack={() => router.back()} />;
}
