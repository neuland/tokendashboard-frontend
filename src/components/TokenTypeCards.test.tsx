import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import TokenTypeCards from './TokenTypeCards';
import { TOKEN_TYPES, TOKEN_TYPE_LABELS, type TokenCounts } from '~/lib/types';
import { formatNumber, formatTokens } from '~/lib/format';
import { dict } from '~/i18n';

const tokens: TokenCounts = { input: 1_500_000, output: 2_000, cacheWrite: 0, cacheRead: 999 };

describe('TokenTypeCards', () => {
  it('renders one card per token type, labelled and in TOKEN_TYPES order', () => {
    // when
    const { container } = render(<TokenTypeCards tokens={tokens} locale="de" />);

    // then
    const labels = [...container.querySelectorAll('.kpi-card__label')].map((e) => e.textContent);
    expect(labels).toEqual(TOKEN_TYPES.map((tt) => TOKEN_TYPE_LABELS.de[tt]));
  });

  it('shows each count abbreviated, with the exact number as the tooltip', () => {
    // when
    const { container } = render(<TokenTypeCards tokens={tokens} locale="de" />);

    // then
    const inputCard = container.querySelectorAll('.kpi-card')[0];
    expect(inputCard.querySelector('.kpi-card__value')!.textContent).toBe(formatTokens(1_500_000, 'de').value);
    expect(inputCard.getAttribute('title')).toBe(formatNumber(1_500_000, 'de'));
  });

  it('appends the tokens word to the scale unit, and uses it alone when there is no scale', () => {
    // given
    const t = dict('de');

    // when
    const { container } = render(<TokenTypeCards tokens={tokens} locale="de" />);
    const units = [...container.querySelectorAll('.kpi-card__unit')].map((e) => e.textContent);

    // then — input is in the millions, cacheRead (999) has no scale unit
    expect(units[0]).toBe(`${formatTokens(1_500_000, 'de').unit} ${t.common.tokensLabel}`);
    expect(units[3]).toBe(t.common.tokensLabel);
  });

  it('localises the labels for en', () => {
    // given / when / then
    expect(
      [...render(<TokenTypeCards tokens={tokens} locale="en" />).container.querySelectorAll('.kpi-card__label')].map((e) => e.textContent),
    ).toEqual(TOKEN_TYPES.map((tt) => TOKEN_TYPE_LABELS.en[tt]));
  });
});
