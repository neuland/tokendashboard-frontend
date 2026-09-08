import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';
import ProviderDetail from './ProviderDetail';
import type { ProviderUsage, TokenCounts } from '~/lib/types';
import { ACTIVE_PROVIDERS, fetchProviderUsage } from '~/lib/api';
import { dict } from '~/i18n';

vi.mock('~/lib/api');

// Stubbed out: the history chart fetches its own series and has its own test file.
vi.mock('./ProviderUsageSeriesChart', () => ({ default: () => <div className="series-stub" /> }));

const t = dict('de');
const allProviders = [...ACTIVE_PROVIDERS];
const NO_TOKENS: TokenCounts = { input: 0, output: 0, cacheWrite: 0, cacheRead: 0 };

function usage(tokensInOut: number): ProviderUsage {
  return {
    provider: 'claude',
    modelFamilies: [],
    overallTokens: { ...NO_TOKENS, input: tokensInOut },
    overallTokensTotal: tokensInOut,
    tokensInOut,
    totalEstimatedCo2: 500,
    totalCostUsdCent: 1_234,
    activeUsers: 7,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState({}, '', '/');
  vi.mocked(fetchProviderUsage).mockReset();
});

afterEach(() => {
  ACTIVE_PROVIDERS.splice(0, ACTIVE_PROVIDERS.length, ...allProviders);
  window.localStorage.clear();
});

describe('ProviderDetail', () => {
  it('renders as loading until the usage arrives, keeping the back link and picker', () => {
    // given
    const first = deferred<ProviderUsage>();
    vi.mocked(fetchProviderUsage).mockReturnValue(first.promise);

    // when
    const { container } = render(<ProviderDetail provider="claude" locale="de" />);

    // then
    expect(container.textContent).toContain(t.common.loading);
    expect(container.querySelector('a.back-link')).not.toBeNull();
    expect(container.querySelector('button.rp__trigger')).not.toBeNull();
  });

  it('shows the totals once the usage arrives', async () => {
    // given
    vi.mocked(fetchProviderUsage).mockResolvedValue(usage(9_000));

    // when
    const { container } = render(<ProviderDetail provider="claude" locale="de" />);
    await act(async () => {});

    // then
    expect(container.textContent).not.toContain(t.common.loading);
    expect(container.textContent).toContain(t.providerDetail.totals);
  });

  it('reports a provider without backend data as not found, without fetching', () => {
    // given — claude is no longer among the active providers
    ACTIVE_PROVIDERS.splice(ACTIVE_PROVIDERS.indexOf('claude'), 1);

    // when
    const { container } = render(<ProviderDetail provider="claude" locale="de" />);

    // then
    expect(container.querySelector('[role="alert"]')!.textContent).toContain(t.providerDetail.notFound);
    expect(fetchProviderUsage).not.toHaveBeenCalled();
  });

  it('announces a failed load as an alert', async () => {
    // given
    vi.mocked(fetchProviderUsage).mockRejectedValue(new Error('gateway timeout'));

    // when
    const { container } = render(<ProviderDetail provider="claude" locale="de" />);
    await act(async () => {});

    // then
    expect(container.querySelector('[role="alert"]')!.textContent).toContain(
      t.common.loadFailed('gateway timeout'),
    );
  });

  it('goes back to loading as soon as the range changes', async () => {
    // given — a settled page
    const first = deferred<ProviderUsage>();
    const second = deferred<ProviderUsage>();
    vi.mocked(fetchProviderUsage).mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { container } = render(<ProviderDetail provider="claude" locale="de" />);
    await act(async () => {
      first.resolve(usage(9_000));
    });
    expect(container.textContent).not.toContain(t.common.loading);

    // when
    fireEvent.click(container.querySelector('button.rp__trigger')!);
    const last7 = [...container.querySelectorAll<HTMLButtonElement>('button.rp__option')].find((b) =>
      b.textContent?.includes(t.presets.last7),
    )!;
    await act(async () => {
      fireEvent.click(last7);
    });

    // then
    expect(container.textContent).toContain(t.common.loading);
    expect(fetchProviderUsage).toHaveBeenCalledTimes(2);
  });

  it('carries the selected period into the back link', async () => {
    // given
    window.history.replaceState({}, '', '/?preset=last7');
    vi.mocked(fetchProviderUsage).mockResolvedValue(usage(9_000));

    // when
    const { container } = render(<ProviderDetail provider="claude" locale="de" />);
    await act(async () => {});

    // then
    expect(container.querySelector('a.back-link')!.getAttribute('href')).toBe('/?preset=last7');
  });

  it('points the back link at the English overview for en', async () => {
    // given
    vi.mocked(fetchProviderUsage).mockResolvedValue(usage(9_000));

    // when
    const { container } = render(<ProviderDetail provider="claude" locale="en" />);
    await act(async () => {});

    // then
    expect(container.querySelector('a.back-link')!.getAttribute('href')).toContain('/en/');
  });

  it('shows the empty-period notice when the provider reported nothing', async () => {
    // given
    vi.mocked(fetchProviderUsage).mockResolvedValue(usage(0));

    // when
    const { container } = render(<ProviderDetail provider="claude" locale="de" />);
    await act(async () => {});

    // then
    expect(container.textContent).toContain(t.emptyRangeNotice.message);
  });

  it('refetches when the provider changes', async () => {
    // given
    vi.mocked(fetchProviderUsage).mockResolvedValue(usage(9_000));
    const { rerender } = render(<ProviderDetail provider="claude" locale="de" />);
    await act(async () => {});
    expect(fetchProviderUsage).toHaveBeenCalledTimes(1);

    // when
    rerender(<ProviderDetail provider="copilot" locale="de" />);
    await act(async () => {});

    // then
    expect(fetchProviderUsage).toHaveBeenCalledTimes(2);
    expect(vi.mocked(fetchProviderUsage).mock.calls[1][0]).toBe('copilot');
  });
});
