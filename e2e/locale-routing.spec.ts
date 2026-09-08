import { test, expect } from '@playwright/test';

// Astro's i18n routing (`prefixDefaultLocale: false`) is only real once a page is
// actually routed by the framework: the page-render tests use `experimental_AstroContainer`,
// which never applies routing, so `Astro.currentLocale` always falls back to the default
// locale under test (see the "Page tests" section in CLAUDE.md). This is the only place
// that exercises the real German (unprefixed) <-> English (`/en/`) switch.
test('switches locale via the header switcher and keeps the current page', async ({ page }) => {
  // given — the German FAQ page, the default locale's unprefixed route
  await page.goto('/faq/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Übersicht', exact: true })).toBeVisible();

  // when — switching to English via the locale switcher
  await page.locator('.locale-switcher').getByRole('link', { name: 'EN', exact: true }).click();

  // then — same route, now under /en/ and rendered in English
  await expect(page).toHaveURL(/\/en\/faq\/?$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Overview', exact: true })).toBeVisible();

  // when — switching back from within /en/
  await page.locator('.locale-switcher').getByRole('link', { name: 'DE', exact: true }).click();

  // then — back on the unprefixed German route
  await expect(page).toHaveURL(/\/faq\/?$/);
  await expect(page).not.toHaveURL(/\/en\//);
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
});
