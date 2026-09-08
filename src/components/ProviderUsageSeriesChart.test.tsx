import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import ProviderUsageSeriesChart from './ProviderUsageSeriesChart';
import type { ProviderUsageSeries, SeriesBucket, TokenCounts } from '~/lib/types';
import { useUsageSeries } from '~/lib/useUsageSeries';
import { dict } from '~/i18n';

vi.mock('~/lib/useUsageSeries');

const NO_TOKENS: TokenCounts = { input: 0, output: 0, cacheWrite: 0, cacheRead: 0 };

function bucket(total: number): SeriesBucket {
  return {
    date: '2026-07-01',
    periodEnd: '2026-07-01',
    modelFamilies: [],
    overallTokens: { ...NO_TOKENS, input: total },
    overallTokensTotal: total,
    totalEstimatedCo2: 0,
    totalCostUsdCent: 0,
    pluginInstallations: 0,
  };
}

function series(...buckets: SeriesBucket[]): ProviderUsageSeries {
  return { from: '2026-07-01', to: '2026-07-01', buckets };
}

function mockState(state: ReturnType<typeof useUsageSeries>['state']) {
  vi.mocked(useUsageSeries).mockReturnValue({
    state,
    granularity: 'day',
    forceDay: false,
    setForceDay: vi.fn(),
  });
}

const props = { range: { from: '2026-07-01', to: '2026-07-01' }, provider: 'claude' as const, locale: 'de' as const };

afterEach(() => {
  vi.mocked(useUsageSeries).mockReset();
});

describe('ProviderUsageSeriesChart', () => {
  it('defers to the chart status while loading', () => {
    // given
    mockState({ status: 'loading' });

    // when
    const { container } = render(<ProviderUsageSeriesChart {...props} />);

    // then
    expect(container.textContent).toContain(dict('de').common.loading);
  });

  it('defers to the chart status on error', () => {
    // given
    mockState({ status: 'error', error: new Error('nope') });

    // when
    const { container } = render(<ProviderUsageSeriesChart {...props} />);

    // then
    expect(container.querySelector('[role="alert"]')!.textContent).toBe(dict('de').common.loadFailed('nope'));
  });

  it('shows the empty-period notice when the series holds no usage', () => {
    // given
    mockState({ status: 'ready', series: series(bucket(0)) });

    // when
    const { container } = render(<ProviderUsageSeriesChart {...props} />);

    // then
    expect(container.textContent).toContain(dict('de').emptyRangeNotice.message);
  });

  it('renders the controls when the series holds usage', () => {
    // given
    mockState({ status: 'ready', series: series(bucket(42)) });

    // when
    const { container } = render(<ProviderUsageSeriesChart {...props} />);

    // then
    expect(container.querySelector('.view-toggle')).not.toBeNull();
    expect(container.querySelector('.force-day-toggle')).not.toBeNull();
  });

  it('offers the model view, which the home chart does not', () => {
    // given
    mockState({ status: 'ready', series: series(bucket(42)) });

    // when
    const { container } = render(<ProviderUsageSeriesChart {...props} />);

    // then
    const labels = [...container.querySelectorAll('.view-toggle__btn')].map((b) => b.textContent);
    expect(labels).toContain(dict('de').viewToggleLabels.model);
  });

  it('asks the hook for this provider only', () => {
    // given
    mockState({ status: 'loading' });

    // when
    render(<ProviderUsageSeriesChart {...props} provider="opencode" />);

    // then
    expect(useUsageSeries).toHaveBeenCalledExactlyOnceWith(props.range, 'opencode');
  });
});
