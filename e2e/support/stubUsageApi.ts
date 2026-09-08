import type { Page } from '@playwright/test';

interface StubOptions {
  /** Total input tokens attributed to each provider in the stubbed bucket; 0 by default. */
  claudeTokens?: number;
  copilotTokens?: number;
  /** Delay before fulfilling, to hold the app's loading state open long enough to assert against. */
  delayMs?: number;
}

function providerBucket(tokens: number) {
  return {
    modelFamilies:
      tokens > 0
        ? [
            {
              modelFamily: 'family',
              models: [
                {
                  model: 'model',
                  tokens: { inputTokens: tokens, outputTokens: 0, cacheWriteTokens: 0, cacheReadTokens: 0, costUsdCent: 0, estimatedCo2: 0 },
                },
              ],
            },
          ]
        : [],
    pluginInstallations: 0,
  };
}

/**
 * Stubs the two aggregate endpoints the home page fetches, so specs run without a real
 * backend. `fetchAllUsageSeries` (see `src/lib/api.ts`) always requests every provider
 * and filters client-side, so one bucket dated `to` covers whichever providers a spec's
 * URL selects.
 */
export async function stubUsageApi(page: Page, { claudeTokens = 0, copilotTokens = 0, delayMs = 0 }: StubOptions = {}): Promise<void> {
  await page.route('**/api/usage/all/series/v1**', async (route) => {
    const url = new URL(route.request().url());
    const to = url.searchParams.get('to');
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        history: {
          from: url.searchParams.get('from'),
          to,
          buckets: [{ date: to, providers: { CLAUDE: providerBucket(claudeTokens), COPILOT: providerBucket(copilotTokens) } }],
        },
      }),
    });
  });

  await page.route('**/api/usage/all/v1**', async (route) => {
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ providerUsages: {} }) });
  });
}
