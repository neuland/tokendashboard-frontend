// Turns a `ProviderUsageSeries` into Recharts rows. Which keys a row carries depends
// on the chart: one per provider on the home page, one per token type or model family
// on a provider page. See `SeriesBarChart` for the bars that consume them.

import type { Provider, ProviderBucketStats, ProviderUsageSeries, SeriesBucket, SeriesGranularity } from './types';
import { TOKEN_TYPES, usdCentToUsd } from './types';
import { formatDateRange, formatDayShort, formatWeekLabel } from './format';
import { dict, type Locale } from '~/i18n';

export type View = 'tokenType' | 'tokenTypeAll' | 'model' | 'co2' | 'cost' | 'installations' | 'tokensPerInstallation';

export type ChartRow = Record<string, string | number>;

export function viewTitle(view: View, locale: Locale): string {
  return dict(locale).views[view];
}

const EMPTY_PROVIDER_STATS: ProviderBucketStats = {
  tokens: { input: 0, output: 0, cacheWrite: 0, cacheRead: 0 },
  totalEstimatedCo2: 0,
  totalCostUsdCent: 0,
  pluginInstallations: 0,
};

// Short label for the x-axis; `baseRow` pairs it with the unabbreviated period in
// `fullLabel`, which the tooltip shows instead.
export function axisLabel(b: SeriesBucket, granularity: SeriesGranularity, locale: Locale): string {
  return granularity === 'week' ? formatWeekLabel(b.date, locale) : formatDayShort(b.date, locale);
}

function baseRow(b: SeriesBucket, granularity: SeriesGranularity, locale: Locale): ChartRow {
  return {
    date: axisLabel(b, granularity, locale),
    fullLabel: formatDateRange(b.date, b.periodEnd, locale),
  };
}

function homeMetric(view: View): (s: ProviderBucketStats) => number {
  switch (view) {
    case 'tokenType':
      return (s) => s.tokens.input + s.tokens.output;
    case 'tokenTypeAll':
      return (s) => s.tokens.input + s.tokens.output + s.tokens.cacheRead + s.tokens.cacheWrite;
    case 'co2':
      return (s) => s.totalEstimatedCo2;
    case 'cost':
      return (s) => usdCentToUsd(s.totalCostUsdCent);
    case 'installations':
      return (s) => s.pluginInstallations;
    case 'tokensPerInstallation':
      // Unreachable: the home page does not offer the tokensPerInstallation view (see `HomeUsageSeriesChart`).
      return () => 0;
    case 'model':
      // Unreachable: the home page does not offer the model view (see `HomeUsageSeriesChart`).
      return () => 0;
  }
}

/** Home page rows: one key per selected provider, so bars stack by provider. */
export function buildHomeChartData(
  series: ProviderUsageSeries,
  granularity: SeriesGranularity,
  view: View,
  homeProviders: Provider[],
  locale: Locale,
): ChartRow[] {
  const metric = homeMetric(view);
  return series.buckets.map((b) => {
    const row = baseRow(b, granularity, locale);
    for (const p of homeProviders) {
      row[p] = metric(b.byProvider?.[p] ?? EMPTY_PROVIDER_STATS);
    }
    return row;
  });
}

/** Provider page rows: one key per token type or model family, depending on `view`. */
export function buildProviderChartData(
  series: ProviderUsageSeries,
  granularity: SeriesGranularity,
  view: View,
  families: string[],
  locale: Locale,
): ChartRow[] {
  return series.buckets.map((b) => {
    const row = baseRow(b, granularity, locale);
    switch (view) {
      case 'tokenType':
        row.input = b.overallTokens.input;
        row.output = b.overallTokens.output;
        break;
      case 'tokenTypeAll':
        for (const t of TOKEN_TYPES) {
          row[t] = b.overallTokens[t];
        }
        break;
      case 'model':
        for (const family of families) {
          row[family] = 0;
        }
        for (const f of b.modelFamilies) {
          row[f.modelFamily] = f.tokens.input + f.tokens.output;
        }
        break;
      case 'co2':
        row.co2 = b.totalEstimatedCo2;
        break;
      case 'cost':
        row.cost = usdCentToUsd(b.totalCostUsdCent);
        break;
      case 'installations':
        row.installations = b.pluginInstallations;
        break;
      case 'tokensPerInstallation':
        row.tokensPerInstallation = b.pluginInstallations > 0 ? (b.overallTokens.input + b.overallTokens.output) / b.pluginInstallations : 0;
        break;
    }
    return row;
  });
}

/**
 * Model families, largest first by in+out tokens. Buckets each list only the families
 * they saw, so the order has to be decided once across the whole series to keep bars
 * and legend entries stable from bucket to bucket.
 */
export function sortedModelFamilies(series: ProviderUsageSeries): string[] {
  const familyTotals = new Map<string, number>();
  for (const b of series.buckets) {
    for (const f of b.modelFamilies) {
      const io = f.tokens.input + f.tokens.output;
      familyTotals.set(f.modelFamily, (familyTotals.get(f.modelFamily) ?? 0) + io);
    }
  }
  return [...familyTotals.entries()].sort((a, b) => b[1] - a[1]).map(([family]) => family);
}
