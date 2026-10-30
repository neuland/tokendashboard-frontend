import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import KpiList from './KpiList';
import { dict } from '~/i18n';

const t = dict('de');

afterEach(() => {
  cleanup();
});

describe('KpiList', () => {
  it('links each key figure to the FAQ entry on how it is calculated', () => {
    // given
    const figures = { tokensInOut: 1_500_000, totalEstimatedCo2: 12, totalCostUsdCent: 345 };

    // when
    const { container } = render(<KpiList {...figures} scope="Alle Provider" locale="de" />);

    // then
    const marks = Array.from(container.querySelectorAll('.app-kpi__label .footnote-mark')).map((a) => a.getAttribute('href'));
    expect(marks).toEqual([
      `/faq/#${t.faqAsterisk.tokens.id}`,
      `/faq/#${t.faqAsterisk.co2.id}`,
      `/faq/#${t.faqAsterisk.cost.id}`,
    ]);
  });
});
