// `FaqAsterisk` links every footnote to `<faq page>#<id>`, where the id comes from the
// dictionary. Nothing else connects those ids to the headings on the FAQ pages, so
// renaming a heading breaks every footnote pointing at it — silently, since an unknown
// fragment is not an error. The FAQ pages are read as source text rather than rendered:
// the ids are literals in the markup, and this keeps the test out of the container.
// `?raw` hands the file over as a string through the same Vite pipeline as any import.
import { describe, expect, it } from 'vitest';
import deFaqSource from '~/pages/faq.astro?raw';
import enFaqSource from '~/pages/en/faq.astro?raw';
import { de } from '~/i18n/de';
import { en } from '~/i18n/en';
import { LOCALES, dict, type Locale } from '~/i18n';

type Mark = { id: string; q: string; aria: string };

function marks(locale: Locale): Mark[] {
  const { explanation, ...rest } = dict(locale).faqAsterisk;
  void explanation;
  return Object.values(rest);
}

const faqSource: Record<Locale, string> = { de: deFaqSource, en: enFaqSource };

describe.each(LOCALES)('%s FAQ page', (locale) => {
  it('carries a heading id for every footnote mark', () => {
    // given
    const ids = marks(locale).map((m) => m.id);

    // when
    const missing = ids.filter((id) => !faqSource[locale].includes(`id="${id}"`));

    // then
    expect(missing).toEqual([]);
  });

  it('names each id only once, so the anchor is unambiguous', () => {
    // given / when / then
    for (const { id } of marks(locale)) {
      expect(faqSource[locale].split(`id="${id}"`)).toHaveLength(2);
    }
  });
});

describe('footnote marks', () => {
  it('use the same ids in both languages, so a shared link works either way', () => {
    // given / when
    const deIds = marks('de').map((m) => m.id).sort();
    const enIds = marks('en').map((m) => m.id).sort();

    // then
    expect(deIds).toEqual(enIds);
  });

  it('describe every mark with a question and a screen-reader label', () => {
    // given / when / then
    for (const locale of LOCALES) {
      expect(marks(locale).every((m) => m.id && m.q && m.aria)).toBe(true);
    }
  });

  it('cover the same set of kinds in both dictionaries', () => {
    // given / when / then
    expect(Object.keys(de.faqAsterisk).sort()).toEqual(Object.keys(en.faqAsterisk).sort());
  });
});
