import { useEffect, useMemo, useState } from 'react';
import type { Provider, ProviderUsageSeries, SeriesGranularity } from './types';
import { fetchAllUsageSeries, fetchProviderUsageSeries } from './api';
import type { DateRange } from './range';
import { exceedsMonths } from './range';

export type UsageSeriesState =
  | { status: 'loading' }
  | { status: 'error'; error: unknown }
  | { status: 'ready'; series: ProviderUsageSeries };

/**
 * How the buckets are chosen: `auto` picks days up to two months and weeks beyond,
 * `day` and `week` pin one regardless of the range.
 */
export type SeriesResolution = 'auto' | SeriesGranularity;

interface UsageSeriesResult {
  state: UsageSeriesState;
  granularity: SeriesGranularity;
  /** The granularity `auto` would pick for the current range. */
  autoGranularity: SeriesGranularity;
  resolution: SeriesResolution;
  setResolution: (resolution: SeriesResolution) => void;
}

/**
 * Loads the usage history for `range`: for one `provider`, or — with `provider`
 * omitted — aggregated across `selectedProviders` for the home page.
 *
 * `range` may be a fresh object per render (it is rebuilt from its dates below), but
 * `selectedProviders` must keep a stable identity while its contents are unchanged —
 * both callers pass state straight through. An array rebuilt inline in the caller's
 * render sends the effect into a loop: each pass hands it a new identity, which
 * refetches, which re-renders. Hold it in state or memoise it.
 */
export function useUsageSeries(range: DateRange, provider?: Provider, selectedProviders?: Provider[]): UsageSeriesResult {
  const [resolution, setResolution] = useState<SeriesResolution>('auto');
  // Beyond two months there are too many daily bars to read, so bucket by week unless
  // the user pins a resolution.
  const autoGranularity: SeriesGranularity = exceedsMonths(range, 2) ? 'week' : 'day';
  const granularity: SeriesGranularity = resolution === 'auto' ? autoGranularity : resolution;

  // Callers resolve `range` on every render, so rebuild it from its dates: the effect
  // below needs an identity that changes only when the dates do.
  const queryRange = useMemo(() => ({ from: range.from, to: range.to }), [range.from, range.to]);

  // Which request the settled result belongs to. `loading` is derived from a stale key
  // instead of set inside the effect, so a new range renders as loading in the same
  // pass rather than one render later.
  const requestKey = [
    queryRange.from,
    queryRange.to,
    granularity,
    provider,
    selectedProviders?.join(','),
  ].join('|');
  const [settled, setSettled] = useState<{ key: string; state: UsageSeriesState } | null>(null);
  const state: UsageSeriesState =
    settled && settled.key === requestKey ? settled.state : { status: 'loading' };

  useEffect(() => {
    let active = true;
    const fetchSeries = provider
      ? fetchProviderUsageSeries(provider, queryRange, granularity)
      : fetchAllUsageSeries(queryRange, granularity, selectedProviders);
    fetchSeries
      .then((series) => {
        if (active) {
          setSettled({ key: requestKey, state: { status: 'ready', series } });
        }
      })
      .catch((err: unknown) => {
        if (!active) {
          return;
        }
        setSettled({
          key: requestKey,
          state: {
            status: 'error',
            error: err,
          },
        });
      });
    return () => {
      active = false;
    };
  }, [requestKey, queryRange, granularity, provider, selectedProviders]);

  return { state, granularity, autoGranularity, resolution, setResolution };
}
