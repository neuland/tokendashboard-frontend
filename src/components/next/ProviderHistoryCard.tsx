import type { JSX } from 'react';
import type { DateRange } from '~/lib/range';
import { rangeDays } from '~/lib/range';
import type { View } from '~/lib/seriesChartData';
import { buildProviderChartData, sortedModelFamilies } from '~/lib/seriesChartData';
import type { useUsageSeries } from '~/lib/useUsageSeries';
import { dict, type Locale } from '~/i18n';
import ViewToggle from '~/components/ViewToggle';
import ChartStatus from '~/components/ChartStatus';
import EmptyRangeNotice from '~/components/EmptyRangeNotice';
import { FaqAsterisk, type FaqAsteriskKind } from '~/components/FaqAsterisk';
import SeriesBarChart from '~/components/SeriesBarChart';
import { renderProviderUsageBars } from '~/components/ProviderUsageBars';
import ResolutionToggle, { canSwitchResolution } from './ResolutionToggle';
import SectionCard from './SectionCard';
import CacheBadge from './CacheBadge';

export const PROVIDER_VIEWS: View[] = ['tokenType', 'tokenTypeAll', 'model', 'co2', 'cost', 'installations', 'tokensPerInstallation'];
/** One machine is one installation, so the local pages leave the installation views out. */
export const LOCAL_VIEWS: View[] = ['tokenType', 'tokenTypeAll', 'model', 'co2', 'cost'];

interface Props {
  series: ReturnType<typeof useUsageSeries>;
  range: DateRange;
  view: View;
  onViewChange: (view: View) => void;
  views?: View[];
  /** FAQ mark after the title; the local pages link why older days can still grow. */
  faqMark?: FaqAsteriskKind;
  locale: Locale;
}

/**
 * The history card of a provider-shaped page: view switch, resolution switch when the
 * range allows it, and the stacked chart by token type or model family. Used by the
 * provider pages and by "this machine", whose local server answers the same shape.
 */
export default function ProviderHistoryCard({ series, range, view, onViewChange, views = PROVIDER_VIEWS, faqMark, locale }: Props): JSX.Element {
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
      title={faqMark ? <span>{t.next.history}<FaqAsterisk kind={faqMark} locale={locale} /></span> : t.next.history}
      aside={
        canSwitchResolution(rangeDays(range)) && (
          <>
            <span>{t.resolution.barsPer}</span>
            <ResolutionToggle resolution={series.resolution} granularity={series.granularity} onChange={series.setResolution} locale={locale} />
          </>
        )
      }
      headingId="nx-history"
    >
      <div className="nx-filter-row">
        <ViewToggle views={views} active={view} onChange={onViewChange} locale={locale} />
        {view === 'tokenTypeAll' && <span className="nx-filter-row__end"><CacheBadge locale={locale} /></span>}
      </div>
      {history}
    </SectionCard>
  );
}
