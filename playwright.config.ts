import { defineConfig } from '@playwright/test';

// Separate from vitest.config.ts on purpose: vitest already claims `src/**/*.test.{ts,tsx}`,
// so specs here live under `e2e/` and use the `.spec.ts` suffix — keeping both out of each
// other's way without either config having to know about the other.
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:4321',
    launchOptions: {
      args: ['--no-sandbox'],
    },
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
  },
});
