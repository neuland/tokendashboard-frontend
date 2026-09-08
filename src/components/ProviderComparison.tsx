import type { JSX } from 'react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ChevronRight } from 'lucide-react';
import type { UsageOverview, Provider } from '~/lib/types';
import {
  PROVIDERS,
  PROVIDER_LABELS,
  PROVIDER_SHORT_LABELS,
  PROVIDER_COLORS,
  usdCentToUsd,
} from '~/lib/types';
import { formatNumber, formatCo2, formatTokens, formatUsd } from '~/lib/format';
import type { RangeSelection } from '~/lib/range';
import { withRangeParams } from '~/lib/range';
import { dict, type Locale } from '~/i18n';
import { FaqAsterisk } from './FaqAsterisk';

interface Row {
  provider: Provider;
  label: string;
  short: string;
  total: number;
  co2: number;
  costUsdCent: number;
}

const BASE = import.meta.env.BASE_URL;

export default function ProviderComparison({
  overview,
  selection,
  locale,
}: {
  overview: UsageOverview;
  selection: RangeSelection;
  locale: Locale;
}): JSX.Element {
  const t = dict(locale);
  const localePrefix = locale === 'de' ? '' : 'en/';
  const rows: Row[] = PROVIDERS.flatMap((p) => {
    const u = overview.providerUsages[p];
    return u
      ? [{
          provider: p,
          label: PROVIDER_LABELS[locale][p],
          short: PROVIDER_SHORT_LABELS[locale][p],
          total: u.tokensInOut,
          co2: u.totalEstimatedCo2,
          costUsdCent: u.totalCostUsdCent,
        }]
      : [];
  });

  const grandTotal = overview.tokensInOut;
  const co2Total = overview.totalEstimatedCo2;
  const costTotal = overview.totalCostUsdCent;

  return (
    <div className="card chart-card">
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 16, right: 8, bottom: 8, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEEBE6" vertical={false} />
            <XAxis
              dataKey="short"
              interval={0}
              tick={{ fontSize: 13, fill: '#666666', fontFamily: 'DM Sans, sans-serif' }}
              tickLine={false}
              axisLine={{ stroke: '#C5BDB6' }}
            />
            <YAxis
              tickFormatter={(v: number) => {
                const f = formatTokens(v, locale);
                return f.unit ? `${f.value} ${f.unit}` : f.value;
              }}
              tick={{ fontSize: 12, fill: '#666666', fontFamily: 'Fira Code, monospace' }}
              tickLine={false}
              axisLine={{ stroke: '#C5BDB6' }}
              width={88}
            />
            <Tooltip
              formatter={(v: number) => [`${formatNumber(v, locale)} ${t.common.tokensLabel}`, t.common.total]}
              contentStyle={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 13,
                border: '1px solid #EEEBE6',
                borderRadius: 8,
              }}
            />
            <Bar dataKey="total" name={t.kpiSummaryRow.totalTokens} radius={[4, 4, 0, 0]}>
              {rows.map((r) => (
                <Cell key={r.provider} fill={PROVIDER_COLORS[r.provider]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="table-scroll">
        <table className="ds-table" style={{ marginTop: 'var(--space-sm)' }}>
          <thead>
            <tr>
              <th>{t.providerComparison.providerColumn}</th>
              <th className="num">
                {t.kpiSummaryRow.totalTokens}
                <span className="ds-small" style={{ display: 'block', fontWeight: 'normal' }}>
                  {t.providerComparison.withoutCache}<FaqAsterisk kind="tokens" locale={locale} />
                </span>
              </th>
              <th className="num">{t.common.co2Column}<FaqAsterisk kind="co2" locale={locale} /></th>
              <th className="num">{t.common.costColumn}<FaqAsterisk kind="cost" locale={locale} /></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const co2 = formatCo2(r.co2, locale);
              const cost = formatUsd(usdCentToUsd(r.costUsdCent), locale);
              return (
                <tr key={r.provider}>
                  <td>
                    <a className="provider-link" href={withRangeParams(`${BASE}${localePrefix}provider/${r.provider}`, selection)}>
                      {r.label}
                    </a>
                  </td>
                  <td className="num">{formatNumber(r.total, locale)}</td>
                  <td className="num">
                    {co2.value} {co2.unit}
                  </td>
                  <td className="num">
                    {cost.value} {cost.unit}
                  </td>
                  <td className="num">
                    <a className="provider-link provider-link--detail" href={withRangeParams(`${BASE}${localePrefix}provider/${r.provider}`, selection)}>
                      {t.providerComparison.detailsLink} <ChevronRight size={14} strokeWidth={2} aria-hidden="true" />
                    </a>
                  </td>
                </tr>
              );
            })}
            <tr>
              <td style={{ fontWeight: 600 }}>{t.common.total}</td>
              <td className="num" style={{ fontWeight: 600 }}>
                {formatNumber(grandTotal, locale)}
              </td>
              <td className="num" style={{ fontWeight: 600 }}>
                {(() => {
                  const c = formatCo2(co2Total, locale);
                  return `${c.value} ${c.unit}`;
                })()}
              </td>
              <td className="num" style={{ fontWeight: 600 }}>
                {(() => {
                  const c = formatUsd(usdCentToUsd(costTotal), locale);
                  return `${c.value} ${c.unit}`;
                })()}
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
