import PublicDocumentScreen from '@/components/public-document-screen';
import { privacyDocument } from '@/lib/public-documents';

export default function PrivacyRoute() {
  return <PublicDocumentScreen document={privacyDocument} />;
}
