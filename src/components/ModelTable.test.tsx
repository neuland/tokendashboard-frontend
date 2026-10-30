import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import ModelTable from './ModelTable';
import type { ProviderUsage, TokenCounts } from '~/lib/types';
import { TOKEN_TYPE_LABELS } from '~/lib/types';
import { dict } from '~/i18n';

const t = dict('de');

afterEach(cleanup);

function tokens(input: number, output = 0, cacheWrite = 0, cacheRead = 0): TokenCounts {
  return { input, output, cacheWrite, cacheRead };
}

function usage(): ProviderUsage {
  return {
    provider: 'claude',
    modelFamilies: [
      {
        modelFamily: 'opus',
        models: [
          { model: 'claude-opus-5-5', tokens: tokens(600, 0, 0, 4_000), tokensTotal: 4_600, estimatedCo2: 6, costUsdCent: 60 },
          { model: 'claude-opus-5', tokens: tokens(150, 0, 0, 1_000), tokensTotal: 1_150, estimatedCo2: 1, costUsdCent: 15 },
        ],
        tokens: tokens(750, 0, 0, 5_000),
        tokensTotal: 5_750,
        estimatedCo2: 7,
        costUsdCent: 75,
      },
      {
        modelFamily: 'haiku',
        models: [{ model: 'claude-haiku-4-5', tokens: tokens(250), tokensTotal: 250, estimatedCo2: 1, costUsdCent: 5 }],
        tokens: tokens(250),
        tokensTotal: 250,
        estimatedCo2: 1,
        costUsdCent: 5,
      },
    ],
    overallTokens: tokens(1000, 0, 0, 5_000),
    overallTokensTotal: 6_000,
    tokensInOut: 1000,
    totalEstimatedCo2: 8,
    totalCostUsdCent: 80,
    activeUsers: 3,
  };
}

function headers(container: HTMLElement): string[] {
  return [...container.querySelectorAll('thead th')].map((th) => th.textContent?.replace('*', '').trim() ?? '');
}

describe('ModelTable columns', () => {
  it('starts with every token type and drops them in the compact view', () => {
    // given
    const { container, getByRole } = render(<ModelTable usage={usage()} locale="de" />);
    expect(headers(container)).toContain(TOKEN_TYPE_LABELS.de.cacheRead);

    // when
    fireEvent.click(getByRole('button', { name: t.dashboard.columnsCompact }));

    // then
    expect(headers(container)).not.toContain(TOKEN_TYPE_LABELS.de.cacheRead);
    expect(headers(container)).toEqual([t.providerDetail.modelColumn, t.dashboard.share, t.kpiSummaryRow.totalTokens, t.usageBars.co2, t.common.costColumn]);
  });

  it('lists all token types, then both sums side by side, the one including cache badged', () => {
    // given / when
    const { container } = render(<ModelTable usage={usage()} locale="de" />);

    // then
    const l = TOKEN_TYPE_LABELS.de;
    expect(headers(container)).toEqual([
      t.providerDetail.modelColumn, t.dashboard.share,
      l.input, l.output, l.cacheWrite, l.cacheRead, t.kpiSummaryRow.totalTokens, t.common.inclCache,
      t.usageBars.co2, t.common.costColumn,
    ]);
    expect(container.querySelectorAll('thead .app-pill--cache')).toHaveLength(1);
  });

  it('links the Gesamt-Tokens head to the FAQ entry on why cache is left out', () => {
    // given
    const { container } = render(<ModelTable usage={usage()} locale="de" />);

    // when
    const marks = [...container.querySelectorAll('thead th .footnote-mark')].map((a) => a.getAttribute('href'));

    // then
    expect(marks.filter((href) => href?.endsWith(`#${t.faqAsterisk.tokens.id}`))).toHaveLength(1);
  });

  it('can start compact when asked', () => {
    // given / when
    const { container } = render(<ModelTable usage={usage()} locale="de" initialColumns="compact" />);

    // then
    expect(headers(container)).toHaveLength(5);
  });
});

describe('ModelTable share', () => {
  it('sizes the share bar by the family share of In + Out, like the key figures and the chart', () => {
    // given / when
    const { container } = render(<ModelTable usage={usage()} locale="de" />);
    const fills = [...container.querySelectorAll('tbody .app-share__fill')].map((el) => (el as HTMLElement).style.width);

    // then — opus 750 of 1000, haiku 250 of 1000; with its cache reads opus would be 96 %
    expect(fills).toEqual(['75%', '25%']);
  });
});

