import { describe, expect, it } from 'vitest';
import type { ReactElement } from 'react';
import { renderHomeUsageBars } from './HomeUsageBars';
import { PROVIDER_COLORS, PROVIDER_LABELS, type Provider } from '~/lib/types';

// The factory returns recharts <Bar> elements rather than DOM, so the props are
// inspected directly — recharts needs a sized container it never gets in jsdom.
function props(bars: ReactElement[]) {
  return bars.map((b) => b.props as Record<string, unknown>);
}

describe('renderHomeUsageBars', () => {
  it('emits one stacked segment per provider, keyed by the provider row key', () => {
    // given
    const providers: Provider[] = ['claude', 'opencode'];

    // when
    const bars = props(renderHomeUsageBars(providers, 'de'));

    // then
    expect(bars.map((b) => b.dataKey)).toEqual(['claude', 'opencode']);
    expect(bars.every((b) => b.stackId === 'usage')).toBe(true);
  });

  it('names each segment with the localised provider label and its brand colour', () => {
    // when
    const bars = props(renderHomeUsageBars(['copilot'], 'en'));

    // then
    expect(bars[0].name).toBe(PROVIDER_LABELS.en.copilot);
    expect(bars[0].fill).toBe(PROVIDER_COLORS.copilot);
  });

  it('disables animation so the bars are stable for snapshots and screenshots', () => {
    // given / when / then
    expect(props(renderHomeUsageBars(['claude'], 'de'))[0].isAnimationActive).toBe(false);
  });

  it('emits nothing when no provider is selected', () => {
    // given / when / then
    expect(renderHomeUsageBars([], 'de')).toHaveLength(0);
  });
});
