import { describe, expect, it } from 'vitest';
import { pagePath } from './paths';

describe('pagePath', () => {
  it('builds a page path for either locale', () => {
    // given / when / then — one combination per line
    expect(pagePath('/', 'de')).toBe('/');
    expect(pagePath('/', 'en', 'provider/claude/')).toBe('/en/provider/claude/');
    expect(pagePath('/dash/', 'en', 'faq/')).toBe('/dash/en/faq/');
  });
});