describe('ModelTable version bars', () => {
  it('gives each model version a bar on the same base as its family, so the parts add up to the whole', () => {
    // given
    const { container, getByRole } = render(<ModelTable usage={usage()} locale="de" />);

    // when
    fireEvent.click(getByRole('button', { name: `opus: ${t.dashboard.expandFamily}` }));
    const fills = [...container.querySelectorAll('tr.app-sub .app-share__fill')].map((el) => (el as HTMLElement).style.width);

    // then — 600 and 150 of 1000, inside opus' 75 %
    expect(fills).toEqual(['60%', '15%']);
  });
});

describe('ModelTable colours', () => {
  function familyBarColors(container: HTMLElement): string[] {
    return [...container.querySelectorAll('tbody tr:not(.app-sub) .app-share__fill')].map((el) => (el as HTMLElement).style.background);
  }

  it('colours each family bar like that family in the history chart', () => {
    // given — the chart ranks haiku before opus
    const order = ['haiku', 'opus'];

    // when
    const { container } = render(<ModelTable usage={usage()} locale="de" familyOrder={order} />);

    // then — rows stay in table order (opus, haiku), colours follow the chart's ranking
    expect(familyBarColors(container)).toEqual(['rgb(14, 161, 156)', 'rgb(255, 90, 85)']);
  });

  it('ranks by in/out tokens itself when no chart order is given', () => {
    // given / when — opus has more in/out tokens, so it gets the first colour
    const { container } = render(<ModelTable usage={usage()} locale="de" />);

    // then
    expect(familyBarColors(container)).toEqual(['rgb(255, 90, 85)', 'rgb(14, 161, 156)']);
  });
});

describe('ModelTable layout', () => {
  it('fixes the column widths in a colgroup, one entry per header, so expanding cannot move them', () => {
    // given / when
    const { container } = render(<ModelTable usage={usage()} locale="de" />);
    const cols = container.querySelectorAll('colgroup col');
    const headers = container.querySelectorAll('thead th');

    // then
    expect(cols).toHaveLength(headers.length);
    expect(container.querySelector('table')?.className).toContain('app-table--fixed');
  });

  it('keeps the colgroup in step with the compact view', () => {
    // given
    const { container, getByRole } = render(<ModelTable usage={usage()} locale="de" />);

    // when
    fireEvent.click(getByRole('button', { name: t.dashboard.columnsCompact }));

    // then
    expect(container.querySelectorAll('colgroup col')).toHaveLength(container.querySelectorAll('thead th').length);
  });
});

describe('ModelTable families', () => {
  it('expands a family with several versions into one row per version, and collapses it again', () => {
    // given
    const { container, getByRole } = render(<ModelTable usage={usage()} locale="de" />);
    const toggle = getByRole('button', { name: `opus: ${t.dashboard.expandFamily}` });
    expect(container.textContent).not.toContain('claude-opus-5-5');

    // when
    fireEvent.click(toggle);

    // then
    expect(container.querySelectorAll('tr.app-sub')).toHaveLength(2);
    expect(container.textContent).toContain('claude-opus-5-5');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    // when — collapsed again
    fireEvent.click(toggle);

    // then
    expect(container.querySelectorAll('tr.app-sub')).toHaveLength(0);
  });

  it('offers no toggle for a family with a single version', () => {
    // given / when
    const { queryByRole } = render(<ModelTable usage={usage()} locale="de" />);

    // then
    expect(queryByRole('button', { name: `haiku: ${t.dashboard.expandFamily}` })).toBeNull();
  });

  it('closes with a sum row for every column', () => {
    // given / when
    const { container } = render(<ModelTable usage={usage()} locale="de" />);
    const cells = [...(container.querySelector('tr.app-total')?.querySelectorAll('td') ?? [])].map((td) => td.textContent);

    // then — input, output, cache write, cache read, In + Out, including cache
    expect(cells.slice(0, 8)).toEqual([t.common.sum, '', '1.000', '0', '0', '5.000', '1.000', '6.000']);
  });
});
