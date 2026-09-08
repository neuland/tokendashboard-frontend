/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

// Build on Astro's own Vite config (aliases, env, …) so tests resolve modules exactly
// as `astro dev` and `astro build` do.
export default getViteConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
