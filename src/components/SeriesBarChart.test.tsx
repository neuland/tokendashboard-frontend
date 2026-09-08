import { describe, expect, it } from 'vitest';
import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { ReferenceArea, XAxis } from 'recharts';
import SeriesBarChart from './SeriesBarChart';
import type { ProviderUsageSeries, SeriesBucket, SeriesGranularity, TokenCounts } from '~/lib/types';
import type { ChartRow } from '~/lib/seriesChartData';

// recharts needs a sized container, which jsdom never provides, so the axis and shading
// props never reach the DOM. SeriesBarChart is a pure, hook-free component, so the tree
// it returns can be walked directly instead.
function walk(node: ReactNode, out: ReactElement[] = []): ReactElement[] {
  if (Array.isArray(node)) {
    node.forEach((child) => walk(child, out));
    return out;
  }
  if (!isValidElement(node)) {
    return out;
  }
  out.push(node);
  walk((node.props as { children?: ReactNode }).children, out);
  return out;
}

const NO_TOKENS: TokenCounts = { input: 0, output: 0, cacheWrite: 0, cacheRead: 0 };

function bucket(date: string): SeriesBucket {
  return {
    date,
    periodEnd: date,
    modelFamilies: [],
    overallTokens: NO_TOKENS,
    overallTokensTotal: 0,
    totalEstimatedCo2: 0,
    totalCostUsdCent: 0,
    pluginInstallations: 0,
  };
}

function tree(dates: string[], granularity: SeriesGranularity) {
  const series: ProviderUsageSeries = {
    from: dates[0],
    to: dates[dates.length - 1],
    buckets: dates.map(bucket),
  };
  const chartData = dates.map((date) => ({ date }) as ChartRow);
  return walk(
    SeriesBarChart({ chartData, series, granularity, view: 'tokenType', children: null, locale: 'de' }),
  );
}

function propsOf(nodes: ReactElement[], type: unknown) {
  return nodes.filter((n) => n.type === type).map((n) => n.props as Record<string, unknown>);
}

// 2026-07-18 is a Saturday, 2026-07-19 a Sunday.
const oneWeek = ['2026-07-15', '2026-07-16', '2026-07-17', '2026-07-18', '2026-07-19', '2026-07-20'];

describe('SeriesBarChart weekend shading', () => {
  it('shades one area per weekend day for daily buckets', () => {
    // when
    const areas = propsOf(tree(oneWeek, 'day'), ReferenceArea);

    // then
    expect(areas).toHaveLength(2);
    expect(areas.every((a) => a.x1 === a.x2)).toBe(true);
  });

  it('shades nothing for weekly buckets, which span whole calendar weeks anyway', () => {
    // given / when / then
    expect(propsOf(tree(oneWeek, 'week'), ReferenceArea)).toHaveLength(0);
  });

  it('shades nothing when the range holds no weekend', () => {
    // given / when / then — Wed to Fri
    expect(propsOf(tree(['2026-07-15', '2026-07-16', '2026-07-17'], 'day'), ReferenceArea)).toHaveLength(0);
  });
});

describe('SeriesBarChart axis ticks', () => {
  it('lets recharts keep the ends for daily buckets', () => {
    // given / when / then
    expect(propsOf(tree(oneWeek, 'day'), XAxis)[0].interval).toBe('preserveStartEnd');
  });

  it('holds the week tick interval at its floor for short ranges', () => {
    // given / when / then — ceil(6/15) - 1 = 0, floored to 3
    expect(propsOf(tree(oneWeek, 'week'), XAxis)[0].interval).toBe(3);
  });

  it('scales the week tick interval with the bucket count on long ranges', () => {
    // given — 120 weekly buckets against a budget of 15 ticks
    const dates = Array.from({ length: 120 }, (_, i) => `2026-01-${String((i % 28) + 1).padStart(2, '0')}`);

    // when
    const interval = propsOf(tree(dates, 'week'), XAxis)[0].interval;

    // then — ceil(120/15) - 1 = 7
    expect(interval).toBe(7);
  });
});
