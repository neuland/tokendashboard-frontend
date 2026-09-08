import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchAllUsageSeries, fetchProviderUsage, fetchProviderUsageSeries, fetchUsageOverview } from './api';
import { FetchError } from './errors';

function rawTokens(inputTokens: number, overrides: Partial<Record<string, number>> = {}) {
  return {
    inputTokens: overrides.inputTokens ?? inputTokens,
    outputTokens: overrides.outputTokens ?? 0,
    cacheWriteTokens: overrides.cacheWriteTokens ?? 0,
    cacheReadTokens: overrides.cacheReadTokens ?? 0,
    costUsdCent: overrides.costUsdCent ?? 0,
    estimatedCo2: overrides.estimatedCo2 ?? 0,
  };
}

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as Response;
}

function mockFetch(body: unknown, ok = true, status = 200) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(body, ok, status)));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchProviderUsage', () => {
  it('maps model families and overall tokens onto the domain type', async () => {
    // given
    mockFetch({
      usage: {
        from: '2026-07-01',
        to: '2026-07-01',
        provider: {
          providerName: 'CLAUDE',
          modelFamilies: [
            { modelFamily: 'sonnet', models: [{ model: 'sonnet-5', tokens: rawTokens(100) }] },
          ],
        },
      },
      activeUsersLast4Weeks: 7,
    });

    // when
    const usage = await fetchProviderUsage('claude', { from: '2026-07-01', to: '2026-07-01' });

    // then
    expect(usage.provider).toBe('claude');
    expect(usage.modelFamilies).toEqual([
      {
        modelFamily: 'sonnet',
        models: [{ model: 'sonnet-5', tokens: { input: 100, output: 0, cacheWrite: 0, cacheRead: 0 }, tokensTotal: 100, estimatedCo2: 0, costUsdCent: 0 }],
        tokens: { input: 100, output: 0, cacheWrite: 0, cacheRead: 0 },
        tokensTotal: 100,
        estimatedCo2: 0,
        costUsdCent: 0,
      },
    ]);
    expect(usage.overallTokensTotal).toBe(100);
    expect(usage.activeUsers).toBe(7);
  });

  it('falls back to empty families and zero tokens when the provider has no data yet', async () => {
    // given — the backend sends `provider: null` for a period with no report yet
    mockFetch({
      usage: {
        from: '2026-07-22',
        to: '2026-07-22',
        provider: null,
      },
      activeUsersLast4Weeks: 0,
    });

    // when
    const usage = await fetchProviderUsage('claude', { from: '2026-07-22', to: '2026-07-22' });

    // then
    expect(usage.modelFamilies).toEqual([]);
    expect(usage.overallTokens).toEqual({ input: 0, output: 0, cacheWrite: 0, cacheRead: 0 });
    expect(usage.overallTokensTotal).toBe(0);
  });

  it('rolls model leaves up into family and provider totals', async () => {
    // given — two opus models with identical counts, so the family sum is exactly doubled
    const opus = rawTokens(0, { inputTokens: 1, outputTokens: 2, cacheWriteTokens: 4, cacheReadTokens: 8, estimatedCo2: 1.5, costUsdCent: 10 });
    const sonnet = rawTokens(0, { inputTokens: 16, outputTokens: 32, estimatedCo2: 0.25, costUsdCent: 3 });
    mockFetch({
      usage: {
        from: '2026-07-01',
        to: '2026-07-01',
        provider: {
          providerName: 'CLAUDE',
          modelFamilies: [
            {
              modelFamily: 'opus',
              models: [
                { model: 'opus-4.8', tokens: opus },
                { model: 'opus-4.6', tokens: opus },
              ],
            },
            { modelFamily: 'sonnet', models: [{ model: 'sonnet-5', tokens: sonnet }] },
          ],
        },
      },
      activeUsersLast4Weeks: 0,
    });

    // when
    const usage = await fetchProviderUsage('claude', { from: '2026-07-01', to: '2026-07-01' });

    // then
    const [opusFamily, sonnetFamily] = usage.modelFamilies;
    expect(opusFamily.tokens).toEqual({ input: 2, output: 4, cacheWrite: 8, cacheRead: 16 });
    expect(opusFamily.tokensTotal).toBe(30);
    expect(opusFamily.estimatedCo2).toBe(3);
    expect(opusFamily.costUsdCent).toBe(20);
    expect(sonnetFamily.tokensTotal).toBe(48);

    expect(usage.overallTokens).toEqual({ input: 18, output: 36, cacheWrite: 8, cacheRead: 16 });
    expect(usage.overallTokensTotal).toBe(78);
    expect(usage.tokensInOut).toBe(54);
    expect(usage.totalEstimatedCo2).toBe(3.25);
    expect(usage.totalCostUsdCent).toBe(23);
  });

  it('throws a FetchError carrying the HTTP status when the request fails', async () => {
    // given
    mockFetch({}, false, 500);

    // when / then — a rejection cannot be split; the call is the assertion subject
    await expect(fetchProviderUsage('claude', { from: '2026-07-01', to: '2026-07-01' }))
      .rejects.toThrow(new FetchError(500));
    await expect(fetchProviderUsage('claude', { from: '2026-07-01', to: '2026-07-01' }))
      .rejects.toMatchObject({ name: 'FetchError', status: 500, message: 'Request failed: 500' });
  });
});

