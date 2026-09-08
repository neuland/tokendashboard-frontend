import { test, expect } from '@playwright/test';
import { stubUsageApi } from './support/stubUsageApi';

// `vitest.setup.ts` stubs `ResizeObserver`, which recharts' `ResponsiveContainer` needs
// to size itself — without it, every chart throws in jsdom rather than failing an
// assertion, so the component tests never render an actual sized chart (see the
// "Component tests" section in CLAUDE.md). This is the only place bars get real pixel
// dimensions from a real layout engine.
test('renders real bars once usage data resolves', async ({ page }) => {
  await stubUsageApi(page, { claudeTokens: 1000, copilotTokens: 500 });

  // given / when — recharts' `Rectangle` renders no path at all for a zero-size bar
  // (see `node_modules/recharts/es6/shape/Rectangle.js`), so a present `<path>` already
  // proves a nonzero width and height; the bounding box below is belt-and-suspenders.
  await page.goto('/');
  const bars = page.locator('.chart-wrap path.recharts-rectangle');

  // then
  await expect(bars.first()).toBeVisible();
  expect(await bars.count()).toBeGreaterThan(0);
  const box = await bars.first().boundingBox();
  expect(box?.width).toBeGreaterThan(0);
  expect(box?.height).toBeGreaterThan(0);
});
