import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import ProviderComparison from './ProviderComparison';
import type { ProviderOverview, UsageOverview } from '~/lib/types';
import { PROVIDERS, PROVIDER_LABELS } from '~/lib/types';
import type { RangeSelection } from '~/lib/range';
import { formatCo2, formatNumber, formatUsd } from '~/lib/format';
import { dict } from '~/i18n';

const t = dict('de');
const selection: RangeSelection = { kind: 'preset', id: 'last7' };

function entry(provider: ProviderOverview['provider'], tokensInOut: number): ProviderOverview {
  return { provider, tokensInOut, totalEstimatedCo2: 1_000, totalCostUsdCent: 2_500 };
}

function overview(providerUsages: UsageOverview['providerUsages']): UsageOverview {
  const list = Object.values(providerUsages);
  return {
    from: '2026-07-01',
    to: '2026-07-07',
    providerUsages,
    tokensInOut: list.reduce((sum, u) => sum + u.tokensInOut, 0),
    totalEstimatedCo2: list.reduce((sum, u) => sum + u.totalEstimatedCo2, 0),
    totalCostUsdCent: list.reduce((sum, u) => sum + u.totalCostUsdCent, 0),
  };
}

function bodyRows(container: HTMLElement) {
  return [...container.querySelectorAll('tbody tr')];
}

describe('ProviderComparison', () => {
  it('lists only the providers the overview carries, plus a totals row', () => {
    // given
    const data = overview({ claude: entry('claude', 100), opencode: entry('opencode', 300) });

    // when
    const { container } = render(<ProviderComparison overview={data} selection={selection} locale="de" />);

    // then
    const rows = bodyRows(container);
    expect(rows).toHaveLength(3);
    expect(rows[0].querySelector('a')!.textContent).toBe(PROVIDER_LABELS.de.claude);
    expect(rows[1].querySelector('a')!.textContent).toBe(PROVIDER_LABELS.de.opencode);
    expect(rows[2].querySelector('td')!.textContent).toBe(t.common.total);
  });

  it('keeps the canonical PROVIDERS order rather than the object key order', () => {
    // given — inserted deliberately out of order
    const data = overview({ opencode: entry('opencode', 1), claude: entry('claude', 2) });

    // when
    const { container } = render(<ProviderComparison overview={data} selection={selection} locale="de" />);

    // then
    const labels = bodyRows(container).slice(0, 2).map((r) => r.querySelector('a')!.textContent);
    expect(labels).toEqual([PROVIDER_LABELS.de.claude, PROVIDER_LABELS.de.opencode]);
    expect(PROVIDERS.indexOf('claude')).toBeLessThan(PROVIDERS.indexOf('opencode'));
  });

  it('formats tokens exactly, and CO₂ and cost through the shared formatters', () => {
    // given
    const data = overview({ claude: entry('claude', 1_234_567) });

    // when
    const cells = [...render(<ProviderComparison overview={data} selection={selection} locale="de" />)
      .container.querySelectorAll('tbody tr')[0].querySelectorAll('td.num')];

    // then
    const co2 = formatCo2(1_000, 'de');
    const cost = formatUsd(25, 'de');
    expect(cells[0].textContent).toBe(formatNumber(1_234_567, 'de'));
    expect(cells[1].textContent).toBe(`${co2.value} ${co2.unit}`);
    expect(cells[2].textContent).toBe(`${cost.value} ${cost.unit}`);
  });

  it('sums the totals row over the listed providers', () => {
    // given
    const data = overview({ claude: entry('claude', 100), copilot: entry('copilot', 400) });

    // when
    const { container } = render(<ProviderComparison overview={data} selection={selection} locale="de" />);

    // then
    const totals = bodyRows(container)[2].querySelectorAll('td.num');
    expect(totals[0].textContent).toBe(formatNumber(500, 'de'));
  });

  it('carries the selected period into both provider links', () => {
    // given
    const data = overview({ claude: entry('claude', 100) });

    // when
    const { container } = render(<ProviderComparison overview={data} selection={selection} locale="de" />);

    // then
    const hrefs = [...bodyRows(container)[0].querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/provider/claude?preset=last7', '/provider/claude?preset=last7']);
  });

  it('carries an explicit custom range into the links instead of a preset', () => {
    // given
    const custom: RangeSelection = { kind: 'custom', range: { from: '2026-07-01', to: '2026-07-10' } };
    const data = overview({ claude: entry('claude', 100) });

    // when
    const { container } = render(<ProviderComparison overview={data} selection={custom} locale="de" />);

    // then
    expect(bodyRows(container)[0].querySelector('a')!.getAttribute('href')).toBe(
      '/provider/claude?from=2026-07-01&to=2026-07-10',
    );
  });

  it('prefixes the locale segment in the links for en', () => {
    // given
    const data = overview({ claude: entry('claude', 100) });

    // when
    const { container } = render(<ProviderComparison overview={data} selection={selection} locale="en" />);

    // then
    expect(bodyRows(container)[0].querySelector('a')!.getAttribute('href')).toBe(
      '/en/provider/claude?preset=last7',
    );
  });

  it('renders just the totals row when no provider reported', () => {
    // given / when / then
    expect(
      bodyRows(render(<ProviderComparison overview={overview({})} selection={selection} locale="de" />).container),
    ).toHaveLength(1);
  });

  it('marks the token, CO₂ and cost columns with FAQ footnotes', () => {
    // given / when / then
    expect(
      render(<ProviderComparison overview={overview({})} selection={selection} locale="de" />)
        .container.querySelectorAll('thead a.footnote-mark'),
    ).toHaveLength(3);
  });
});
