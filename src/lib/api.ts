import type {
  ModelFamilyUsage,
  Provider,
  ProviderBucketStats,
  ProviderOverview,
  ProviderUsage,
  ProviderUsageSeries,
  SeriesBucket,
  SeriesGranularity,
  TokenCounts,
  UsageOverview,
} from './types';
import { PROVIDERS } from './types';
import type { DateRange } from './range';
import { addDays, eachDay, eachWeekStart, fromISO, toISO } from './range';
import { FetchError } from './errors';

/** Empty means same origin; see `PUBLIC_API_BASE` in `env.d.ts`. */
const API_BASE = import.meta.env.PUBLIC_API_BASE ?? '';

/** Version segment for all `/api/usage/*` routes. */
const API_VERSION_1 = 'v1';

/** Providers the backend has data for. Extend as more are onboarded. */
export const ACTIVE_PROVIDERS: Provider[] = ['claude', 'copilot', 'opencode'];

// --- Raw backend schema. Mapped onto the domain types in `types.ts` below; this
// --- is the only place that needs touching when the backend response changes. ---

interface RawTokens {
  inputTokens: number;
  outputTokens: number;
  cacheWriteTokens: number;
  cacheReadTokens: number;
  costUsdCent: number;
  estimatedCo2: number;
}

interface RawModelFamily {
  modelFamily: string;
  models: { model: string; tokens: RawTokens }[];
}

interface RawProviderUsage {
  providerName: string;
  modelFamilies: RawModelFamily[];
}

const EMPTY_TOKEN_COUNTS: TokenCounts = { input: 0, output: 0, cacheWrite: 0, cacheRead: 0 };

interface RawUsageResponse {
  usage: {
    from: string;
    to: string;
    // `null` when the period has no data yet (e.g. today, before the first report).
    provider: RawProviderUsage | null;
  };
  activeUsersLast4Weeks: number;
}

interface RawOverviewResponse {
  providerUsages: Record<string, { tokensInOut: number; totalEstimatedCo2: number; totalCostUsdCent: number }>;
}

function toTokenCounts(t: RawTokens): TokenCounts {
  return {
    input: t.inputTokens,
    output: t.outputTokens,
    cacheWrite: t.cacheWriteTokens,
    cacheRead: t.cacheReadTokens,
  };
}

export function tokensTotal(t: TokenCounts): number {
  return t.input + t.output + t.cacheWrite + t.cacheRead;
}

export function tokensInOut(t: TokenCounts): number {
  return t.input + t.output;
}

/** Everything a model, a family or a whole provider contributes; models are the only leaves. */
interface Usage {
  tokens: TokenCounts;
  estimatedCo2: number;
  costUsdCent: number;
}

function sumUsages(items: Usage[]): Usage {
  return items.reduce<Usage>(
    (acc, item) => ({
      tokens: addTokenCounts(acc.tokens, item.tokens),
      estimatedCo2: acc.estimatedCo2 + item.estimatedCo2,
      costUsdCent: acc.costUsdCent + item.costUsdCent,
    }),
    { tokens: EMPTY_TOKEN_COUNTS, estimatedCo2: 0, costUsdCent: 0 },
  );
}

function toModelFamilyUsage(f: RawModelFamily): ModelFamilyUsage {
  const models = f.models.map((m) => {
    const tokens = toTokenCounts(m.tokens);
    return {
      model: m.model,
      tokens,
      tokensTotal: tokensTotal(tokens),
      estimatedCo2: m.tokens.estimatedCo2,
      costUsdCent: m.tokens.costUsdCent,
    };
  });
  const sum = sumUsages(models);

  return {
    modelFamily: f.modelFamily,
    models,
    tokens: sum.tokens,
    tokensTotal: tokensTotal(sum.tokens),
    estimatedCo2: sum.estimatedCo2,
    costUsdCent: sum.costUsdCent,
  };
}

function parseProviderUsage(provider: Provider, json: RawUsageResponse): ProviderUsage {
  const modelFamilies = (json.usage.provider?.modelFamilies ?? []).map(toModelFamilyUsage);
  const sum = sumUsages(modelFamilies);

  return {
    provider,
    modelFamilies,
    overallTokens: sum.tokens,
    overallTokensTotal: tokensTotal(sum.tokens),
    tokensInOut: tokensInOut(sum.tokens),
    totalEstimatedCo2: sum.estimatedCo2,
    totalCostUsdCent: sum.costUsdCent,
    activeUsers: json.activeUsersLast4Weeks,
  };
}

/** One provider's totals and per-model breakdown for `range`. */
export async function fetchProviderUsage(provider: Provider, range: DateRange): Promise<ProviderUsage> {
  const params = new URLSearchParams({ from: range.from, to: range.to });
  const res = await fetch(`${API_BASE}/api/usage/${provider}/${API_VERSION_1}?${params}`);
  if (!res.ok) {
    throw new FetchError(res.status);
  }
  return parseProviderUsage(provider, await res.json());
}

