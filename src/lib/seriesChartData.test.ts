import { describe, expect, it } from 'vitest';
import {
  axisLabel,
  buildHomeChartData,
  buildProviderChartData,
  sortedModelFamilies,
  viewTitle,
  type View,
} from './seriesChartData';
import type {
  ModelFamilyUsage,
  Provider,
  ProviderBucketStats,
  ProviderUsageSeries,
  SeriesBucket,
  TokenCounts,
} from './types';
import { formatDateRange, formatDayShort, formatWeekLabel } from './format';
import { dict } from '~/i18n';

const NO_TOKENS: TokenCounts = { input: 0, output: 0, cacheWrite: 0, cacheRead: 0 };

function tokens(overrides: Partial<TokenCounts>): TokenCounts {
  return { ...NO_TOKENS, ...overrides };
}

function stats(overrides: Partial<ProviderBucketStats> = {}): ProviderBucketStats {
  return {
    tokens: NO_TOKENS,
    totalEstimatedCo2: 0,
    totalCostUsdCent: 0,
    pluginInstallations: 0,
    ...overrides,
  };
}

function family(modelFamily: string, input: number, output: number): ModelFamilyUsage {
  return {
    modelFamily,
    models: [],
    tokens: tokens({ input, output }),
    tokensTotal: input + output,
    estimatedCo2: 0,
    costUsdCent: 0,
  };
}

function bucket(overrides: Partial<SeriesBucket> = {}): SeriesBucket {
  return {
    date: '2026-07-01',
    periodEnd: '2026-07-01',
    modelFamilies: [],
    overallTokens: NO_TOKENS,
    overallTokensTotal: 0,
    totalEstimatedCo2: 0,
    totalCostUsdCent: 0,
    pluginInstallations: 0,
    ...overrides,
  };
}

function series(...buckets: SeriesBucket[]): ProviderUsageSeries {
  return { from: '2026-07-01', to: '2026-07-31', buckets };
}

describe('viewTitle', () => {
  it('reads the chart heading for the view from the dictionary', () => {
    // given / when / then — one locale per line
    expect(viewTitle('cost', 'de')).toBe(dict('de').views.cost);
    expect(viewTitle('cost', 'en')).toBe(dict('en').views.cost);
  });
});

describe('axisLabel', () => {
  it('uses a short day label for daily buckets', () => {
    // given / when / then
    expect(axisLabel(bucket({ date: '2026-07-22' }), 'day', 'de')).toBe(formatDayShort('2026-07-22', 'de'));
  });

  it('uses the ISO week label for weekly buckets', () => {
    // given / when / then
    expect(axisLabel(bucket({ date: '2026-07-22' }), 'week', 'de')).toBe(formatWeekLabel('2026-07-22', 'de'));
  });
});

describe('buildHomeChartData', () => {
  const providers: Provider[] = ['claude', 'copilot'];

  it('emits one row per bucket, labelled for the axis and the tooltip', () => {
    // given
    const b = bucket({ date: '2026-07-06', periodEnd: '2026-07-12' });

    // when
    const rows = buildHomeChartData(series(b), 'week', 'tokenType', providers, 'de');

    // then
    expect(rows).toHaveLength(1);
    expect(rows[0].date).toBe(formatWeekLabel('2026-07-06', 'de'));
    expect(rows[0].fullLabel).toBe(formatDateRange('2026-07-06', '2026-07-12', 'de'));
  });

  it('writes one key per selected provider, and only those', () => {
    // given — the bucket carries a third provider the caller did not select
    const b = bucket({
      byProvider: {
        claude: stats({ tokens: tokens({ input: 1, output: 2 }) }),
        copilot: stats({ tokens: tokens({ input: 4, output: 8 }) }),
        opencode: stats({ tokens: tokens({ input: 100, output: 100 }) }),
      },
    });

    // when
    const [row] = buildHomeChartData(series(b), 'day', 'tokenType', providers, 'de');

    // then
    expect(row.claude).toBe(3);
    expect(row.copilot).toBe(12);
    expect(row.opencode).toBeUndefined();
  });

  it('fills a selected provider absent from the bucket with zero', () => {
    // given
    const b = bucket({ byProvider: { claude: stats({ tokens: tokens({ input: 5, output: 5 }) }) } });

    // when
    const [row] = buildHomeChartData(series(b), 'day', 'tokenType', providers, 'de');

    // then
    expect(row.claude).toBe(10);
    expect(row.copilot).toBe(0);
  });

  it('counts in+out for tokenType and every type for tokenTypeAll', () => {
    // given
    const b = bucket({
      byProvider: {
        claude: stats({ tokens: tokens({ input: 1, output: 2, cacheWrite: 4, cacheRead: 8 }) }),
      },
    });

    // when
    const io = buildHomeChartData(series(b), 'day', 'tokenType', ['claude'], 'de')[0];
    const all = buildHomeChartData(series(b), 'day', 'tokenTypeAll', ['claude'], 'de')[0];

    // then
    expect(io.claude).toBe(3);
    expect(all.claude).toBe(15);
  });

  it('reads CO₂, installations and cost — the latter converted to dollars', () => {
    // given
    const b = bucket({
      byProvider: {
        claude: stats({ totalEstimatedCo2: 42, totalCostUsdCent: 2_500, pluginInstallations: 7 }),
      },
    });

    // given / when / then — one scalar view per line
    expect(buildHomeChartData(series(b), 'day', 'co2', ['claude'], 'de')[0].claude).toBe(42);
    expect(buildHomeChartData(series(b), 'day', 'installations', ['claude'], 'de')[0].claude).toBe(7);
    expect(buildHomeChartData(series(b), 'day', 'cost', ['claude'], 'de')[0].claude).toBe(25);
  });

  it('emits rows without provider keys when nothing is selected', () => {
    // given / when
    const [row] = buildHomeChartData(series(bucket()), 'day', 'tokenType', [], 'de');

    // then
    expect(Object.keys(row)).toEqual(['date', 'fullLabel']);
  });
});

