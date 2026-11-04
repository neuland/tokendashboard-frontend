import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import ProviderDetail from './ProviderDetail';
import type { ProviderUsage, TokenCounts } from '~/lib/types';
import { ACTIVE_PROVIDERS, fetchProviderUsage } from '~/lib/api';
import { useUsageSeries } from '~/lib/useUsageSeries';
import { dict } from '~/i18n';

vi.mock('~/lib/api');
vi.mock('~/lib/useUsageSeries');

const t = dict('de');
const allProviders = [...ACTIVE_PROVIDERS];
const NO_TOKENS: TokenCounts = { input: 0, output: 0, cacheWrite: 0, cacheRead: 0 };

function usage(tokensInOut: number, withModels = true): ProviderUsage {
  const tokens = { ...NO_TOKENS, input: tokensInOut };
  return {
    provider: 'claude',
    modelFamilies: withModels
      ? [{ modelFamily: 'opus', models: [{ model: 'opus-5', tokens, tokensTotal: tokensInOut, estimatedCo2: 5, costUsdCent: 50 }], tokens, tokensTotal: tokensInOut, estimatedCo2: 5, costUsdCent: 50 }]
      : [],
    overallTokens: tokens,
    overallTokensTotal: tokensInOut,
    tokensInOut,
    totalEstimatedCo2: 500,
    totalCostUsdCent: 1_234,
    activeUsers: 7,
  };
}

const props = { provider: 'claude' as const, locale: 'de' as const, title: 'Claude', lede: 'Nach Modell.' };

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState({}, '', '/provider/claude/');
  vi.mocked(fetchProviderUsage).mockReset();
  vi.mocked(useUsageSeries).mockReturnValue({
    state: { status: 'loading' },
    granularity: 'day',
    autoGranularity: 'day',
    resolution: 'auto',
    setResolution: vi.fn(),
  });
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  ACTIVE_PROVIDERS.splice(0, ACTIVE_PROVIDERS.length, ...allProviders);
  vi.mocked(useUsageSeries).mockReset();
});

describe('ProviderDetail', () => {
  it('lays the page out as history plus model table on the left, key figures, token types and plugin on the right', async () => {
    // given
    vi.mocked(fetchProviderUsage).mockResolvedValue(usage(2_000_000));

    // when
    const { container } = render(<ProviderDetail {...props} />);
    await act(async () => {});

    // then
    expect(container.querySelector('.app-area-main')?.textContent).toContain(t.dashboard.history);
    expect(container.querySelector('.app-kpi-band')?.textContent).toContain(t.dashboard.kpisScopeModels);
    expect(container.querySelector('.app-area-rail')?.textContent).toContain(t.dashboard.tokenTypes);
    expect(container.querySelector('.app-area-rail')?.textContent).toContain(t.dashboard.pluginTracking);
    expect(container.querySelector('.app-area-main .app-table')?.textContent).toContain('opus');
  });

  it('breadcrumbs back to the next overview with the same time window', async () => {
    // given
    vi.mocked(fetchProviderUsage).mockResolvedValue(usage(1));

    // when
    const { container } = render(<ProviderDetail {...props} />);
    await act(async () => {});

    // then
    const crumb = container.querySelector<HTMLAnchorElement>('.app-pagebar__crumbs a')?.getAttribute('href');
    expect(crumb).toMatch(/^\/\?preset=/);
  });

  it('shows the plugin count from the usage', async () => {
    // given
    vi.mocked(fetchProviderUsage).mockResolvedValue(usage(1));

    // when
    const { container } = render(<ProviderDetail {...props} />);
    await act(async () => {});

    // then
    expect(container.querySelector('.app-big')?.textContent).toBe('7');
  });

  it('replaces the model table with the empty notice when the period has no models', async () => {
    // given
    vi.mocked(fetchProviderUsage).mockResolvedValue(usage(0, false));

    // when
    const { container } = render(<ProviderDetail {...props} />);
    await act(async () => {});

    // then
    expect(container.querySelector('.app-area-main .app-table')).toBeNull();
    expect(container.querySelector('.app-area-main')?.textContent).toContain(t.emptyRangeNotice.message);
  });

  it('tells an inactive provider apart from a failed request, without fetching', async () => {
    // given
    ACTIVE_PROVIDERS.splice(ACTIVE_PROVIDERS.indexOf('claude'), 1);

    // when
    const { container } = render(<ProviderDetail {...props} />);
    await act(async () => {});

    // then
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(t.providerDetail.notFound);
    expect(fetchProviderUsage).not.toHaveBeenCalled();
  });

  it('marks the history with the cache badge only while the view counts cache tokens', async () => {
    // given
    vi.mocked(fetchProviderUsage).mockResolvedValue(usage(1));
    const { container, getByRole } = render(<ProviderDetail {...props} />);
    await act(async () => {});
    const badge = (): Element | null => container.querySelector('#app-history')?.closest('.app-card')?.querySelector('.app-filter-row .app-pill--cache') ?? null;
    expect(badge()).toBeNull();

    // when
    fireEvent.click(getByRole('button', { name: t.viewToggleLabels.tokenTypeAll }));

    // then
    expect(badge()?.textContent).toBe(t.common.inclCache);
  });
});
