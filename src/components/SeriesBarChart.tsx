import type { JSX, ReactNode } from 'react';
import { BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceArea, ResponsiveContainer } from 'recharts';
import type { ProviderUsageSeries, SeriesGranularity } from '~/lib/types';
import { formatNumber, formatTokens, formatCo2, formatUsd } from '~/lib/format';
import { isWeekend } from '~/lib/range';
import type { ChartRow, View } from '~/lib/seriesChartData';
import { axisLabel } from '~/lib/seriesChartData';
import { dict, type Locale } from '~/i18n';

const WEEKEND_COLOR = '#FF9A3C';

// Week labels ("KW23 2026") are wide, so on long ranges the tick interval scales with
// the bucket count to keep at most this many on the axis.
const MAX_WEEK_TICKS = 15;

interface Props {
  chartData: ChartRow[];
  series: ProviderUsageSeries;
  granularity: SeriesGranularity;
  view: View;
  children: ReactNode;
  locale: Locale;
}

/**
 * Shared chart frame — axes, tooltip, legend, weekend shading — for both the home and
 * provider history charts. The bars come in as `children`; see `HomeUsageBars` and
 * `ProviderUsageBars`.
 */
export default function SeriesBarChart({ chartData, series, granularity, view, children, locale }: Props): JSX.Element {
  const t = dict(locale);
  const weekTickInterval = Math.max(3, Math.ceil(series.buckets.length / MAX_WEEK_TICKS) - 1);
  // Shading Sat/Sun makes the weekly rhythm legible; pointless for week buckets, which
  // span whole calendar weeks anyway.
  const weekendLabels =
    granularity === 'day'
      ? series.buckets.filter((b) => isWeekend(b.date)).map((b) => axisLabel(b, granularity, locale))
      : [];

  return (
    <div className="card chart-card">
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 16, right: 8, bottom: 8, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEEBE6" vertical={false} />
            {weekendLabels.map((label) => (
              <ReferenceArea
                key={label}
                x1={label}
                x2={label}
                fill={WEEKEND_COLOR}
                fillOpacity={0.15}
                stroke="none"
                ifOverflow="visible"
              />
            ))}
            <XAxis
              dataKey="date"
              interval={granularity === 'week' ? weekTickInterval : 'preserveStartEnd'}
              tick={{ fontSize: 12, fill: '#666666', fontFamily: 'DM Sans, sans-serif' }}
              tickLine={false}
              axisLine={{ stroke: '#C5BDB6' }}
            />
            <YAxis
              allowDecimals={false}
              tickFormatter={(v: number) => {
                if (view === 'co2') {
                  return `${formatCo2(v, locale).value} ${formatCo2(v, locale).unit}`;
                }
                if (view === 'cost') {
                  return `${formatUsd(v, locale).value} ${formatUsd(v, locale).unit}`;
                }
                if (view === 'installations') {
                  return formatNumber(v, locale);
                }
                const f = formatTokens(v, locale);
                return f.unit ? `${f.value} ${f.unit}` : f.value;
              }}
              tick={{ fontSize: 12, fill: '#666666', fontFamily: 'Fira Code, monospace' }}
              tickLine={false}
              axisLine={{ stroke: '#C5BDB6' }}
              width={88}
            />
            <Tooltip
              labelFormatter={(_, payload) =>
                (payload?.[0]?.payload as { fullLabel?: string } | undefined)?.fullLabel ?? ''
              }
              formatter={(value: number, name: string) => {
                if (view === 'co2') {
                  const f = formatCo2(value, locale);
                  return [`${f.value} ${f.unit}`, name];
                }
                if (view === 'cost') {
                  const f = formatUsd(value, locale);
                  return [`${f.value} ${f.unit}`, name];
                }
                if (view === 'installations') {
                  return [`${formatNumber(value, locale)} ${t.seriesBarChart.installationsSuffix}`, name];
                }
                if (view === 'tokensPerInstallation') {
                  return [`${formatNumber(value, locale)} ${t.seriesBarChart.tokensPerInstallationSuffix}`, name];
                }
                const suffix = view === 'tokenTypeAll' ? '' : t.seriesBarChart.inOutSuffix;
                return [`${formatNumber(value, locale)} ${t.common.tokensLabel}${suffix}`, name];
              }}
              contentStyle={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 13,
                border: '1px solid #EEEBE6',
                borderRadius: 8,
              }}
            />
            <Legend wrapperStyle={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13 }} />
            {children}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