describe('buildProviderChartData', () => {
  it('emits in and out for tokenType, every type for tokenTypeAll', () => {
    // given
    const b = bucket({ overallTokens: tokens({ input: 1, output: 2, cacheWrite: 4, cacheRead: 8 }) });

    // when
    const [io] = buildProviderChartData(series(b), 'day', 'tokenType', [], 'de');
    const [all] = buildProviderChartData(series(b), 'day', 'tokenTypeAll', [], 'de');

    // then
    expect(io).toMatchObject({ input: 1, output: 2 });
    expect(io.cacheRead).toBeUndefined();
    expect(all).toMatchObject({ input: 1, output: 2, cacheWrite: 4, cacheRead: 8 });
  });

  it('zero-fills every family the series knows, so a bucket missing one still stacks', () => {
    // given — the bucket saw only opus, but the series also knows sonnet
    const b = bucket({ modelFamilies: [family('opus', 10, 5)] });

    // when
    const [row] = buildProviderChartData(series(b), 'day', 'model', ['opus', 'sonnet'], 'de');

    // then
    expect(row.opus).toBe(15);
    expect(row.sonnet).toBe(0);
  });

  it('reads CO₂, cost and installations off the bucket totals', () => {
    // given
    const b = bucket({ totalEstimatedCo2: 9, totalCostUsdCent: 1_250, pluginInstallations: 4 });

    // given / when / then — one scalar view per line
    expect(buildProviderChartData(series(b), 'day', 'co2', [], 'de')[0].co2).toBe(9);
    expect(buildProviderChartData(series(b), 'day', 'cost', [], 'de')[0].cost).toBe(12.5);
    expect(buildProviderChartData(series(b), 'day', 'installations', [], 'de')[0].installations).toBe(4);
  });

  it('averages tokens per installation', () => {
    // given
    const b = bucket({ overallTokens: tokens({ input: 60, output: 40 }), pluginInstallations: 4 });

    // when
    const [row] = buildProviderChartData(series(b), 'day', 'tokensPerInstallation', [], 'de');

    // then
    expect(row.tokensPerInstallation).toBe(25);
  });

  it('reports zero rather than dividing by no installations', () => {
    // given
    const b = bucket({ overallTokens: tokens({ input: 60, output: 40 }), pluginInstallations: 0 });

    // when
    const [row] = buildProviderChartData(series(b), 'day', 'tokensPerInstallation', [], 'de');

    // then
    expect(row.tokensPerInstallation).toBe(0);
  });

  it('carries the axis and tooltip labels on every view', () => {
    // given
    const views: View[] = ['tokenType', 'tokenTypeAll', 'model', 'co2', 'cost', 'installations', 'tokensPerInstallation'];
    const b = bucket({ date: '2026-07-06', periodEnd: '2026-07-12' });

    // when
    const rows = views.map((v) => buildProviderChartData(series(b), 'week', v, [], 'de')[0]);

    // then
    expect(rows.every((r) => r.date === formatWeekLabel('2026-07-06', 'de'))).toBe(true);
    expect(rows.every((r) => r.fullLabel === formatDateRange('2026-07-06', '2026-07-12', 'de'))).toBe(true);
  });
});

describe('sortedModelFamilies', () => {
  it('orders families by in+out tokens across the whole series, largest first', () => {
    // given — sonnet leads in the first bucket, opus overtakes it across both
    const first = bucket({ modelFamilies: [family('sonnet', 50, 0), family('opus', 10, 0)] });
    const second = bucket({ modelFamilies: [family('opus', 100, 0)] });

    // when
    const families = sortedModelFamilies(series(first, second));

    // then
    expect(families).toEqual(['opus', 'sonnet']);
  });

  it('ignores cache tokens when ranking', () => {
    // given — sonnet has more tokens overall, but fewer in+out
    const b = bucket({
      modelFamilies: [
        { ...family('sonnet', 1, 1), tokens: tokens({ input: 1, output: 1, cacheRead: 1_000 }) },
        family('opus', 5, 5),
      ],
    });

    // when
    const families = sortedModelFamilies(series(b));

    // then
    expect(families).toEqual(['opus', 'sonnet']);
  });

  it('lists a family once even when several buckets report it', () => {
    // given
    const b = bucket({ modelFamilies: [family('opus', 1, 1)] });

    // when
    const families = sortedModelFamilies(series(b, b, b));

    // then
    expect(families).toEqual(['opus']);
  });

  it('returns nothing for a series without model data', () => {
    // given / when / then
    expect(sortedModelFamilies(series(bucket(), bucket()))).toEqual([]);
  });
});
