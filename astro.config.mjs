import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import react from '@astrojs/react';

// APP_ENV, not NODE_ENV, picks which .env file loadEnv reads below — using NODE_ENV
// would also flip Vite's own dev/prod behavior (e.g. disabling HMR), which we don't
// want just to pick up a different API_PROXY_TARGET. See `npm run prd`.
const envMode = process.env.APP_ENV ?? process.env.NODE_ENV ?? 'development';
const { API_PROXY_TARGET } = loadEnv(envMode, process.cwd(), '');

// Empty means unset. A `docker build` without `--build-arg` hands the build every
// PUBLIC_* variable as an empty string (see Dockerfile), and Vite lets any process.env
// value — empty included — override the same key in `.env`. Without this, an image built
// from a checkout with a valid `.env` would silently lose the company name.
for (const [key, value] of Object.entries(process.env)) {
  if (key.startsWith('PUBLIC_') && value === '') {
    delete process.env[key];
  }
}

export default defineConfig({
  integrations: [react()],
  devToolbar: { enabled: false },
  base: '/',
  // Bind the dev server to all interfaces, not just localhost inside the container,
  // so it's reachable from the host through the devcontainer's port mapping.
  server: { host: true },
  i18n: {
    defaultLocale: 'de',
    locales: ['de', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  // Proxy /api to the backend in dev, so the app can call it same-origin as it does in
  // production. Point it elsewhere with:
  //   API_PROXY_TARGET=https://xxx.yy npm run dev
  // or, for a real deployment's API without putting its URL in this repo, put
  //   API_PROXY_TARGET=https://xxx.yy
  // in a local, gitignored .env.production and run `npm run prd`.
  vite: {
    server: {
      proxy: {
        '/api': {
          target: process.env.API_PROXY_TARGET ?? API_PROXY_TARGET ?? 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
  },
});
