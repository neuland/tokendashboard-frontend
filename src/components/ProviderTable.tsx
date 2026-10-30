import type { JSX } from 'react';
import type { UsageOverview, Provider } from '~/lib/types';
import { PROVIDERS, PROVIDER_LABELS, PROVIDER_COLORS, usdCentToUsd } from '~/lib/types';
import { formatNumber, formatTokensAdaptive, formatCo2, formatUsd } from '~/lib/format';
import type { RangeSelection } from '~/lib/range';
import { withRangeParams } from '~/lib/range';
import { pagePath } from '~/lib/paths';
import { dict, type Locale } from '~/i18n';
import { FaqAsterisk } from './FaqAsterisk';
import SectionCard from './SectionCard';
import ShareBar from './ShareBar';
import ProviderGlyph from './ProviderGlyph';

const BASE = import.meta.env.BASE_URL;

interface Props {
  overview: UsageOverview;
  selection: RangeSelection;
  locale: Locale;
}

/** Abbreviated above a million, exact value on hover — the column must fit beside the share bar. */
function tokenCell(value: number, locale: Locale): JSX.Element {
  const f = formatTokensAdaptive(value, locale);
  return <span title={formatNumber(value, locale)}>{f.unit ? `${f.value} ${f.unit}` : f.value}</span>;
}

/** Usage per provider as a table with a share bar, linking to the provider pages. */
export default function ProviderTable({ overview, selection, locale }: Props): JSX.Element {
  const t = dict(locale);
  const rows = PROVIDERS.flatMap((p: Provider) => {
    const u = overview.providerUsages[p];
    return u ? [u] : [];
  });
  const grand = overview.tokensInOut;
  const co2Total = formatCo2(overview.totalEstimatedCo2, locale);
  const costTotal = formatUsd(usdCentToUsd(overview.totalCostUsdCent), locale);
  const href = (p: Provider): string => withRangeParams(pagePath(BASE, locale, `provider/${p}/`), selection);

  return (
    <SectionCard
      title={t.dashboard.byProvider}
      flush
      headingId="app-by-provider"
    >
      <div className="app-scroll">
        <table className="app-table app-table--tight">
          <thead>
            <tr>
              <th>{t.providerComparison.providerColumn}</th>
              <th style={{ width: '15%' }}>{t.dashboard.share}</th>
              <th className="num"><span className="app-head-mark">{t.kpiSummaryRow.totalTokens}<FaqAsterisk kind="tokens" locale={locale} /></span></th>
              <th className="num"><span className="app-head-mark">{t.usageBars.co2}<FaqAsterisk kind="co2" locale={locale} /></span></th>
              <th className="num"><span className="app-head-mark">{t.common.costColumn}<FaqAsterisk kind="cost" locale={locale} /></span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const co2 = formatCo2(r.totalEstimatedCo2, locale);
              const cost = formatUsd(usdCentToUsd(r.totalCostUsdCent), locale);
              const live = r.tokensInOut > 0;
              return (
                <tr key={r.provider}>
                  <td>
                    <a className="app-row-link" href={href(r.provider)}>
                      <ProviderGlyph provider={r.provider} muted={!live} />
                      {PROVIDER_LABELS[locale][r.provider]}
                    </a>
                  </td>
                  <td><ShareBar fraction={grand > 0 ? r.tokensInOut / grand : 0} color={PROVIDER_COLORS[r.provider]} withPercent /></td>
                  <td className="num">{tokenCell(r.tokensInOut, locale)}</td>
                  <td className="num">{co2.value} {co2.unit}</td>
                  <td className="num">{cost.value} {cost.unit}</td>
                </tr>
              );
            })}
            <tr className="app-total">
              <td>{t.common.sum}</td>
              <td></td>
              <td className="num">{tokenCell(grand, locale)}</td>
              <td className="num">{co2Total.value} {co2Total.unit}</td>
              <td className="num">{costTotal.value} {costTotal.unit}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
