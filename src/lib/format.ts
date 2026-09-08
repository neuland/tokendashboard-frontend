// Display formatting: numbers, tokens, CO₂, cost, dates — locale-parameterized.

import { dict, type Locale } from '~/i18n';

interface Formatters {
  number: Intl.NumberFormat;
  decimal: Intl.NumberFormat;
  usd: Intl.NumberFormat;
  date: Intl.DateTimeFormat;
  dayMonth: Intl.DateTimeFormat;
}

const INTL_LOCALE: Record<Locale, string> = { de: 'de-DE', en: 'en-US' };

const formattersCache = new Map<Locale, Formatters>();

function formattersFor(locale: Locale): Formatters {
  const cached = formattersCache.get(locale);
  if (cached) {
    return cached;
  }

  const intlLocale = INTL_LOCALE[locale];
  const built: Formatters = {
    number: new Intl.NumberFormat(intlLocale),
    decimal: new Intl.NumberFormat(intlLocale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    usd: new Intl.NumberFormat(intlLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    date:
      locale === 'de'
        ? new Intl.DateTimeFormat(intlLocale, { day: '2-digit', month: '2-digit', year: 'numeric' })
        : new Intl.DateTimeFormat(intlLocale, { day: 'numeric', month: 'short', year: 'numeric' }),
    dayMonth:
      locale === 'de'
        ? new Intl.DateTimeFormat(intlLocale, { day: '2-digit', month: '2-digit' })
        : new Intl.DateTimeFormat(intlLocale, { day: 'numeric', month: 'short' }),
  };
  formattersCache.set(locale, built);
  return built;
}

/** Compact number-scale units. */
const SCALE_UNITS: Record<Locale, { threshold: number; unit: string }[]> = {
  de: [
    { threshold: 1_000_000_000_000_000, unit: 'Brd.' },
    { threshold: 1_000_000_000_000, unit: 'Bio.' },
    { threshold: 1_000_000_000, unit: 'Mrd.' },
    { threshold: 1_000_000, unit: 'Mio.' },
    { threshold: 1_000, unit: 'Tsd.' },
  ],
  en: [
    { threshold: 1_000_000_000_000_000, unit: 'Q' },
    { threshold: 1_000_000_000_000, unit: 'T' },
    { threshold: 1_000_000_000, unit: 'B' },
    { threshold: 1_000_000, unit: 'M' },
    { threshold: 1_000, unit: 'K' },
  ],
};

/** Rounded integer with locale thousands separators, e.g. `1.234.567` (de) / `1,234,567` (en). */
export function formatNumber(value: number, locale: Locale): string {
  return formattersFor(locale).number.format(Math.round(value));
}

/**
 * Compact token display. Value and unit are returned separately so the unit can
 * be rendered in a smaller font. e.g. 12_300_000 → `{ value: '12,3', unit: 'Mio.' }`
 */
export function formatTokens(value: number, locale: Locale): { value: string; unit: string } {
  const { decimal } = formattersFor(locale);
  for (const { threshold, unit } of SCALE_UNITS[locale]) {
    if (value >= threshold) {
      return { value: decimal.format(value / threshold), unit };
    }
  }
  return { value: formatNumber(value, locale), unit: '' };
}

/**
 * Token display for table cells: full number below the threshold (`999.999`),
 * compact above it (`1,0 Mio.`). Keeps columns narrow without rounding away
 * precision on small values.
 */
export function formatTokensAdaptive(
  value: number,
  locale: Locale,
): { value: string; unit: string } {
  if (value < 1_000_000) {
    return { value: formatNumber(value, locale), unit: '' };
  }
  return formatTokens(value, locale);
}

/** CO₂ display, input in grams, unit scaled g → kg → t. SI units, unchanged across locales. */
export function formatCo2(grams: number, locale: Locale): { value: string; unit: string } {
  const { decimal } = formattersFor(locale);
  if (grams >= 1_000_000) {
    return { value: decimal.format(grams / 1_000_000), unit: 't CO₂' };
  }
  if (grams >= 1_000) {
    return { value: decimal.format(grams / 1_000), unit: 'kg CO₂' };
  }
  return { value: decimal.format(grams), unit: 'g CO₂' };
}

/**
 * US dollar display, value and unit separate as in `formatTokens`/`formatCo2` so
 * the `$` can be rendered smaller on a KPI card. e.g. 12.34 → `{ value: '12,34', unit: '$' }`
 */
export function formatUsd(dollars: number, locale: Locale): { value: string; unit: string } {
  return { value: formattersFor(locale).usd.format(dollars), unit: '$' };
}

/** ISO date (YYYY-MM-DD) → locale-formatted date, e.g. `DD.MM.YYYY` (de) or `4 Aug 2026` (en). */
export function formatDate(iso: string, locale: Locale): string {
  const [y, m, d] = iso.split('-').map(Number);
  return formattersFor(locale).date.format(new Date(y, (m ?? 1) - 1, d));
}

/** Locale date range, collapsed to a single date if `from === to`. */
export function formatDateRange(from: string, to: string, locale: Locale): string {
  return from === to ? formatDate(from, locale) : `${formatDate(from, locale)} – ${formatDate(to, locale)}`;
}

/** ISO date (YYYY-MM-DD) → compact day/month, for axis labels. */
export function formatDayShort(iso: string, locale: Locale): string {
  const [y, m, d] = iso.split('-').map(Number);
  return formattersFor(locale).dayMonth.format(new Date(y, (m ?? 1) - 1, d));
}

/**
 * ISO 8601 week number and week-numbering year for a date. Both are derived from
 * the Thursday of that week: ISO weeks belong to whichever year contains their
 * Thursday, so around New Year the year returned can differ from the input year.
 */
function isoWeekInfo(iso: string): { week: number; year: number } {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, (m ?? 1) - 1, d));
  const dayNum = (date.getUTCDay() + 6) % 7; // Monday = 0 … Sunday = 6
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // Thursday of this week
  // 4 January is always in ISO week 1, so its Thursday anchors the count.
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  const week = 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * 86400000));
  return { week, year: date.getUTCFullYear() };
}

/** Axis label for a weekly bucket, e.g. `KW4 2026` (de) / `W4 2026` (en). */
export function formatWeekLabel(iso: string, locale: Locale): string {
  const { week, year } = isoWeekInfo(iso);
  return dict(locale).formats.weekLabel(week, year);
}
