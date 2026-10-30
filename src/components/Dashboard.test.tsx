import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import Dashboard from './Dashboard';
import type { UsageOverview } from '~/lib/types';
import { fetchUsageOverview } from '~/lib/api';
import { useUsageSeries } from '~/lib/useUsageSeries';
import { dict } from '~/i18n';

vi.mock('~/lib/api');
// The history has its own hook and its own tests; here it stays in `loading`.
vi.mock('~/lib/useUsageSeries');

const t = dict('de');

function overview(tokensInOut: number): UsageOverview {
  return {
    from: '2026-07-01',
    to: '2026-07-30',
    providerUsages: { claude: { provider: 'claude', tokensInOut, totalEstimatedCo2: 1_500, totalCostUsdCent: 4_321 } },
    tokensInOut,
    totalEstimatedCo2: 1_500,
    totalCostUsdCent: 4_321,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const props = { locale: 'de' as const, title: 'Verbrauchsübersicht', lede: 'Firmenweit.' };

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState({}, '', '/');
  vi.mocked(fetchUsageOverview).mockReset();
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
  vi.mocked(useUsageSeries).mockReset();
});

describe('Dashboard', () => {
  it('renders the page bar with the title, the resolution switch at the chart, and loading', async () => {
    // given
    const first = deferred<UsageOverview>();
    vi.mocked(fetchUsageOverview).mockReturnValue(first.promise);

    // when
    const { container, getByRole } = render(<Dashboard {...props} />);

    // then
    expect(container.querySelector('h1')?.textContent).toBe(props.title);
    expect(getByRole('group', { name: t.resolution.label })).toBeTruthy();
    expect(container.textContent).toContain(t.common.loading);

    // cleanup — settle the request so nothing updates after unmount
    await act(async () => {
      first.resolve(overview(1));
    });
  });

  it('hides the resolution switch for a range too short for weekly bars', async () => {
    // given — a week: weekly bars would be a single bar
    window.history.replaceState({}, '', '/?preset=last7');
    vi.mocked(fetchUsageOverview).mockResolvedValue(overview(1));

    // when
    const { queryByRole } = render(<Dashboard {...props} />);
    await act(async () => {});

    // then
    expect(queryByRole('group', { name: t.resolution.label })).toBeNull();
  });

  it('fills the key figures and the provider table once the overview arrives', async () => {
    // given
    vi.mocked(fetchUsageOverview).mockResolvedValue(overview(1_234_567));

    // when
    const { container } = render(<Dashboard {...props} />);
    await act(async () => {});

    // then
    const kpi = container.querySelector('.app-kpi-band');
    expect(kpi?.textContent).toContain(t.dashboard.kpis);
    expect(kpi?.textContent).toContain('1,2');
    expect(container.querySelector('.app-table')).not.toBeNull();
    expect(container.querySelector('.app-table [title="1.234.567"]')).not.toBeNull();
  });

  it('links each provider row to its provider page, carrying the time window', async () => {
    // given
    vi.mocked(fetchUsageOverview).mockResolvedValue(overview(10));

    // when
    const { container } = render(<Dashboard {...props} />);
    await act(async () => {});

    // then
    const href = container.querySelector<HTMLAnchorElement>('.app-table a.app-row-link')?.getAttribute('href');
    expect(href).toMatch(/^\/provider\/claude\/\?preset=/);
  });

  it('shows the empty notice instead of the table for a period without usage', async () => {
    // given
    vi.mocked(fetchUsageOverview).mockResolvedValue(overview(0));

    // when
    const { container } = render(<Dashboard {...props} />);
    await act(async () => {});

    // then
    expect(container.querySelector('.app-table')).toBeNull();
    expect(container.textContent).toContain(t.emptyRangeNotice.message);
  });

  it('reports a failed overview in place of the table', async () => {
    // given
    vi.mocked(fetchUsageOverview).mockRejectedValue(new Error('boom'));

    // when
    const { container } = render(<Dashboard {...props} />);
    await act(async () => {});

    // then
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('boom');
  });

  it('marks the history with the cache badge only while the view counts cache tokens', async () => {
    // given
    vi.mocked(fetchUsageOverview).mockResolvedValue(overview(1));
    const { container, getByRole } = render(<Dashboard {...props} />);
    await act(async () => {});
    const badge = (): Element | null => container.querySelector('#app-history')?.closest('.app-card')?.querySelector('.app-filter-row .app-pill--cache') ?? null;
    expect(badge()).toBeNull();

    // when
    fireEvent.click(getByRole('button', { name: t.viewToggleLabels.tokenTypeAll }));

    // then
    expect(badge()?.textContent).toBe(t.common.inclCache);
  });
});
