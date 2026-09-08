import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The module reads `import.meta.env` once at import time, so each case needs a fresh
// module registry rather than a re-read.
beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('COMPANY_NAME', () => {
  it('falls back to an empty string when the variable is unset', async () => {
    // given — the whole point of the `??`: templates must never render "undefined"
    vi.stubEnv('PUBLIC_COMPANY_NAME', undefined);

    // when
    const { COMPANY_NAME } = await import('./company');

    // then
    expect(COMPANY_NAME).toBe('');
  });

  it('passes the configured name through unchanged', async () => {
    // given
    vi.stubEnv('PUBLIC_COMPANY_NAME', 'Some Org GmbH');

    // when
    const { COMPANY_NAME } = await import('./company');

    // then
    expect(COMPANY_NAME).toBe('Some Org GmbH');
  });
});
