import { describe, expect, it } from 'vitest';
import {
  PROVIDERS,
  PROVIDER_COLORS,
  PROVIDER_LABELS,
  PROVIDER_SHORT_LABELS,
  TOKEN_TYPES,
  TOKEN_TYPE_COLORS,
  TOKEN_TYPE_LABELS,
  usdCentToUsd,
} from './types';
import { LOCALES } from '~/i18n';

describe('usdCentToUsd', () => {
  it('converts cents to dollars', () => {
    // given / when / then — a round amount, a fractional one, and zero
    expect(usdCentToUsd(12_345)).toBe(123.45);
    expect(usdCentToUsd(1)).toBe(0.01);
    expect(usdCentToUsd(0)).toBe(0);
  });
});

// The label and colour maps are keyed by the union types, so TypeScript rejects a
// missing key at compile time — but `npm run build` does not type-check, so these
// guard the same thing at test time. See CLAUDE.md on the separate gates.
describe('provider maps cover every provider', () => {
  it('lists every provider in PROVIDERS exactly once', () => {
    // given / when / then
    expect(new Set(PROVIDERS).size).toBe(PROVIDERS.length);
  });

  it('has a label and a short label per provider in every locale', () => {
    // given / when / then — one map per line, keys compared against PROVIDERS
    for (const locale of LOCALES) {
      expect(Object.keys(PROVIDER_LABELS[locale]).sort()).toEqual([...PROVIDERS].sort());
      expect(Object.keys(PROVIDER_SHORT_LABELS[locale]).sort()).toEqual([...PROVIDERS].sort());
    }
  });

  it('has a non-empty colour per provider', () => {
    // given / when / then
    expect(Object.keys(PROVIDER_COLORS).sort()).toEqual([...PROVIDERS].sort());
    expect(PROVIDERS.every((p) => /^#[0-9A-F]{6}$/i.test(PROVIDER_COLORS[p]))).toBe(true);
  });
});

describe('token type maps cover every token type', () => {
  it('lists every token type in TOKEN_TYPES exactly once', () => {
    // given / when / then
    expect(new Set(TOKEN_TYPES).size).toBe(TOKEN_TYPES.length);
  });

  it('has a label per token type in every locale', () => {
    // given / when / then
    for (const locale of LOCALES) {
      expect(Object.keys(TOKEN_TYPE_LABELS[locale]).sort()).toEqual([...TOKEN_TYPES].sort());
    }
  });

  it('has a non-empty colour per token type', () => {
    // given / when / then
    expect(Object.keys(TOKEN_TYPE_COLORS).sort()).toEqual([...TOKEN_TYPES].sort());
    expect(TOKEN_TYPES.every((t) => /^#[0-9A-F]{6}$/i.test(TOKEN_TYPE_COLORS[t]))).toBe(true);
  });
});
