import { PublicDocumentScreen } from '@/features/settings';
import { privacyDocument } from '@/lib/public-documents';

export default function PrivacyRoute() {
  return <PublicDocumentScreen document={privacyDocument} />;
}
