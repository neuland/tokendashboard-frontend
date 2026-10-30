import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import TokenTypeList from './TokenTypeList';
import { TOKEN_TYPES, TOKEN_TYPE_LABELS } from '~/lib/types';
import { dict } from '~/i18n';

const t = dict('de');

afterEach(() => {
  cleanup();
});

describe('TokenTypeList', () => {
  it('lists In/Out and the cache types as two pairs, in the usual order', () => {
    // given
    const tokens = { input: 1_000, output: 3_000, cacheWrite: 10_000, cacheRead: 990_000 };

    // when
    const { container } = render(<TokenTypeList tokens={tokens} total={1_004_000} locale="de" />);

    // then
    const groups = Array.from(container.querySelectorAll('.app-tgroup__head > span:first-child')).map((s) => s.textContent);
    expect(groups).toEqual([t.dashboard.tokenGroups.inOut, t.dashboard.tokenGroups.cache]);
    const labels = Array.from(container.querySelectorAll('.app-trow__line > span:first-child')).map((s) => s.textContent);
    expect(labels).toEqual(TOKEN_TYPES.map((tt) => TOKEN_TYPE_LABELS.de[tt]));
  });

  it('measures each bar against its own pair, so cache reads do not flatten In and Out', () => {
    // given
    const tokens = { input: 1_000, output: 3_000, cacheWrite: 10_000, cacheRead: 990_000 };

    // when
    const { container } = render(<TokenTypeList tokens={tokens} total={1_004_000} locale="de" />);

    // then
    const widths = Array.from(container.querySelectorAll('.app-share__fill')).map((el) => (el as HTMLElement).style.width);
    expect(widths).toEqual(['25%', '75%', '1%', '99%']);
  });

  it('marks the total in the head as including cache, with the same badge as everywhere else', () => {
    // given
    const tokens = { input: 1_000, output: 3_000, cacheWrite: 10_000, cacheRead: 990_000 };

    // when
    const { container } = render(<TokenTypeList tokens={tokens} total={1_004_000} locale="de" />);

    // then
    const aside = container.querySelector('.app-card__aside');
    expect(aside?.textContent).toBe(`1,0 Mio.${t.common.inclCache}`);
    expect(aside?.querySelector('.app-pill--cache')?.textContent).toBe(t.common.inclCache);
    expect(container.querySelector('.app-note')).toBeNull();
  });
});
