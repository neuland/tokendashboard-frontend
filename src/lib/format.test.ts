import { describe, expect, it } from 'vitest';
import {
  formatCo2,
  formatDate,
  formatDateRange,
  formatNumber,
  formatDayShort,
  formatTokens,
  formatTokensAdaptive,
  formatUsd,
  formatWeekLabel,
} from './format';

describe('formatNumber', () => {
  it('uses de-DE thousands separators for de', () => {
    // given / when / then
    expect(formatNumber(1_234_567, 'de')).toBe('1.234.567');
  });

  it('uses en-US thousands separators for en', () => {
    // given / when / then
    expect(formatNumber(1_234_567, 'en')).toBe('1,234,567');
  });
});

describe('formatTokens scale boundaries', () => {
  it('stays plain below 1_000', () => {
    // given / when / then — one locale per line
    expect(formatTokens(999, 'de')).toEqual({ value: '999', unit: '' });
    expect(formatTokens(999, 'en')).toEqual({ value: '999', unit: '' });
  });

  it('de: Tsd./Mio./Mrd./Bio./Brd.', () => {
    // given / when / then — one scale boundary per line
    expect(formatTokens(1_000, 'de')).toEqual({ value: '1,0', unit: 'Tsd.' });
    expect(formatTokens(999_999, 'de')).toEqual({ value: '1.000,0', unit: 'Tsd.' });
    expect(formatTokens(1_000_000, 'de')).toEqual({ value: '1,0', unit: 'Mio.' });
    expect(formatTokens(1_000_000_000, 'de')).toEqual({ value: '1,0', unit: 'Mrd.' });
    expect(formatTokens(1_000_000_000_000, 'de')).toEqual({ value: '1,0', unit: 'Bio.' });
    expect(formatTokens(1_000_000_000_000_000, 'de')).toEqual({ value: '1,0', unit: 'Brd.' });
  });

  it('en: K/M/B/T/Q', () => {
    // given / when / then — one scale boundary per line
    expect(formatTokens(1_000, 'en')).toEqual({ value: '1.0', unit: 'K' });
    expect(formatTokens(1_000_000, 'en')).toEqual({ value: '1.0', unit: 'M' });
    expect(formatTokens(1_000_000_000, 'en')).toEqual({ value: '1.0', unit: 'B' });
    expect(formatTokens(1_000_000_000_000, 'en')).toEqual({ value: '1.0', unit: 'T' });
    expect(formatTokens(1_000_000_000_000_000, 'en')).toEqual({ value: '1.0', unit: 'Q' });
  });
});

describe('formatCo2', () => {
  it('scales g -> kg -> t, same SI units in both locales', () => {
    // given / when / then — one scale step per line, last line repeats t in en
    expect(formatCo2(500, 'de')).toEqual({ value: '500,0', unit: 'g CO₂' });
    expect(formatCo2(2_500, 'de')).toEqual({ value: '2,5', unit: 'kg CO₂' });
    expect(formatCo2(2_500_000, 'de')).toEqual({ value: '2,5', unit: 't CO₂' });
    expect(formatCo2(2_500_000, 'en')).toEqual({ value: '2.5', unit: 't CO₂' });
  });
});

describe('formatUsd', () => {
  it('formats with 2 decimals and a locale decimal separator', () => {
    // given / when / then — one locale per line
    expect(formatUsd(12.3, 'de')).toEqual({ value: '12,30', unit: '$' });
    expect(formatUsd(12.3, 'en')).toEqual({ value: '12.30', unit: '$' });
  });
});

describe('formatDate', () => {
  it('de: DD.MM.YYYY', () => {
    // given / when / then
    expect(formatDate('2026-08-04', 'de')).toBe('04.08.2026');
  });

  it('en: unambiguous day-month-year, not numeric en-US (08/04/2026 would be ambiguous)', () => {
    // given / when / then
    expect(formatDate('2026-08-04', 'en')).toBe('Aug 4, 2026');
  });
});

describe('formatDateRange', () => {
  it('collapses to a single date when from === to', () => {
    // given / when / then
    expect(formatDateRange('2026-08-04', '2026-08-04', 'de')).toBe('04.08.2026');
  });

  it('joins two dates with an en dash otherwise', () => {
    // given / when / then
    expect(formatDateRange('2026-08-01', '2026-08-04', 'de')).toBe('01.08.2026 – 04.08.2026');
  });
});

describe('formatWeekLabel', () => {
  it('de: KW<week> <year>', () => {
    // given / when / then
    expect(formatWeekLabel('2026-01-22', 'de')).toBe('KW4 2026');
  });

  it('en: W<week> <year>', () => {
    // given / when / then
    expect(formatWeekLabel('2026-01-22', 'en')).toBe('W4 2026');
  });
});

describe('formatTokensAdaptive', () => {
  it('stays exact below a million, where the digits are still readable', () => {
    // given / when / then — one magnitude per line
    expect(formatTokensAdaptive(999, 'de')).toEqual({ value: '999', unit: '' });
    expect(formatTokensAdaptive(999_999, 'de')).toEqual({ value: '999.999', unit: '' });
  });

  it('abbreviates from a million upwards, matching formatTokens', () => {
    // given / when / then
    expect(formatTokensAdaptive(1_000_000, 'de')).toEqual(formatTokens(1_000_000, 'de'));
    expect(formatTokensAdaptive(2_500_000_000, 'en')).toEqual(formatTokens(2_500_000_000, 'en'));
  });

  it('switches exactly at one million, unlike formatTokens which abbreviates from a thousand', () => {
    // given / when / then — the boundary is what separates the two helpers
    expect(formatTokensAdaptive(999_999, 'de').unit).toBe('');
    expect(formatTokens(999_999, 'de').unit).toBe('Tsd.');
  });
});

describe('formatDayShort', () => {
  it('drops the year, which the surrounding axis already implies', () => {
    // given / when / then
    expect(formatDayShort('2026-08-04', 'de')).not.toContain('2026');
    expect(formatDayShort('2026-08-04', 'en')).not.toContain('2026');
  });

  it('names day and month per locale convention', () => {
    // given / when / then — de puts the day first, en the month
    expect(formatDayShort('2026-08-04', 'de')).toBe('04.08.');
    expect(formatDayShort('2026-08-04', 'en')).toBe('Aug 4');
  });
});
