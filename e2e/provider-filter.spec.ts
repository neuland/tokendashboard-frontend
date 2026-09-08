import { test, expect } from '@playwright/test';
import { stubUsageApi } from './support/stubUsageApi';

// Regression test for two related bugs on the home page provider filter:
// 1. Narrowing the selection down to a provider with no usage in the current range used to
//    unmount the filter entirely (it lived behind the same `hasUsage` guard as the chart),
//    leaving no way to select a different provider back in.
// 2. Every provider toggle re-fetches (the aggregate endpoint ignores the selection and is
//    re-parsed client-side), which briefly renders the whole component as a loading indicator
//    — including, before the fix, unmounting the filter again on every click.
test('re-selecting a provider stays possible when the current selection has no usage', async ({ page }) => {
  await stubUsageApi(page, { claudeTokens: 1000, delayMs: 500 });

  // given — only copilot selected, which has no usage in the stubbed range
  await page.goto('/?preset=last30&providers=copilot');
  await expect(page.getByText('Für den gewählten Zeitraum liegen noch keine Daten vor.')).toBeVisible();
  const providerFilter = page.getByRole('group', { name: 'Provider auswählen' });
  await expect(providerFilter).toBeVisible();

  // when — re-selecting claude while the refetch it triggers is still in flight
  await providerFilter.getByRole('button', { name: 'Claude' }).click();

  // then — the filter survives the loading state instead of disappearing with it
  await expect(page.getByText('Daten werden geladen')).toBeVisible();
  await expect(providerFilter).toBeVisible();
  await expect(page.getByText('Daten werden geladen')).toBeHidden();
  await expect(page.locator('.chart-card').first()).toBeVisible();
  await expect(providerFilter.getByRole('button', { name: 'Claude' })).toHaveAttribute('aria-pressed', 'true');
});
