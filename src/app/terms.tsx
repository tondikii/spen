import PublicDocumentScreen from '@/components/public-document-screen';
import { termsDocument } from '@/lib/public-documents';

export default function TermsRoute() {
  return <PublicDocumentScreen document={termsDocument} />;
}
