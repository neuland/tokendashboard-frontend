import type { CSSProperties, JSX } from 'react';
import { usdCentToUsd } from '~/lib/types';
import { formatCo2, formatTokens, formatUsd } from '~/lib/format';
import { dict, type Locale } from '~/i18n';
import { FaqAsterisk, type FaqAsteriskKind } from '~/components/FaqAsterisk';

interface Props {
  tokensInOut: number;
  totalEstimatedCo2: number;
  totalCostUsdCent: number;
  /** What the figures span, shown next to the heading: all providers, or all models. */
  scope: string;
  locale: Locale;
}

const TOKENS_COLOR = '#FF5A55';
const CO2_COLOR = '#0EA19C';
const COST_COLOR = '#857871';

/**
 * The three key figures as a band across the top of a page, one tinted tile per
 * figure with its series colour as an accent stripe. Each figure carries a footnote
 * mark into the FAQ entry that explains how it is calculated.
 */
export default function KpiList({ tokensInOut, totalEstimatedCo2, totalCostUsdCent, scope, locale }: Props): JSX.Element {
  const t = dict(locale);
  const tokens = formatTokens(tokensInOut, locale);
  const co2 = formatCo2(totalEstimatedCo2, locale);
  const cost = formatUsd(usdCentToUsd(totalCostUsdCent), locale);
  const rows: { key: FaqAsteriskKind; color: string; label: string; value: string; unit: string }[] = [
    { key: 'tokens', color: TOKENS_COLOR, label: t.kpiSummaryRow.totalTokens, value: tokens.value, unit: tokens.unit || t.common.tokensLabel },
    { key: 'co2', color: CO2_COLOR, label: t.kpiSummaryRow.totalCo2, value: co2.value, unit: co2.unit },
    { key: 'cost', color: COST_COLOR, label: t.kpiSummaryRow.totalCost, value: cost.value, unit: cost.unit },
  ];
  return (
    <section className="nx-kpi-band" aria-labelledby="nx-kpis">
      <div className="nx-kpi-band__head">
        <h2 className="nx-kpi-band__title" id="nx-kpis">{t.next.kpis}</h2>
        <span className="nx-kpi-band__scope">{scope}</span>
      </div>
      <div className="nx-kpis">
        {rows.map((r) => (
          <div className="nx-kpi" key={r.key} style={{ '--nx-kpi-color': r.color } as CSSProperties}>
            <span className="nx-eyebrow nx-kpi__label">
              {r.label}
              <FaqAsterisk kind={r.key} locale={locale} />
            </span>
            <span className="nx-kpi__value">
              <span className="nx-kpi__num nx-num">{r.value}</span>
              <span className="nx-kpi__unit">{r.unit}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
