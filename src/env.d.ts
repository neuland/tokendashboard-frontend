/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  /**
   * Base URL of the usage API. Empty means same origin, which is how production is
   * deployed. Only needed to point the frontend at an API on another host, which
   * requires CORS on the backend; `npm run dev` proxies /api instead (see astro.config.mjs).
   */
  readonly PUBLIC_API_BASE?: string;

  /**
   * Company/organization name shown in titles and lede text. Set in `.env`
   */
  readonly PUBLIC_COMPANY_NAME?: string;

  /**
   * Where each usage-reporting plugin lives, two URLs per provider: `_REPO` is the
   * repository (browsed, and cloned with `.git` appended), `_RAW` the raw-file base the
   * installed plugin auto-updates from. Both default to the upstream repositories; a
   * fork hosting its own plugins sets them verbatim. See `src/lib/plugins.ts`.
   */
  readonly PUBLIC_PLUGIN_CLAUDE_REPO?: string;
  readonly PUBLIC_PLUGIN_CLAUDE_RAW?: string;
  readonly PUBLIC_PLUGIN_COPILOT_REPO?: string;
  readonly PUBLIC_PLUGIN_COPILOT_RAW?: string;
  readonly PUBLIC_PLUGIN_OPENCODE_REPO?: string;
  readonly PUBLIC_PLUGIN_OPENCODE_RAW?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
