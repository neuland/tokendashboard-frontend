// Absolute page paths for links built in React islands, which have no `astro:i18n`.
// Astro pages and layouts use `getRelativeLocaleUrl` instead.

import { DEFAULT_LOCALE, type Locale } from '~/i18n';

/** The routing prefix of a locale: '' for the default locale, `en/` otherwise. */
export function localePrefix(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? '' : `${locale}/`;
}

/** Absolute path of a page, built from the base, the locale and the page's own path. */
export function pagePath(base: string, locale: Locale, rest = ''): string {
  return `${base}${localePrefix(locale)}${rest}`;
}
