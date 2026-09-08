import { useState, type JSX } from 'react';
import type { Provider } from '~/lib/types';
import type { DateRange } from '~/lib/range';
import type { View } from '~/lib/seriesChartData';
import { viewTitle, buildProviderChartData, sortedModelFamilies } from '~/lib/seriesChartData';
import { useUsageSeries } from '~/lib/useUsageSeries';
import type { Locale } from '~/i18n';
import EmptyRangeNotice from './EmptyRangeNotice';
import ChartStatus from './ChartStatus';
import ForceDayToggle from './ForceDayToggle';
import ViewToggle from './ViewToggle';
import SeriesBarChart from './SeriesBarChart';
import { renderProviderUsageBars } from './ProviderUsageBars';

const VIEWS: View[] = ['tokenType', 'tokenTypeAll', 'model', 'co2', 'cost', 'installations', 'tokensPerInstallation'];

interface Props {
  range: DateRange;
  provider: Provider;
  locale: Locale;
}

/** Provider page history: one provider, split by token type or model family. */
export default function ProviderUsageSeriesChart({ range, provider, locale }: Props): JSX.Element {
  const { state, granularity, forceDay, setForceDay } = useUsageSeries(range, provider);
  const [view, setView] = useState<View>('tokenType');

  if (state.status !== 'ready') {
    return <ChartStatus {...state} locale={locale} />;
  }

  const { series } = state;
  const hasUsage = series.buckets.some((b) => b.overallTokensTotal > 0);
  if (!hasUsage) {
    return <EmptyRangeNotice locale={locale} />;
  }

  const families = sortedModelFamilies(series);
  const chartData = buildProviderChartData(series, granularity, view, families, locale);

  return (
    <>
      <div className="section-title">
        <h2 className="ds-h2">{viewTitle(view, locale)}</h2>
      </div>

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

      <SeriesBarChart chartData={chartData} series={series} granularity={granularity} view={view} locale={locale}>
        {renderProviderUsageBars(view, families, locale)}
      </SeriesBarChart>
    </>
  );
}
