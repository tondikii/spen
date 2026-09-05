import { AppError, getErrorTranslationKey, toAppError } from '@/lib/app-error';

describe('AppError boundary', () => {
  it('keeps a known domain error code and maps it to a translation key', () => {
    const error = new AppError('validation');

    expect(error.code).toBe('validation');
    expect(getErrorTranslationKey(error)).toBe('errors.validation');
  });

  it('hides unknown technical error text behind a generic localized error', () => {
    const error = toAppError(new Error('SQLITE_INTERNAL_SECRET'));

    expect(error.code).toBe('unknown');
    expect(error.message).toBe('Unknown application error');
    expect(getErrorTranslationKey(error)).toBe('errors.unknown');
  });
});
