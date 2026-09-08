import { describe, expect, it } from 'vitest';
import type { ReactElement } from 'react';
import { renderProviderUsageBars } from './ProviderUsageBars';
import { TOKEN_TYPES, TOKEN_TYPE_COLORS, TOKEN_TYPE_LABELS } from '~/lib/types';
import { dict } from '~/i18n';

function props(result: ReactElement | ReactElement[]) {
  const list = Array.isArray(result) ? result : [result];
  return list.map((b) => b.props as Record<string, unknown>);
}

describe('renderProviderUsageBars', () => {
  it('stacks only in and out for the tokenType view', () => {
    // when
    const bars = props(renderProviderUsageBars('tokenType', [], 'de'));

    // then
    expect(bars.map((b) => b.dataKey)).toEqual(['input', 'output']);
    expect(bars[0].name).toBe(TOKEN_TYPE_LABELS.de.input);
    expect(bars[0].fill).toBe(TOKEN_TYPE_COLORS.input);
  });

  it('stacks every token type for the tokenTypeAll view', () => {
    // given / when / then
    expect(props(renderProviderUsageBars('tokenTypeAll', [], 'de')).map((b) => b.dataKey)).toEqual(TOKEN_TYPES);
  });

  it('emits one segment per model family, named after the family', () => {
    // given
    const families = ['opus', 'sonnet', 'haiku'];

    // when
    const bars = props(renderProviderUsageBars('model', families, 'de'));

    // then
    expect(bars.map((b) => b.dataKey)).toEqual(families);
    expect(bars.map((b) => b.name)).toEqual(families);
  });

  it('cycles the model palette once it runs out of colours', () => {
    // given — nine families against a palette of eight
    const families = Array.from({ length: 9 }, (_, i) => `family-${i}`);

    // when
    const bars = props(renderProviderUsageBars('model', families, 'de'));

    // then
    expect(bars[8].fill).toBe(bars[0].fill);
    expect(new Set(bars.slice(0, 8).map((b) => b.fill)).size).toBe(8);
  });

  it('emits a single unstacked segment for the scalar views', () => {
    // given
    const t = dict('de');

    // given / when / then — one scalar view per line
    expect(props(renderProviderUsageBars('co2', [], 'de'))).toEqual([expect.objectContaining({ dataKey: 'co2', name: t.usageBars.co2 })]);
    expect(props(renderProviderUsageBars('cost', [], 'de'))).toEqual([expect.objectContaining({ dataKey: 'cost', name: t.usageBars.cost })]);
    expect(props(renderProviderUsageBars('installations', [], 'de'))).toEqual([expect.objectContaining({ dataKey: 'installations', name: t.usageBars.installations })]);
    expect(props(renderProviderUsageBars('tokensPerInstallation', [], 'de'))).toEqual([expect.objectContaining({ dataKey: 'tokensPerInstallation', name: t.usageBars.tokensPerInstallation })]);
  });

  it('leaves the scalar views unstacked, unlike the token-type views', () => {
    // given / when / then
    expect(props(renderProviderUsageBars('co2', [], 'de'))[0].stackId).toBeUndefined();
    expect(props(renderProviderUsageBars('tokenType', [], 'de'))[0].stackId).toBe('usage');
  });
});
