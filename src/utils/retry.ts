/**
 * Generic retry with backoff.
 * `delays` = ms to wait after each failure before retrying. Length = max retries.
 */
export async function retryWithBackoff<T>(action: () => Promise<T>, delays: number[]): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= delays.length; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
      const delay = delays[attempt];
      if (delay === undefined) break;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

/** Default write retry (journal_mode WAL etc) */
export function retryDatabase<T>(action: () => Promise<T>): Promise<T> {
  return retryWithBackoff(action, [60, 120, 240]);
}

/** Default read retry (SQLite busy) */
export function retryDatabaseRead<T>(read: () => Promise<T>): Promise<T> {
  return retryWithBackoff(read, [80, 180, 360]);
}