function parseUsageOverview(range: DateRange, json: RawOverviewResponse): UsageOverview {
  const providerUsages: Partial<Record<Provider, ProviderOverview>> = {};
  let tokensInOut = 0;
  let totalEstimatedCo2 = 0;
  let totalCostUsdCent = 0;

  for (const [key, value] of Object.entries(json.providerUsages)) {
    // Keys arrive UPPERCASE ("CLAUDE"), hence the case-insensitive match here and below.
    const provider = PROVIDERS.find((p) => p.toLowerCase() === key.toLowerCase());
    if (!provider) {
      continue;
    }
    providerUsages[provider] = {
      provider,
      tokensInOut: value.tokensInOut,
      totalEstimatedCo2: value.totalEstimatedCo2,
      totalCostUsdCent: value.totalCostUsdCent,
    };
    tokensInOut += value.tokensInOut;
    totalEstimatedCo2 += value.totalEstimatedCo2;
    totalCostUsdCent += value.totalCostUsdCent;
  }

  return {
    from: range.from,
    to: range.to,
    providerUsages,
    tokensInOut,
    totalEstimatedCo2,
    totalCostUsdCent,
  };
}

/** Company-wide totals, one entry per provider, for `range`. */
export async function fetchUsageOverview(range: DateRange): Promise<UsageOverview> {
  const params = new URLSearchParams({ from: range.from, to: range.to });
  const res = await fetch(`${API_BASE}/api/usage/all/${API_VERSION_1}?${params}`);
  if (!res.ok) {
    throw new FetchError(res.status);
  }
  return parseUsageOverview(range, await res.json());
}

interface RawSeriesBucket {
  date: string; // ISO YYYY-MM-DD; for granularity=week the Monday of that week
  modelFamilies: RawModelFamily[];
  pluginInstallations: number;
}

interface RawSeriesResponse {
  history: {
    from: string;
    to: string;
    provider: { providerName: string; buckets: RawSeriesBucket[] } | null;
  };
}

// The period a bucket stands for, clamped to the requested range: a week bucket at
// either edge is partial whenever the range does not start on a Monday or end on a
// Sunday, and the tooltip must not claim days the user did not ask for.

function bucketPeriod(
  key: string,
  range: DateRange,
  granularity: SeriesGranularity,
): { date: string; periodEnd: string } {
  if (granularity === 'day') {
    return { date: key, periodEnd: key };
  }
  const weekEnd = toISO(addDays(fromISO(key), 6));
  return {
    date: key < range.from ? range.from : key,
    periodEnd: weekEnd > range.to ? range.to : weekEnd,
  };
}

function emptyBucket(date: string, periodEnd: string): SeriesBucket {
  return {
    date,
    periodEnd,
    modelFamilies: [],
    overallTokens: EMPTY_TOKEN_COUNTS,
    overallTokensTotal: 0,
    totalEstimatedCo2: 0,
    totalCostUsdCent: 0,
    pluginInstallations: 0,
    byProvider: {},
  };
}

// Backends omit periods without usage. Emitting explicit zero buckets keeps the
// x-axis evenly spaced, so a gap reads as "no usage" instead of being skipped.
function fillBucketGaps(
  range: DateRange,
  granularity: SeriesGranularity,
  byKey: Map<string, SeriesBucket>,
): SeriesBucket[] {
  const keys = granularity === 'day' ? eachDay(range) : eachWeekStart(range);
  return keys.map((key) => {
    const existing = byKey.get(key);
    if (existing) {
      return existing;
    }
    const { date, periodEnd } = bucketPeriod(key, range, granularity);
    return emptyBucket(date, periodEnd);
  });
}

function parseUsageSeries(
  range: DateRange,
  json: RawSeriesResponse,
  granularity: SeriesGranularity,
): ProviderUsageSeries {
  const rawBuckets = json.history.provider?.buckets ?? [];
  const byKey = new Map<string, SeriesBucket>(
    rawBuckets.map((b) => {
      const modelFamilies = b.modelFamilies.map(toModelFamilyUsage);
      const sum = sumUsages(modelFamilies);
      const { date, periodEnd } = bucketPeriod(b.date, range, granularity);
      return [
        b.date,
        {
          date,
          periodEnd,
          modelFamilies,
          overallTokens: sum.tokens,
          overallTokensTotal: tokensTotal(sum.tokens),
          totalEstimatedCo2: sum.estimatedCo2,
          totalCostUsdCent: sum.costUsdCent,
          pluginInstallations: b.pluginInstallations,
        },
      ];
    }),
  );

  return { from: range.from, to: range.to, buckets: fillBucketGaps(range, granularity, byKey) };
}

interface RawAllSeriesBucket {
  date: string;
  providers: Record<string, RawSeriesBucket>; // keyed by UPPERCASE provider name
}