describe('fetchUsageOverview', () => {
  it('maps UPPERCASE provider keys to domain Provider ids and ignores unknown keys', async () => {
    // given
    mockFetch({
      providerUsages: {
        CLAUDE: { tokensInOut: 10, totalEstimatedCo2: 1, totalCostUsdCent: 2 },
        COPILOT: { tokensInOut: 20, totalEstimatedCo2: 3, totalCostUsdCent: 4 },
        SOME_FUTURE_PROVIDER: { tokensInOut: 999, totalEstimatedCo2: 999, totalCostUsdCent: 999 },
      },
    });

    // when
    const overview = await fetchUsageOverview({ from: '2026-07-01', to: '2026-07-02' });

    // then
    expect(overview.providerUsages.claude).toEqual({ provider: 'claude', tokensInOut: 10, totalEstimatedCo2: 1, totalCostUsdCent: 2 });
    expect(overview.providerUsages.copilot).toEqual({ provider: 'copilot', tokensInOut: 20, totalEstimatedCo2: 3, totalCostUsdCent: 4 });
    expect(Object.keys(overview.providerUsages)).toEqual(['claude', 'copilot']);
  });

  it('sums the company-wide totals over the known providers only', async () => {
    // given — the unknown provider's 999s must not reach any total
    mockFetch({
      providerUsages: {
        CLAUDE: { tokensInOut: 10, totalEstimatedCo2: 1, totalCostUsdCent: 2 },
        COPILOT: { tokensInOut: 20, totalEstimatedCo2: 3, totalCostUsdCent: 4 },
        SOME_FUTURE_PROVIDER: { tokensInOut: 999, totalEstimatedCo2: 999, totalCostUsdCent: 999 },
      },
    });

    // when
    const overview = await fetchUsageOverview({ from: '2026-07-01', to: '2026-07-02' });

    // then
    expect(overview.tokensInOut).toBe(30);
    expect(overview.totalEstimatedCo2).toBe(4);
    expect(overview.totalCostUsdCent).toBe(6);
  });
});

describe('fetchProviderUsageSeries', () => {
  it('fills gaps in the requested range with empty buckets', async () => {
    // given — only the middle day of the range carries data
    mockFetch({
      history: {
        from: '2026-07-01',
        to: '2026-07-03',
        provider: {
          providerName: 'CLAUDE',
          buckets: [
            {
              date: '2026-07-02',
              modelFamilies: [{ modelFamily: 'opus', models: [{ model: 'opus-4.8', tokens: rawTokens(50) }] }],
              pluginInstallations: 5,
            },
          ],
        },
      },
    });

    // when
    const series = await fetchProviderUsageSeries('claude', { from: '2026-07-01', to: '2026-07-03' }, 'day');

    // then
    expect(series.buckets.map((b) => b.date)).toEqual(['2026-07-01', '2026-07-02', '2026-07-03']);
    expect(series.buckets[0].modelFamilies).toEqual([]);
    expect(series.buckets[0].overallTokensTotal).toBe(0);
    expect(series.buckets[1].modelFamilies[0].modelFamily).toBe('opus');
    expect(series.buckets[1].overallTokensTotal).toBe(50);
    expect(series.buckets[1].pluginInstallations).toBe(5);
    expect(series.buckets[2].modelFamilies).toEqual([]);
  });

  it('caps a week bucket straddling the range start to the requested range', async () => {
    // given
    mockFetch({
      history: {
        from: '2026-07-08', // a Wednesday, mid-week
        to: '2026-07-14',
        provider: { providerName: 'CLAUDE', buckets: [] },
      },
    });

    // when
    const series = await fetchProviderUsageSeries('claude', { from: '2026-07-08', to: '2026-07-14' }, 'week');

    // then — first week key is Monday 2026-07-06, but the visible period must not
    // reach before the requested range; the second week is capped at `to`.
    expect(series.buckets).toHaveLength(2);
    expect(series.buckets[0]).toMatchObject({ date: '2026-07-08', periodEnd: '2026-07-12' });
    expect(series.buckets[1]).toMatchObject({ date: '2026-07-13', periodEnd: '2026-07-14' });
  });
});

