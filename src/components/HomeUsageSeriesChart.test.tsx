import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import HomeUsageSeriesChart from './HomeUsageSeriesChart';
import type { ProviderUsageSeries, SeriesBucket, TokenCounts } from '~/lib/types';
import { useUsageSeries } from '~/lib/useUsageSeries';
import { dict } from '~/i18n';

vi.mock('~/lib/useUsageSeries');

const NO_TOKENS: TokenCounts = { input: 0, output: 0, cacheWrite: 0, cacheRead: 0 };

function bucket(date: string, total: number): SeriesBucket {
  return {
    date,
    periodEnd: date,
    modelFamilies: [],
    overallTokens: { ...NO_TOKENS, input: total },
    overallTokensTotal: total,
    totalEstimatedCo2: 0,
    totalCostUsdCent: 0,
    pluginInstallations: 0,
  };
}

function series(...buckets: SeriesBucket[]): ProviderUsageSeries {
  return { from: '2026-07-01', to: '2026-07-02', buckets };
}

function mockState(state: ReturnType<typeof useUsageSeries>['state']) {
  vi.mocked(useUsageSeries).mockReturnValue({
    state,
    granularity: 'day',
    forceDay: false,
    setForceDay: vi.fn(),
  });
}

const props = {
  range: { from: '2026-07-01', to: '2026-07-02' },
  selectedProviders: ['claude' as const],
  locale: 'de' as const,
};

afterEach(() => {
  vi.mocked(useUsageSeries).mockReset();
});

describe('HomeUsageSeriesChart', () => {
  it('shows the chart status while the series is loading', () => {
    // given
    mockState({ status: 'loading' });

    // when
    const { container } = render(<HomeUsageSeriesChart {...props} />);

    // then
    expect(container.textContent).toContain(dict('de').common.loading);
    expect(container.querySelector('.view-toggle')).toBeNull();
  });

  it('keeps the provider filter visible while the series is loading', () => {
    // given
    mockState({ status: 'loading' });

    // when
    const { container } = render(
      <HomeUsageSeriesChart {...props} onSelectedProvidersChange={vi.fn()} />,
    );

    // then
    expect(container.textContent).toContain(dict('de').common.loading);
    expect(container.textContent).toContain(dict('de').homeUsageSeriesChart.providerHistoryLabel);
  });

  it('shows the chart status when the series failed', () => {
    // given
    mockState({ status: 'error', error: new Error('boom') });

    // when
    const { container } = render(<HomeUsageSeriesChart {...props} />);

    // then
    expect(container.querySelector('[role="alert"]')!.textContent).toBe(
      dict('de').common.loadFailed('boom'),
    );
  });

  it('shows the empty-period notice when every bucket is zero', () => {
    // given
    mockState({ status: 'ready', series: series(bucket('2026-07-01', 0), bucket('2026-07-02', 0)) });

    // when
    const { container } = render(<HomeUsageSeriesChart {...props} />);

    // then
    expect(container.textContent).toContain(dict('de').emptyRangeNotice.message);
  });

  it('still offers the provider filter when the selection has no usage in range', () => {
    // given
    mockState({ status: 'ready', series: series(bucket('2026-07-01', 0), bucket('2026-07-02', 0)) });

    // when
    const { container } = render(
      <HomeUsageSeriesChart {...props} onSelectedProvidersChange={vi.fn()} />,
    );

    // then
    expect(container.textContent).toContain(dict('de').emptyRangeNotice.message);
    expect(container.textContent).toContain(dict('de').homeUsageSeriesChart.providerHistoryLabel);
  });

  it('renders the chart controls once at least one bucket carries usage', () => {
    // given
    mockState({ status: 'ready', series: series(bucket('2026-07-01', 0), bucket('2026-07-02', 5)) });

    // when
    const { container } = render(<HomeUsageSeriesChart {...props} />);

    // then
    expect(container.querySelector('.view-toggle')).not.toBeNull();
    expect(container.querySelector('.force-day-toggle')).not.toBeNull();
    expect(container.textContent).not.toContain(dict('de').emptyRangeNotice.message);
  });

  it('offers the provider filter only when the caller accepts a change', () => {
    // given
    mockState({ status: 'ready', series: series(bucket('2026-07-01', 5)) });

    // when
    const without = render(<HomeUsageSeriesChart {...props} />).container;
    const withHandler = render(
      <HomeUsageSeriesChart {...props} onSelectedProvidersChange={vi.fn()} />,
    ).container;

    // then
    const label = dict('de').homeUsageSeriesChart.providerHistoryLabel;
    expect(without.textContent).not.toContain(label);
    expect(withHandler.textContent).toContain(label);
  });

  it('passes the range and the selected providers to the series hook', () => {
    // given
    mockState({ status: 'loading' });

    // when
    render(<HomeUsageSeriesChart {...props} selectedProviders={['claude', 'copilot']} />);

    // then
    expect(useUsageSeries).toHaveBeenCalledExactlyOnceWith(props.range, undefined, ['claude', 'copilot']);
  });
});
