import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import KpiSummaryRow from './KpiSummaryRow';
import { formatCo2, formatTokens, formatUsd } from '~/lib/format';
import { dict } from '~/i18n';

const props = {
  tokensInOut: 12_300_000,
  totalEstimatedCo2: 2_500,
  totalCostUsdCent: 12_345,
  scope: 'Provider',
  locale: 'de' as const,
};

describe('KpiSummaryRow', () => {
  it('renders the tokens, CO₂ and cost cards in that order', () => {
    // given
    const t = dict('de');

    // when
    const { container } = render(<KpiSummaryRow {...props} />);

    // then
    const labels = [...container.querySelectorAll('.kpi-card__label')].map((e) => e.textContent);
    expect(labels).toHaveLength(3);
    expect(labels[0]).toContain(t.kpiSummaryRow.totalTokens);
    expect(labels[1]).toContain(t.kpiSummaryRow.totalCo2);
    expect(labels[2]).toContain(t.kpiSummaryRow.totalCost);
  });

  it('converts the cost from cents to dollars before formatting', () => {
    // given — 12_345 cent is $123.45
    const expected = formatUsd(123.45, 'de');

    // when
    const { container } = render(<KpiSummaryRow {...props} />);

    // then
    const costCard = container.querySelectorAll('.kpi-card')[2];
    expect(costCard.querySelector('.kpi-card__value')!.textContent).toBe(expected.value);
    expect(costCard.querySelector('.kpi-card__unit')!.textContent).toBe(expected.unit);
  });

  it('formats tokens and CO₂ through the shared formatters', () => {
    // when
    const { container } = render(<KpiSummaryRow {...props} />);
    const cards = container.querySelectorAll('.kpi-card');

    // then
    expect(cards[0].querySelector('.kpi-card__value')!.textContent).toBe(formatTokens(12_300_000, 'de').value);
    expect(cards[1].querySelector('.kpi-card__value')!.textContent).toBe(formatCo2(2_500, 'de').value);
    expect(cards[1].querySelector('.kpi-card__unit')!.textContent).toBe(formatCo2(2_500, 'de').unit);
  });

  it('names the scope in the tokens and cost subtitles', () => {
    // given
    const t = dict('de');

    // when
    const { container } = render(<KpiSummaryRow {...props} scope="Modelle" />);
    const subs = [...container.querySelectorAll('.kpi-card__sub')].map((e) => e.textContent);

    // then
    expect(subs[0]).toBe(t.kpiSummaryRow.totalTokensSub('Modelle'));
    expect(subs[2]).toBe(t.kpiSummaryRow.totalCostSub('Modelle'));
  });

  it('marks each card with a FAQ footnote link', () => {
    // given / when / then
    expect(render(<KpiSummaryRow {...props} />).container.querySelectorAll('a.footnote-mark')).toHaveLength(3);
  });
});
