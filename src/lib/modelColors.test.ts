import { describe, expect, it } from 'vitest';
import { MODEL_COLORS, modelFamilyColors, rankFamiliesByInOut, versionColor } from './modelColors';
import type { ModelFamilyUsage } from './types';

function family(modelFamily: string, input: number, output: number, cacheRead = 0): ModelFamilyUsage {
  const tokens = { input, output, cacheWrite: 0, cacheRead };
  return { modelFamily, models: [], tokens, tokensTotal: input + output + cacheRead, estimatedCo2: 0, costUsdCent: 0 };
}

describe('modelFamilyColors', () => {
  it('colours families by rank, the way the chart does', () => {
    // given / when
    const colors = modelFamilyColors(['opus', 'sonnet', 'fable']);

    // then
    expect(colors).toEqual({ opus: MODEL_COLORS[0], sonnet: MODEL_COLORS[1], fable: MODEL_COLORS[2] });
  });

  it('cycles the palette once there are more families than colours', () => {
    // given
    const families = Array.from({ length: MODEL_COLORS.length + 1 }, (_, i) => `f${i}`);

    // when
    const colors = modelFamilyColors(families);

    // then
    expect(colors[`f${MODEL_COLORS.length}`]).toBe(MODEL_COLORS[0]);
  });
});

describe('rankFamiliesByInOut', () => {
  it('ranks by input plus output, ignoring cache tokens, largest first', () => {
    // given — haiku has the most cache reads but the fewest in/out tokens
    const families = [family('haiku', 1, 1, 1_000_000), family('opus', 50, 50), family('sonnet', 10, 10)];

    // when
    const ranked = rankFamiliesByInOut(families);

    // then
    expect(ranked).toEqual(['opus', 'sonnet', 'haiku']);
  });
});

describe('versionColor', () => {
  it('lightens the family colour rather than picking a new one', () => {
    // given / when / then
    expect(versionColor('#0EA19C')).toBe('color-mix(in srgb, #0EA19C 45%, white)');
  });
});