describe('fetchAllUsageSeries', () => {
  /** One raw per-provider bucket with a single model carrying `input` in-tokens. */
  function providerBucket(date: string, input: number, pluginInstallations = 0) {
    return {
      date,
      modelFamilies: [{ modelFamily: 'opus', models: [{ model: 'opus-4.8', tokens: rawTokens(input) }] }],
      pluginInstallations,
    };
  }

  it('sums the selected providers into the overall bucket totals', async () => {
    // given
    mockFetch({
      history: {
        from: '2026-07-01',
        to: '2026-07-01',
        buckets: [
          {
            date: '2026-07-01',
            providers: { CLAUDE: providerBucket('2026-07-01', 10), COPILOT: providerBucket('2026-07-01', 32) },
          },
        ],
      },
    });

    // when
    const series = await fetchAllUsageSeries({ from: '2026-07-01', to: '2026-07-01' }, 'day', ['claude', 'copilot']);

    // then
    expect(series.buckets[0].overallTokens.input).toBe(42);
    expect(series.buckets[0].overallTokensTotal).toBe(42);
  });

  it('keeps each selected provider separately, which is what the home page stacks by', async () => {
    // given
    mockFetch({
      history: {
        from: '2026-07-01',
        to: '2026-07-01',
        buckets: [
          {
            date: '2026-07-01',
            providers: { CLAUDE: providerBucket('2026-07-01', 10, 3), COPILOT: providerBucket('2026-07-01', 32, 5) },
          },
        ],
      },
    });

    // when
    const series = await fetchAllUsageSeries({ from: '2026-07-01', to: '2026-07-01' }, 'day', ['claude', 'copilot']);

    // then
    expect(series.buckets[0].byProvider?.claude?.tokens.input).toBe(10);
    expect(series.buckets[0].byProvider?.copilot?.tokens.input).toBe(32);
  });

  it('leaves the overall installation count at zero, since only per-provider entries carry one', async () => {
    // given
    mockFetch({
      history: {
        from: '2026-07-01',
        to: '2026-07-01',
        buckets: [{ date: '2026-07-01', providers: { CLAUDE: providerBucket('2026-07-01', 10, 3) } }],
      },
    });

    // when
    const series = await fetchAllUsageSeries({ from: '2026-07-01', to: '2026-07-01' }, 'day', ['claude']);

    // then
    expect(series.buckets[0].pluginInstallations).toBe(0);
    expect(series.buckets[0].byProvider?.claude?.pluginInstallations).toBe(3);
  });

  it('drops providers the caller did not select, so a filtered chart shows filtered totals', async () => {
    // given
    mockFetch({
      history: {
        from: '2026-07-01',
        to: '2026-07-01',
        buckets: [
          {
            date: '2026-07-01',
            providers: { CLAUDE: providerBucket('2026-07-01', 10), COPILOT: providerBucket('2026-07-01', 32) },
          },
        ],
      },
    });

    // when
    const series = await fetchAllUsageSeries({ from: '2026-07-01', to: '2026-07-01' }, 'day', ['claude']);

    // then
    expect(series.buckets[0].overallTokens.input).toBe(10);
    expect(series.buckets[0].byProvider?.copilot).toBeUndefined();
  });

  it('ignores provider keys it does not recognise', async () => {
    // given
    mockFetch({
      history: {
        from: '2026-07-01',
        to: '2026-07-01',
        buckets: [
          {
            date: '2026-07-01',
            providers: {
              CLAUDE: providerBucket('2026-07-01', 10),
              SOME_FUTURE_PROVIDER: providerBucket('2026-07-01', 999),
            },
          },
        ],
      },
    });

    // when
    const series = await fetchAllUsageSeries({ from: '2026-07-01', to: '2026-07-01' }, 'day', ['claude']);

    // then
    expect(series.buckets[0].overallTokens.input).toBe(10);
    expect(Object.keys(series.buckets[0].byProvider ?? {})).toEqual(['claude']);
  });

  it('fills periods the backend did not report with empty buckets', async () => {
    // given — only the middle day carries data
    mockFetch({
      history: {
        from: '2026-07-01',
        to: '2026-07-03',
        buckets: [{ date: '2026-07-02', providers: { CLAUDE: providerBucket('2026-07-02', 50) } }],
      },
    });

    // when
    const series = await fetchAllUsageSeries({ from: '2026-07-01', to: '2026-07-03' }, 'day', ['claude']);

    // then
    expect(series.buckets.map((b) => b.date)).toEqual(['2026-07-01', '2026-07-02', '2026-07-03']);
    expect(series.buckets[0].overallTokensTotal).toBe(0);
    expect(series.buckets[1].overallTokensTotal).toBe(50);
    expect(series.buckets[2].overallTokensTotal).toBe(0);
  });

  it('carries no model breakdown, which only the single-provider series has', async () => {
    // given
    mockFetch({
      history: {
        from: '2026-07-01',
        to: '2026-07-01',
        buckets: [{ date: '2026-07-01', providers: { CLAUDE: providerBucket('2026-07-01', 10) } }],
      },
    });

    // when
    const series = await fetchAllUsageSeries({ from: '2026-07-01', to: '2026-07-01' }, 'day', ['claude']);

    // then
    expect(series.buckets[0].modelFamilies).toEqual([]);
  });

  it('throws with the HTTP status when the request fails', async () => {
    // given
    mockFetch({}, false, 503);

    // when / then — a rejection cannot be split; the call is the assertion subject
    await expect(
      fetchAllUsageSeries({ from: '2026-07-01', to: '2026-07-01' }, 'day', ['claude']),
    ).rejects.toMatchObject({ name: 'FetchError', status: 503, message: 'Request failed: 503' });
  });
});
