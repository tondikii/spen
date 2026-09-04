import {
  DEFAULT_WEB_URL,
  getPublicDocumentUrl,
  privacyDocument,
  termsDocument,
} from '@/lib/public-documents';

describe('public document configuration', () => {
  it('builds the document URL from the configured web origin', () => {
    expect(getPublicDocumentUrl('/terms', 'https://spen.example')).toBe('https://spen.example/terms');
    expect(getPublicDocumentUrl('/privacy', 'https://spen.example/')).toBe('https://spen.example/privacy');
  });

  it('uses the local Expo Web origin by default', () => {
    expect(getPublicDocumentUrl('/terms')).toBe(`${DEFAULT_WEB_URL}/terms`);
  });
});

describe('public document content', () => {
  it('contains the owner and effective date in both legal documents', () => {
    expect(termsDocument.owner).toBe('Tondiki Andika');
    expect(termsDocument.effectiveDate).toBe('4 September 2026');
    expect(privacyDocument.owner).toBe('Tondiki Andika');
    expect(privacyDocument.effectiveDate).toBe('4 September 2026');
  });

  it('describes local storage and Groq processing in the privacy document', () => {
    const privacyText = privacyDocument.sections.flatMap((section) => section.paragraphs).join(' ');

    expect(privacyText).toContain('tersimpan lokal');
    expect(privacyText).toContain('Groq');
    expect(privacyText).toContain('nama kategori, Wallet, dan Goal');
  });
});
