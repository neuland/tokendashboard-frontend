import type { JSX } from 'react';
import type { UsageOverview } from '~/lib/types';
import { dict, type Locale } from '~/i18n';
import KpiSummaryRow from './KpiSummaryRow';

export default function KpiCards({ overview, locale }: { overview: UsageOverview; locale: Locale }): JSX.Element {
  const t = dict(locale);
  return (
    <KpiSummaryRow
      tokensInOut={overview.tokensInOut}
      totalEstimatedCo2={overview.totalEstimatedCo2}
      totalCostUsdCent={overview.totalCostUsdCent}
      scope={t.common.scopeProviders}
      locale={locale}
    />
  );
}
