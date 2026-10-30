import { useEffect, useMemo, useState, type JSX } from 'react';
import type { Provider, UsageOverview } from '~/lib/types';
import type { RangeSelection } from '~/lib/range';
import { loadSelection, persistSelection, rangeDays, resolveRange } from '~/lib/range';
import { loadProviderSelection, persistProviderSelection } from '~/lib/providerSelection';
import { ACTIVE_PROVIDERS, fetchUsageOverview } from '~/lib/api';
import { useUsageSeries } from '~/lib/useUsageSeries';
import type { View } from '~/lib/seriesChartData';
import { buildHomeChartData } from '~/lib/seriesChartData';
import { dict, type Locale } from '~/i18n';
import DateRangePicker from './DateRangePicker';
import ProviderFilter from './ProviderFilter';
import ViewToggle from './ViewToggle';
import ChartStatus from './ChartStatus';
import EmptyRangeNotice from './EmptyRangeNotice';
import SeriesBarChart from './SeriesBarChart';
import { renderHomeUsageBars } from './HomeUsageBars';
import PageBar from './PageBar';
import ResolutionToggle, { canSwitchResolution } from './ResolutionToggle';
import SectionCard from './SectionCard';
import CacheBadge from './CacheBadge';
import KpiList from './KpiList';
import ProviderTable from './ProviderTable';

const VIEWS: View[] = ['tokenType', 'tokenTypeAll', 'co2', 'cost', 'installations'];

type State =
  | { status: 'loading' }
  | { status: 'error'; error: unknown }
  | { status: 'ready'; data: UsageOverview };

interface Props {
  locale: Locale;
  title: string;
  lede: string;
}

/**
 * Home page: the key figures as a band under the page bar, then the history and the
 * provider table at full width.
 */
export default function Dashboard({ locale, title, lede }: Props): JSX.Element {
  const t = dict(locale);
  const [selection, setSelection] = useState<RangeSelection>(() => loadSelection());
  const [selectedProviders, setSelectedProviders] = useState<Provider[]>(() => loadProviderSelection());
  const [view, setView] = useState<View>('tokenType');
  // Memoised so the fetch effect and the series hook both see a stable object.
  const range = useMemo(() => resolveRange(selection), [selection]);
  const rangeKey = `${range.from}|${range.to}`;
  const [settled, setSettled] = useState<{ key: string; state: State } | null>(null);
  const state: State = settled && settled.key === rangeKey ? settled.state : { status: 'loading' };
  const series = useUsageSeries(range, undefined, selectedProviders);

  useEffect(() => {
    persistSelection(selection);
  }, [selection]);

  useEffect(() => {
    persistProviderSelection(selectedProviders);
  }, [selectedProviders]);

  useEffect(() => {
    let active = true;
    fetchUsageOverview(range)
      .then((data) => {
        if (active) {
          setSettled({ key: rangeKey, state: { status: 'ready', data } });
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setSettled({ key: rangeKey, state: { status: 'error', error: err } });
        }
      });
    return () => {
      active = false;
    };
  }, [range, rangeKey]);

  // Filter rather than use `selectedProviders` directly: toggling a provider off and on
  // would otherwise move it to the end of the bars and legend.
  const homeProviders = ACTIVE_PROVIDERS.filter((p) => selectedProviders.includes(p));
  const hasUsage = series.state.status === 'ready' && series.state.series.buckets.some((b) => b.overallTokensTotal > 0);

  let history: JSX.Element;
  if (series.state.status !== 'ready') {
    history = <ChartStatus {...series.state} locale={locale} />;
  } else if (!hasUsage) {
    history = <EmptyRangeNotice locale={locale} />;
  } else {
    history = (
      <SeriesBarChart
        chartData={buildHomeChartData(series.state.series, series.granularity, view, homeProviders, locale)}
        series={series.state.series}
        granularity={series.granularity}
        view={view}
        locale={locale}
      >
        {renderHomeUsageBars(homeProviders, locale)}
      </SeriesBarChart>
    );
  }

  const busy = state.status === 'loading';

  return (
    <>
      <PageBar title={title} lede={lede}>
        <DateRangePicker selection={selection} range={range} onChange={setSelection} disabled={busy} locale={locale} />
      </PageBar>

      {state.status === 'ready' && (
        <KpiList
          tokensInOut={state.data.tokensInOut}
          totalEstimatedCo2={state.data.totalEstimatedCo2}
          totalCostUsdCent={state.data.totalCostUsdCent}
          scope={t.dashboard.kpisScopeProviders}
          locale={locale}
        />
      )}

      <div className="app-area-main">
        <SectionCard
          title={t.dashboard.history}
          aside={
            canSwitchResolution(rangeDays(range)) && (
              <>
                <span>{t.resolution.barsPer}</span>
                <ResolutionToggle
                  resolution={series.resolution}
                  granularity={series.granularity}
                  onChange={series.setResolution}
                  locale={locale}
                />
              </>
            )
          }
          headingId="app-history"
        >
          <div className="app-filter-row">
            <ViewToggle views={VIEWS} active={view} onChange={setView} locale={locale} />
            {(view === 'tokenTypeAll' || ACTIVE_PROVIDERS.length > 1) && (
              <span className="app-filter-row__end">
                {view === 'tokenTypeAll' && <CacheBadge locale={locale} />}
                {ACTIVE_PROVIDERS.length > 1 && (
                  <span className="app-provider-chips">
                    <ProviderFilter selected={selectedProviders} onChange={setSelectedProviders} locale={locale} />
                  </span>
                )}
              </span>
            )}
          </div>
          {history}
        </SectionCard>

        {state.status === 'ready' && state.data.tokensInOut > 0 && (
          <ProviderTable overview={state.data} selection={selection} locale={locale} />
        )}
        {state.status === 'ready' && state.data.tokensInOut === 0 && <EmptyRangeNotice locale={locale} />}
        {state.status === 'error' && <ChartStatus status="error" error={state.error} locale={locale} />}
      </div>
    </>
  );
}
