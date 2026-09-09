import type { Provider } from './types';
import { PROVIDERS, PROVIDER_LABELS } from './types';
import type { Locale } from '~/i18n';

export interface PluginConfig {
  /** Browse/README link, shown as the doc reference in the UI. */
  repoUrl: string;
  /** Clone target for `npx git+<url> install|uninstall`. */
  installGitUrl: string;
  /** Value for the plugin's `--repo-raw-base-url` install flag. */
  rawBaseUrl: string;
}

// --- Where the plugin repositories live -------------------------------------------
//
// Two URLs per provider, both explicit: the repository (browsed, and cloned with `.git`
// appended) and the raw-file base the installed plugin auto-updates from. A fork that
// hosts its own plugins overrides them one by one in `.env` or via `--build-arg`; the
// values are copied verbatim from the plugin's README, no naming convention involved.
//
// `rawBaseUrl` deserves attention: it is where the installed plugin fetches its own
// updates from and runs them, so whoever operates the dashboard decides the update
// source of every user who copies the install command. See the plugin's SECURITY.md.
//
// `||`, not `??`: a `--build-arg` left unset arrives as an empty string, which has to
// mean "default", not "no repository".

export const DEFAULT_PLUGIN_URLS: Record<Provider, { repo: string; raw: string }> = {
  claude: {
    repo: 'https://github.com/neuland/tokendashboard-plugin-claude',
    raw: 'https://raw.githubusercontent.com/neuland/tokendashboard-plugin-claude/main',
  },
  copilot: {
    repo: 'https://github.com/neuland/tokendashboard-plugin-copilot',
    raw: 'https://raw.githubusercontent.com/neuland/tokendashboard-plugin-copilot/main',
  },
  opencode: {
    repo: 'https://github.com/neuland/tokendashboard-plugin-opencode',
    raw: 'https://raw.githubusercontent.com/neuland/tokendashboard-plugin-opencode/main',
  },
};

// Static property accesses on purpose: Vite inlines `import.meta.env.<NAME>` at build
// time only when the name is spelled out.
const env = import.meta.env;
const CONFIGURED_PLUGIN_URLS: Record<Provider, { repo?: string; raw?: string }> = {
  claude: { repo: env.PUBLIC_PLUGIN_CLAUDE_REPO, raw: env.PUBLIC_PLUGIN_CLAUDE_RAW },
  copilot: { repo: env.PUBLIC_PLUGIN_COPILOT_REPO, raw: env.PUBLIC_PLUGIN_COPILOT_RAW },
  opencode: { repo: env.PUBLIC_PLUGIN_OPENCODE_REPO, raw: env.PUBLIC_PLUGIN_OPENCODE_RAW },
};

function pluginConfig(provider: Provider): PluginConfig {
  const configured = CONFIGURED_PLUGIN_URLS[provider];
  const defaults = DEFAULT_PLUGIN_URLS[provider];
  const repoUrl = (configured.repo || defaults.repo).replace(/\/+$/, '');
  return {
    repoUrl,
    installGitUrl: `${repoUrl}.git`,
    rawBaseUrl: (configured.raw || defaults.raw).replace(/\/+$/, ''),
  };
}

/** Plugin that reports usage for a provider; absent where none exists yet. */
export const PROVIDER_PLUGIN_CONFIG: Partial<Record<Provider, PluginConfig>> = Object.fromEntries(
  PROVIDERS.map((provider) => [provider, pluginConfig(provider)]),
);

const PLUGIN_LABEL_SUFFIX: Record<Locale, string> = { de: '-Plugin', en: ' plugin' };

export function providerPluginLabel(provider: Provider, locale: Locale): string {
  return `${PROVIDER_LABELS[locale][provider]}${PLUGIN_LABEL_SUFFIX[locale]}`;
}

/** The plugin that reports usage for a provider; absent where none exists yet. */
export function providerPlugin(
  provider: Provider,
  locale: Locale,
): { repoUrl: string; label: string } | undefined {
  const config = PROVIDER_PLUGIN_CONFIG[provider];
  if (!config) {
    return undefined;
  }
  return { repoUrl: config.repoUrl, label: providerPluginLabel(provider, locale) };
}

/** Ready-to-run install command; `apiBaseUrl` is this dashboard's base URL. */
export function buildPluginInstallCommand(provider: Provider, apiBaseUrl: string): string | undefined {
  const config = PROVIDER_PLUGIN_CONFIG[provider];
  if (!config) {
    return undefined;
  }
  return `npx --allow-git=all git+${config.installGitUrl} install --api-base-url ${apiBaseUrl} --repo-raw-base-url ${config.rawBaseUrl}`;
}

export function buildPluginUninstallCommand(provider: Provider): string | undefined {
  const config = PROVIDER_PLUGIN_CONFIG[provider];
  if (!config) {
    return undefined;
  }
  return `npx --allow-git=all git+${config.installGitUrl} uninstall`;
}

/** This dashboard's base url; absolute, since the plugin runs on the user's machine. */
export function backendApiUrl(): string {
  const apiBase = import.meta.env.PUBLIC_API_BASE ?? '';
  const origin = apiBase || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${origin}`;
}
