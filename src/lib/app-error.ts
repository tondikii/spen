export type AppErrorCode = 'unknown' | 'validation' | 'storage' | 'notFound' | 'backupInvalid';

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly params?: Record<string, string | number>;

  constructor(
    code: AppErrorCode,
    params?: Record<string, string | number>,
    message = code === 'unknown' ? 'Unknown application error' : code,
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.params = params;
  }
}

export function toAppError(error: unknown): AppError {
  return error instanceof AppError
    ? error
    : new AppError('unknown', undefined, 'Unknown application error');
}

export function getErrorTranslationKey(error: unknown): `errors.${AppErrorCode}` {
  return `errors.${toAppError(error).code}`;
}
