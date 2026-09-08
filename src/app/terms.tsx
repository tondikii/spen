import { PublicDocumentScreen } from '@/features/settings';
import { termsDocument } from '@/lib/public-documents';

export default function TermsRoute() {
  return <PublicDocumentScreen document={termsDocument} />;
}