interface RawAllSeriesResponse {
  history: {
    from: string;
    to: string;
    buckets: RawAllSeriesBucket[];
  };
}

function addTokenCounts(a: TokenCounts, b: TokenCounts): TokenCounts {
  return {
    input: a.input + b.input,
    output: a.output + b.output,
    cacheWrite: a.cacheWrite + b.cacheWrite,
    cacheRead: a.cacheRead + b.cacheRead,
  };
}

function toProviderBucketStats(entry: RawSeriesBucket): ProviderBucketStats {
  const sum = sumUsages(entry.modelFamilies.map(toModelFamilyUsage));
  return {
    tokens: sum.tokens,
    totalEstimatedCo2: sum.estimatedCo2,
    totalCostUsdCent: sum.costUsdCent,
    pluginInstallations: entry.pluginInstallations,
  };
}

// Per-provider values for one bucket — the home page splits its bars by provider.
function byProviderStats(
  providers: Record<string, RawSeriesBucket>,
  selectedProviders: Provider[],
): Partial<Record<Provider, ProviderBucketStats>> {
  const selected = new Set(selectedProviders);
  const result: Partial<Record<Provider, ProviderBucketStats>> = {};
  for (const [key, bucket] of Object.entries(providers)) {
    const provider = PROVIDERS.find((p) => p.toLowerCase() === key.toLowerCase());
    if (provider && selected.has(provider)) {
      result[provider] = toProviderBucketStats(bucket);
    }
  }
  return result;
}

interface OverallStats {
  tokens: TokenCounts;
  totalEstimatedCo2: number;
  totalCostUsdCent: number;
}

// Installations aren't summed across providers: they're only ever shown per provider
// (home chart reads `byProvider`), never as a cross-provider total.
function sumProviderStats(stats: ProviderBucketStats[]): OverallStats {
  return stats.reduce<OverallStats>(
    (acc, s) => ({
      tokens: addTokenCounts(acc.tokens, s.tokens),
      totalEstimatedCo2: acc.totalEstimatedCo2 + s.totalEstimatedCo2,
      totalCostUsdCent: acc.totalCostUsdCent + s.totalCostUsdCent,
    }),
    { tokens: EMPTY_TOKEN_COUNTS, totalEstimatedCo2: 0, totalCostUsdCent: 0 },
  );
}

function parseAllUsageSeries(
  range: DateRange,
  json: RawAllSeriesResponse,
  granularity: SeriesGranularity,
  selectedProviders: Provider[],
): ProviderUsageSeries {
  const rawBuckets = json.history.buckets ?? [];
  const byKey = new Map<string, SeriesBucket>(
    rawBuckets.map((b) => {
      const { date, periodEnd } = bucketPeriod(b.date, range, granularity);
      const byProvider = byProviderStats(b.providers ?? {}, selectedProviders);
      const sum = sumProviderStats(Object.values(byProvider));
      return [
        b.date,
        {
          date,
          periodEnd,
          modelFamilies: [],
          overallTokens: sum.tokens,
          overallTokensTotal: tokensTotal(sum.tokens),
          totalEstimatedCo2: sum.totalEstimatedCo2,
          totalCostUsdCent: sum.totalCostUsdCent,
          // Unused overall — only `byProvider` entries carry real installation counts.
          pluginInstallations: 0,
          byProvider,
        },
      ];
    }),
  );

  return { from: range.from, to: range.to, buckets: fillBucketGaps(range, granularity, byKey) };
}

/** Daily or weekly history for a single provider over `range`. */
export async function fetchProviderUsageSeries(
  provider: Provider,
  range: DateRange,
  granularity: SeriesGranularity = 'day',
): Promise<ProviderUsageSeries> {
  const params = new URLSearchParams({ from: range.from, to: range.to, granularity });
  const res = await fetch(`${API_BASE}/api/usage/${provider}/series/${API_VERSION_1}?${params}`);
  if (!res.ok) {
    throw new FetchError(res.status);
  }
  return parseUsageSeries(range, await res.json(), granularity);
}

/**
 * Daily or weekly history over `range`, aggregated across `selectedProviders`.
 * The endpoint always returns every provider, so changing the selection re-aggregates
 * client-side rather than issuing a different request.
 */
export async function fetchAllUsageSeries(
  range: DateRange,
  granularity: SeriesGranularity = 'day',
  selectedProviders: Provider[] = ACTIVE_PROVIDERS,
): Promise<ProviderUsageSeries> {
  const params = new URLSearchParams({ from: range.from, to: range.to, granularity });
  const res = await fetch(`${API_BASE}/api/usage/all/series/${API_VERSION_1}?${params}`);
  if (!res.ok) {
    throw new FetchError(res.status);
  }
  return parseAllUsageSeries(range, await res.json(), granularity, selectedProviders);
}
