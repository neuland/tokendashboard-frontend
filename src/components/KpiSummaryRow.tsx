import type { JSX } from 'react';
import { Sigma, Leaf, DollarSign } from 'lucide-react';
import { usdCentToUsd } from '~/lib/types';
import { formatTokens, formatCo2, formatUsd } from '~/lib/format';
import { dict, type Locale } from '~/i18n';
import KpiCard from './KpiCard';
import { FaqAsterisk } from './FaqAsterisk';

interface KpiSummaryRowProps {
  tokensInOut: number;
  totalEstimatedCo2: number;
  totalCostUsdCent: number;
  /** What the totals span, named in the card subtitles, e.g. 'Provider' or 'Modelle'. */
  scope: string;
  locale: Locale;
}

export default function KpiSummaryRow({
  tokensInOut,
  totalEstimatedCo2,
  totalCostUsdCent,
  scope,
  locale,
}: KpiSummaryRowProps): JSX.Element {
  const t = dict(locale);
  const grand = formatTokens(tokensInOut, locale);
  const co2Fmt = formatCo2(totalEstimatedCo2, locale);
  const costFmt = formatUsd(usdCentToUsd(totalCostUsdCent), locale);

  return (
    <div className="kpi-summary-row">
      <KpiCard
        label={<>{t.kpiSummaryRow.totalTokens}<FaqAsterisk kind="tokens" locale={locale} /></>}
        value={grand.value}
        unit={`${grand.unit} ${t.common.tokensLabel}`}
        sub={t.kpiSummaryRow.totalTokensSub(scope)}
        icon={<Sigma size={20} strokeWidth={1.75} />}
        variant="accent"
      />
      <KpiCard
        label={<>{t.kpiSummaryRow.totalCo2}<FaqAsterisk kind="co2" locale={locale} /></>}
        value={co2Fmt.value}
        unit={co2Fmt.unit}
        sub={t.kpiSummaryRow.totalCo2Sub}
        icon={<Leaf size={20} strokeWidth={1.75} />}
        variant="teal"
      />
      <KpiCard
        label={<>{t.kpiSummaryRow.totalCost}<FaqAsterisk kind="cost" locale={locale} /></>}
        value={costFmt.value}
        unit={costFmt.unit}
        sub={t.kpiSummaryRow.totalCostSub(scope)}
        icon={<DollarSign size={20} strokeWidth={1.75} />}
      />
    </div>
  );
}
