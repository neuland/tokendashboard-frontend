import { dict, type Locale } from '~/i18n';

/**
 * A non-2xx response from the usage API. Carries the status so the render path can
 * localise it; the `message` stays English and technical, for logs and stack traces.
 */
export class FetchError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Request failed: ${status}`);
    this.name = 'FetchError';
    this.status = status;
  }
}

/**
 * The detail line shown to the user for a failed load, localised. Fetch errors get a
 * dictionary sentence; anything else falls back to its own message.
 */
export function errorDetail(err: unknown, locale: Locale): string {
  const t = dict(locale);
  if (err instanceof FetchError) {
    return t.common.fetchFailed(err.status);
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return t.common.unknownError;
}
