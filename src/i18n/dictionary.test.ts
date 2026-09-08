import { describe, expect, it } from 'vitest';
import { de } from './de';
import { en } from './en';

// TypeScript's `en: typeof de` already rejects a shape mismatch at compile time, but
// `npm run build` does not type-check (see CLAUDE.md) — this test is what actually
// runs under `npm test` and catches a broken PR.
function keyPaths(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) {
    return [prefix];
  }
  return Object.entries(obj).flatMap(([key, value]) => keyPaths(value, prefix ? `${prefix}.${key}` : key));
}

describe('i18n dictionary parity', () => {
  it('de and en expose the identical set of keys', () => {
    // given / when / then — the two dictionaries are symmetric, so neither side is setup
    expect(keyPaths(en).sort()).toEqual(keyPaths(de).sort());
  });
});

// PUBLIC_COMPANY_NAME is optional, so every template taking the company name is
// rendered once without it. A stray separator or preposition ("· Token", "at .") is
// what a fork sees on its first build, before it has configured anything.
describe.each([
  ['de', de],
  ['en', en],
] as const)('%s company-name templates', (_locale, t) => {
  const templates = {
    'layout.title': (company: string) => t.layout.title(company),
    'layout.description': (company: string) => t.layout.description(company),
    'header.defaultLede': (company: string) => t.header.defaultLede(company),
    'faqPage.title': (company: string) => t.faqPage.title(company),
    'providerPage.title': (company: string) => t.providerPage.title('Claude', company),
  };

  it.each(Object.entries(templates))('%s reads cleanly without a company name', (_name, template) => {
    // given
    const noCompany = '';

    // when
    const text = template(noCompany);

    // then — no leading separator, no double spaces, no space before the period or at the
    // end, no preposition left hanging ("… bei." / "… at.")
    expect(text).not.toMatch(/^\s*·/);
    expect(text).not.toMatch(/ {2}/);
    expect(text).not.toMatch(/\s\.|\s$/);
    expect(text).not.toMatch(/\b(bei|at)\s*\.?$/);
  });

  it.each(Object.entries(templates))('%s includes the company name when one is set', (_name, template) => {
    // given
    const company = 'Some Org GmbH';

    // when
    const text = template(company);

    // then
    expect(text).toContain(company);
    expect(text).not.toMatch(/ {2}/);
  });
});
