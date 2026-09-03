const RETRY_DELAYS_MS = [80, 180, 360];

/** Read queries can safely be repeated when SQLite is briefly busy. */
export async function retryDatabaseRead<T>(read: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await read();
    } catch (error) {
      lastError = error;
      const delay = RETRY_DELAYS_MS[attempt];
      if (delay === undefined) break;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
