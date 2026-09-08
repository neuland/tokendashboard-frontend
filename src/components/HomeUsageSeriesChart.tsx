import { useState, type JSX } from 'react';
import type { Provider } from '~/lib/types';
import { ACTIVE_PROVIDERS } from '~/lib/api';
import type { DateRange } from '~/lib/range';
import type { View } from '~/lib/seriesChartData';
import { viewTitle, buildHomeChartData } from '~/lib/seriesChartData';
import { useUsageSeries } from '~/lib/useUsageSeries';
import { dict, type Locale } from '~/i18n';
import EmptyRangeNotice from './EmptyRangeNotice';
import ProviderFilter from './ProviderFilter';
import ChartStatus from './ChartStatus';
import ForceDayToggle from './ForceDayToggle';
import ViewToggle from './ViewToggle';
import SeriesBarChart from './SeriesBarChart';
import { renderHomeUsageBars } from './HomeUsageBars';

const VIEWS: View[] = ['tokenType', 'tokenTypeAll', 'co2', 'cost', 'installations'];

interface Props {
  range: DateRange;
  selectedProviders: Provider[];
  onSelectedProvidersChange?: (providers: Provider[]) => void;
  locale: Locale;
}

/** Home page history: usage across providers, one stacked bar segment per provider. */
export default function HomeUsageSeriesChart({ range, selectedProviders, onSelectedProvidersChange, locale }: Props): JSX.Element {
  const t = dict(locale);
  const { state, granularity, forceDay, setForceDay } = useUsageSeries(range, undefined, selectedProviders);
  const [view, setView] = useState<View>('tokenType');
  // Filter rather than use `selectedProviders` directly: toggling a provider off and on
  // would otherwise move it to the end of the bars and legend.
  const homeProviders = ACTIVE_PROVIDERS.filter((p) => selectedProviders.includes(p));
  const hasUsage = state.status === 'ready' && state.series.buckets.some((b) => b.overallTokensTotal > 0);

  let body: JSX.Element;
  if (state.status !== 'ready') {
    body = <ChartStatus {...state} locale={locale} />;
  } else if (!hasUsage) {
    body = <EmptyRangeNotice locale={locale} />;
  } else {
    const { series } = state;
    body = (
      <>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-sm)',
            flexWrap: 'wrap',
            marginBottom: 'var(--space-sm)',
          }}
        >
          <ViewToggle views={VIEWS} active={view} onChange={setView} locale={locale} />
          <ForceDayToggle checked={forceDay} onChange={setForceDay} locale={locale} />
        </div>

        <SeriesBarChart
          chartData={buildHomeChartData(series, granularity, view, homeProviders, locale)}
          series={series}
          granularity={granularity}
          view={view}
          locale={locale}
        >
          {renderHomeUsageBars(homeProviders, locale)}
        </SeriesBarChart>
      </>
    );
  }

  return (
    <>
      <div
        className="section-title"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-sm)', flexWrap: 'wrap' }}
      >
        <h2 className="ds-h2">{viewTitle(view, locale)}</h2>
        {onSelectedProvidersChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            <span className="ds-body" style={{ color: 'var(--fg-2)' }}>
              {t.homeUsageSeriesChart.providerHistoryLabel}
            </span>
            <ProviderFilter selected={selectedProviders} onChange={onSelectedProvidersChange} locale={locale} />
          </div>
        )}
      </div>

      {body}
    </>
  );
}
