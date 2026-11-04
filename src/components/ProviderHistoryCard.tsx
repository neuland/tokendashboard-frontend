import type { JSX } from 'react';
import type { DateRange } from '~/lib/range';
import { rangeDays } from '~/lib/range';
import type { View } from '~/lib/seriesChartData';
import { buildProviderChartData, sortedModelFamilies } from '~/lib/seriesChartData';
import type { useUsageSeries } from '~/lib/useUsageSeries';
import { dict, type Locale } from '~/i18n';
import ViewToggle from './ViewToggle';
import ChartStatus from './ChartStatus';
import EmptyRangeNotice from './EmptyRangeNotice';
import SeriesBarChart from './SeriesBarChart';
import { renderProviderUsageBars } from './ProviderUsageBars';
import ResolutionToggle, { canSwitchResolution } from './ResolutionToggle';
import SectionCard from './SectionCard';
import CacheBadge from './CacheBadge';

const PROVIDER_VIEWS: View[] = ['tokenType', 'tokenTypeAll', 'model', 'co2', 'cost', 'installations', 'tokensPerInstallation'];

interface Props {
  series: ReturnType<typeof useUsageSeries>;
  range: DateRange;
  view: View;
  onViewChange: (view: View) => void;
  locale: Locale;
}

/**
 * The history card of a provider-shaped page: view switch, resolution switch when the
 * range allows it, and the stacked chart by token type or model family. Used by the
 * provider pages.
 */
export default function ProviderHistoryCard({ series, range, view, onViewChange, locale }: Props): JSX.Element {
  const t = dict(locale);

  let history: JSX.Element;
  if (series.state.status !== 'ready') {
    history = <ChartStatus {...series.state} locale={locale} />;
  } else if (!series.state.series.buckets.some((b) => b.overallTokensTotal > 0)) {
    history = <EmptyRangeNotice locale={locale} />;
  } else {
    const families = sortedModelFamilies(series.state.series);
    history = (
      <SeriesBarChart
        chartData={buildProviderChartData(series.state.series, series.granularity, view, families, locale)}
        series={series.state.series}
        granularity={series.granularity}
        view={view}
        locale={locale}
      >
        {renderProviderUsageBars(view, families, locale)}
      </SeriesBarChart>
    );
  }

  return (
    <SectionCard
      title={t.dashboard.history}
      aside={
        canSwitchResolution(rangeDays(range)) && (
          <>
            <span>{t.resolution.barsPer}</span>
            <ResolutionToggle resolution={series.resolution} granularity={series.granularity} onChange={series.setResolution} locale={locale} />
          </>
        )
      }
      headingId="app-history"
    >
      <div className="app-filter-row">
        <ViewToggle views={PROVIDER_VIEWS} active={view} onChange={onViewChange} locale={locale} />
        {view === 'tokenTypeAll' && <span className="app-filter-row__end"><CacheBadge locale={locale} /></span>}
      </div>
      {history}
    </SectionCard>
  );
}
