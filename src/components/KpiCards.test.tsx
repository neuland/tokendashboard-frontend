import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import KpiCards from './KpiCards';
import type { UsageOverview } from '~/lib/types';
import { formatTokens, formatUsd } from '~/lib/format';
import { dict } from '~/i18n';

const overview: UsageOverview = {
  from: '2026-07-01',
  to: '2026-07-31',
  providerUsages: {},
  tokensInOut: 5_000_000,
  totalEstimatedCo2: 1_500,
  totalCostUsdCent: 5_000,
};

describe('KpiCards', () => {
  it('feeds the company-wide totals into the summary row', () => {
    // when
    const { container } = render(<KpiCards overview={overview} locale="de" />);
    const cards = container.querySelectorAll('.kpi-card');

    // then
    expect(cards).toHaveLength(3);
    expect(cards[0].querySelector('.kpi-card__value')!.textContent).toBe(formatTokens(5_000_000, 'de').value);
    expect(cards[2].querySelector('.kpi-card__value')!.textContent).toBe(formatUsd(50, 'de').value);
  });

  it('scopes the subtitles to providers', () => {
    // given
    const t = dict('de');

    // when
    const { container } = render(<KpiCards overview={overview} locale="de" />);

    // then
    expect(container.querySelectorAll('.kpi-card__sub')[0].textContent).toBe(
      t.kpiSummaryRow.totalTokensSub(t.common.scopeProviders),
    );
  });
});
