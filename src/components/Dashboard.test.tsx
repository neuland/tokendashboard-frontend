import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';
import Dashboard from './Dashboard';
import type { UsageOverview } from '~/lib/types';
import { fetchUsageOverview } from '~/lib/api';
import { dict } from '~/i18n';

vi.mock('~/lib/api');

// Stubbed out: the chart fetches its own series and has its own test file. Leaving it
// real would put a second "loading" in the tree and mask the dashboard's own state.
vi.mock('./HomeUsageSeriesChart', () => ({ default: () => <div className="home-chart-stub" /> }));

const t = dict('de');

function overview(tokensInOut: number): UsageOverview {
  return {
    from: '2026-07-01',
    to: '2026-07-30',
    providerUsages: { claude: { provider: 'claude', tokensInOut, totalEstimatedCo2: 1, totalCostUsdCent: 2 } },
    tokensInOut,
    totalEstimatedCo2: 1,
    totalCostUsdCent: 2,
  };
}

/** A promise whose settlement this test controls, so `loading` is observable. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState({}, '', '/');
  vi.mocked(fetchUsageOverview).mockReset();
});

afterEach(() => {
  window.localStorage.clear();
});

describe('Dashboard', () => {
  it('renders as loading until the overview arrives', async () => {
    // given
    const first = deferred<UsageOverview>();
    vi.mocked(fetchUsageOverview).mockReturnValue(first.promise);

    // when
    const { container } = render(<Dashboard locale="de" />);

    // then
    expect(container.textContent).toContain(t.common.loading);

    // when — the request settles
    await act(async () => {
      first.resolve(overview(1_000));
    });

    // then
    expect(container.textContent).not.toContain(t.common.loading);
    expect(container.querySelectorAll('.kpi-card').length).toBeGreaterThan(0);
  });

  it('goes back to loading as soon as the range changes, before the new data arrives', async () => {
    // given — a settled dashboard
    const first = deferred<UsageOverview>();
    const second = deferred<UsageOverview>();
    vi.mocked(fetchUsageOverview).mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { container } = render(<Dashboard locale="de" />);
    await act(async () => {
      first.resolve(overview(1_000));
    });
    expect(container.textContent).not.toContain(t.common.loading);

    // when — the user picks a different preset
    fireEvent.click(container.querySelector('button.rp__trigger')!);
    const last7 = [...container.querySelectorAll<HTMLButtonElement>('button.rp__option')].find((b) =>
      b.textContent?.includes(t.presets.last7),
    )!;
    await act(async () => {
      fireEvent.click(last7);
    });

    // then — loading is derived from the stale range, not awaited from an effect
    expect(container.textContent).toContain(t.common.loading);
    expect(fetchUsageOverview).toHaveBeenCalledTimes(2);

    // when
    await act(async () => {
      second.resolve(overview(2_000));
    });

    // then
    expect(container.textContent).not.toContain(t.common.loading);
  });

  it('announces a failed load as an alert', async () => {
    // given
    vi.mocked(fetchUsageOverview).mockRejectedValue(new Error('backend down'));

    // when
    const { container } = render(<Dashboard locale="de" />);
    await act(async () => {});

    // then
    expect(container.querySelector('[role="alert"]')!.textContent).toContain(
      t.common.loadFailed('backend down'),
    );
  });

  it('falls back to the generic message when the rejection carries no Error', async () => {
    // given
    vi.mocked(fetchUsageOverview).mockRejectedValue('just a string');

    // when
    const { container } = render(<Dashboard locale="de" />);
    await act(async () => {});

    // then
    expect(container.querySelector('[role="alert"]')!.textContent).toContain(
      t.common.loadFailed(t.common.unknownError),
    );
  });

  it('shows the provider comparison only when the period holds usage', async () => {
    // given
    vi.mocked(fetchUsageOverview).mockResolvedValue(overview(5_000));

    // when
    const { container } = render(<Dashboard locale="de" />);
    await act(async () => {});

    // then
    expect(container.textContent).toContain(t.dashboard.usageByProvider);
    expect(container.textContent).not.toContain(t.emptyRangeNotice.message);
  });

  it('replaces the comparison with the empty-period notice when there is no usage', async () => {
    // given
    vi.mocked(fetchUsageOverview).mockResolvedValue(overview(0));

    // when
    const { container } = render(<Dashboard locale="de" />);
    await act(async () => {});

    // then
    expect(container.textContent).not.toContain(t.dashboard.usageByProvider);
    expect(container.textContent).toContain(t.emptyRangeNotice.message);
  });

  it('disables the range picker while loading and re-enables it afterwards', async () => {
    // given
    const first = deferred<UsageOverview>();
    vi.mocked(fetchUsageOverview).mockReturnValue(first.promise);
    const { container } = render(<Dashboard locale="de" />);

    // then
    expect(container.querySelector<HTMLButtonElement>('button.rp__trigger')!.disabled).toBe(true);

    // when
    await act(async () => {
      first.resolve(overview(1));
    });

    // then
    expect(container.querySelector<HTMLButtonElement>('button.rp__trigger')!.disabled).toBe(false);
  });

  it('persists the picked preset into the URL so the link stays shareable', async () => {
    // given
    vi.mocked(fetchUsageOverview).mockResolvedValue(overview(1));
    const { container } = render(<Dashboard locale="de" />);
    await act(async () => {});

    // when
    fireEvent.click(container.querySelector('button.rp__trigger')!);
    const last7 = [...container.querySelectorAll<HTMLButtonElement>('button.rp__option')].find((b) =>
      b.textContent?.includes(t.presets.last7),
    )!;
    await act(async () => {
      fireEvent.click(last7);
    });

    // then
    expect(new URLSearchParams(window.location.search).get('preset')).toBe('last7');
  });

  it('restores the selection from the URL on mount', async () => {
    // given
    window.history.replaceState({}, '', '/?preset=last7');
    vi.mocked(fetchUsageOverview).mockResolvedValue(overview(1));

    // when
    const { container } = render(<Dashboard locale="de" />);
    await act(async () => {});

    // then
    expect(container.querySelector('.rp__trigger-label')!.textContent).toBe(t.presets.last7);
  });
});
