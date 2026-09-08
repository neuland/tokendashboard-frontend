import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useUsageSeries } from './useUsageSeries';
import { fetchAllUsageSeries, fetchProviderUsageSeries } from './api';
import type { Provider, ProviderUsageSeries } from './types';

vi.mock('./api');

function series(from = '2026-07-01', to = '2026-07-02'): ProviderUsageSeries {
  return { from, to, buckets: [] };
}

/** A promise this test settles, so `loading` is observable. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// A range that fits inside two months, and one that does not.
const SHORT = { from: '2026-01-15', to: '2026-03-15' };
const LONG = { from: '2026-01-15', to: '2026-03-16' };

beforeEach(() => {
  vi.mocked(fetchAllUsageSeries).mockReset().mockResolvedValue(series());
  vi.mocked(fetchProviderUsageSeries).mockReset().mockResolvedValue(series());
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useUsageSeries request routing', () => {
  it('asks for one provider when given one', async () => {
    // given / when
    await act(async () => {
      renderHook(() => useUsageSeries(SHORT, 'claude'));
    });

    // then
    expect(fetchProviderUsageSeries).toHaveBeenCalledExactlyOnceWith('claude', SHORT, 'day');
    expect(fetchAllUsageSeries).not.toHaveBeenCalled();
  });

  it('aggregates across the selected providers when given no provider', async () => {
    // given — hoisted, not built inline: an array rebuilt on every render sends the
    // effect into a loop (see the note on `useUsageSeries`)
    const selected: Provider[] = ['claude', 'copilot'];

    // when
    await act(async () => {
      renderHook(() => useUsageSeries(SHORT, undefined, selected));
    });

    // then
    expect(fetchAllUsageSeries).toHaveBeenCalledExactlyOnceWith(SHORT, 'day', selected);
    expect(fetchProviderUsageSeries).not.toHaveBeenCalled();
  });
});

describe('useUsageSeries state', () => {
  it('starts loading and settles on the fetched series', async () => {
    // given
    const first = deferred<ProviderUsageSeries>();
    vi.mocked(fetchProviderUsageSeries).mockReturnValue(first.promise);
    const { result } = renderHook(() => useUsageSeries(SHORT, 'claude'));

    // then
    expect(result.current.state).toEqual({ status: 'loading' });

    // when
    const loaded = series();
    await act(async () => {
      first.resolve(loaded);
    });

    // then
    expect(result.current.state).toEqual({ status: 'ready', series: loaded });
  });

  it('hands the rejection on unchanged, leaving the wording to the render path', async () => {
    // given
    const rejection = new Error('gateway timeout');
    vi.mocked(fetchProviderUsageSeries).mockRejectedValue(rejection);

    // when
    const { result } = renderHook(() => useUsageSeries(SHORT, 'claude'));
    await act(async () => {});

    // then
    expect(result.current.state).toEqual({ status: 'error', error: rejection });
  });

  it('hands on a rejection that is not an Error just as it is', async () => {
    // given
    vi.mocked(fetchProviderUsageSeries).mockRejectedValue('just a string');

    // when
    const { result } = renderHook(() => useUsageSeries(SHORT, 'claude'));
    await act(async () => {});

    // then
    expect(result.current.state).toEqual({ status: 'error', error: 'just a string' });
  });
});

describe('useUsageSeries granularity', () => {
  it('buckets by day while the range fits inside two months', async () => {
    // given / when
    const { result } = renderHook(() => useUsageSeries(SHORT, 'claude'));
    await act(async () => {});

    // then
    expect(result.current.granularity).toBe('day');
  });

  it('switches to weeks once the range grows past two months', async () => {
    // given / when
    const { result } = renderHook(() => useUsageSeries(LONG, 'claude'));
    await act(async () => {});

    // then
    expect(result.current.granularity).toBe('week');
    expect(fetchProviderUsageSeries).toHaveBeenCalledExactlyOnceWith('claude', LONG, 'week');
  });

  it('honours forceDay on a long range, and refetches because granularity is part of the request', async () => {
    // given
    const { result } = renderHook(() => useUsageSeries(LONG, 'claude'));
    await act(async () => {});
    expect(result.current.granularity).toBe('week');
    expect(result.current.forceDay).toBe(false);

    // when
    await act(async () => {
      result.current.setForceDay(true);
    });

    // then
    expect(result.current.granularity).toBe('day');
    expect(result.current.forceDay).toBe(true);
    expect(fetchProviderUsageSeries).toHaveBeenCalledTimes(2);
    expect(vi.mocked(fetchProviderUsageSeries).mock.calls[1][2]).toBe('day');
  });
});

describe('useUsageSeries reacts to its inputs, not to renders', () => {
  it('does not refetch when the caller passes a fresh range object with the same dates', async () => {
    // given — callers resolve `range` on every render, so the object identity always differs
    const { rerender } = renderHook(() => useUsageSeries({ from: '2026-01-15', to: '2026-03-15' }, 'claude'));
    await act(async () => {});
    expect(fetchProviderUsageSeries).toHaveBeenCalledTimes(1);

    // when
    await act(async () => {
      rerender();
    });
    await act(async () => {
      rerender();
    });

    // then
    expect(fetchProviderUsageSeries).toHaveBeenCalledTimes(1);
  });

  it('reads loading on the very first render after the dates change', async () => {
    // given
    let range = { from: '2026-01-15', to: '2026-03-15' };
    const first = deferred<ProviderUsageSeries>();
    const second = deferred<ProviderUsageSeries>();
    vi.mocked(fetchProviderUsageSeries).mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { result, rerender } = renderHook(() => useUsageSeries(range, 'claude'));
    await act(async () => {
      first.resolve(series());
    });
    expect(result.current.state.status).toBe('ready');

    // when — a new range, whose data has not arrived yet
    range = { from: '2026-02-01', to: '2026-02-28' };
    await act(async () => {
      rerender();
    });

    // then — derived from the stale request key, not set by a later effect
    expect(result.current.state.status).toBe('loading');

    // when
    await act(async () => {
      second.resolve(series());
    });

    // then
    expect(result.current.state.status).toBe('ready');
    expect(fetchProviderUsageSeries).toHaveBeenCalledTimes(2);
  });

  it('refetches when the selected providers change', async () => {
    // given
    let selected: Provider[] = ['claude'];
    const { rerender } = renderHook(() => useUsageSeries(SHORT, undefined, selected));
    await act(async () => {});
    expect(fetchAllUsageSeries).toHaveBeenCalledTimes(1);

    // when
    selected = ['claude', 'copilot'];
    await act(async () => {
      rerender();
    });

    // then
    expect(fetchAllUsageSeries).toHaveBeenCalledTimes(2);
  });

  it('refetches when the provider changes', async () => {
    // given
    let provider: 'claude' | 'copilot' = 'claude';
    const { rerender } = renderHook(() => useUsageSeries(SHORT, provider));
    await act(async () => {});

    // when
    provider = 'copilot';
    await act(async () => {
      rerender();
    });

    // then
    expect(fetchProviderUsageSeries).toHaveBeenCalledTimes(2);
    expect(vi.mocked(fetchProviderUsageSeries).mock.calls[1][0]).toBe('copilot');
  });

  it('ignores a response that arrives after the inputs moved on', async () => {
    // given — the first request settles only after a second one was issued
    let range = { from: '2026-01-15', to: '2026-03-15' };
    const stale = deferred<ProviderUsageSeries>();
    const fresh = deferred<ProviderUsageSeries>();
    vi.mocked(fetchProviderUsageSeries).mockReturnValueOnce(stale.promise).mockReturnValueOnce(fresh.promise);
    const { result, rerender } = renderHook(() => useUsageSeries(range, 'claude'));
    range = { from: '2026-02-01', to: '2026-02-28' };
    await act(async () => {
      rerender();
    });

    // when — the abandoned request answers last
    const freshSeries = series('2026-02-01', '2026-02-28');
    await act(async () => {
      fresh.resolve(freshSeries);
      stale.resolve(series('2026-01-15', '2026-03-15'));
    });

    // then
    expect(result.current.state).toEqual({ status: 'ready', series: freshSeries });
  });
});
