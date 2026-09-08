import { test, expect } from '@playwright/test';
import { stubUsageApi } from './support/stubUsageApi';

// `persistSelection`/`persistProviderSelection` write via `history.replaceState` plus
// `localStorage` (see `src/lib/range.ts` and `src/lib/providerSelection.ts`) — a real
// round trip only a real reload can prove. Component tests clear `localStorage` in
// `beforeEach` and call `loadSelection`/`loadProviderSelection` directly, so the write
// side and the read side are never actually exercised against each other there.
test('provider and date-range selection survive navigating back with no query params', async ({ page }) => {
  await stubUsageApi(page);

  // given — the default selection: every active provider, last 30 days
  await page.goto('/');
  const providerFilter = page.getByRole('group', { name: 'Provider auswählen' });
  await expect(providerFilter).toBeVisible();

  // when — deselecting copilot and switching to the "last 7 days" preset
  await providerFilter.getByRole('button', { name: 'Copilot' }).click();
  await page.locator('.rp__trigger').click();
  await page.getByRole('dialog').getByRole('button', { name: 'Letzte 7 Tage', exact: true }).click();

  // then — both choices land in the URL...
  await expect.poll(() => new URL(page.url()).searchParams.get('providers')).toBe('claude,opencode');
  await expect.poll(() => new URL(page.url()).searchParams.get('preset')).toBe('last7');

  // ...and in localStorage, not just the URL
  const [storedProviders, storedRange] = await page.evaluate(() => [
    window.localStorage.getItem('tokendashboard.providers'),
    window.localStorage.getItem('tokendashboard.range'),
  ]);
  expect(storedProviders).toBe('claude,opencode');
  expect(JSON.parse(storedRange ?? '{}')).toEqual({ preset: 'last7' });

  // when — returning to a clean URL, as a bookmark or a repeated visit would
  await page.goto('/');

  // then — the previous selection is restored from localStorage alone
  await expect.poll(() => new URL(page.url()).searchParams.get('providers')).toBe('claude,opencode');
  await expect.poll(() => new URL(page.url()).searchParams.get('preset')).toBe('last7');
  await expect(providerFilter.getByRole('button', { name: 'Copilot' })).toHaveAttribute('aria-pressed', 'false');
  await expect(providerFilter.getByRole('button', { name: 'Claude' })).toHaveAttribute('aria-pressed', 'true');
});
