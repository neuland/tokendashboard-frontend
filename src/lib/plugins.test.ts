import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_PLUGIN_URLS,
  PROVIDER_PLUGIN_CONFIG,
  buildPluginInstallCommand,
  buildPluginUninstallCommand,
  providerPlugin,
  providerPluginLabel,
} from './plugins';
import { PROVIDERS, PROVIDER_LABELS } from './types';
import { LOCALES } from '~/i18n';

describe('buildPluginInstallCommand', () => {
  it('builds the npx install command with endpoint and raw-base-url flags', () => {
    // given
    const endpoint = 'https://tokendashboard.example.com/api/ingest/copilot';

    // when
    const command = buildPluginInstallCommand('copilot', endpoint);

    // then
    expect(command).toBe(
      'npx --allow-git=all git+https://github.com/neuland/tokendashboard-plugin-copilot.git install ' +
        '--api-base-url https://tokendashboard.example.com/api/ingest/copilot ' +
        '--repo-raw-base-url https://raw.githubusercontent.com/neuland/tokendashboard-plugin-copilot/main',
    );
  });
});

describe('buildPluginUninstallCommand', () => {
  it('builds the npx uninstall command without flags', () => {
    // given / when / then
    expect(buildPluginUninstallCommand('claude')).toBe(
      'npx --allow-git=all git+https://github.com/neuland/tokendashboard-plugin-claude.git uninstall',
    );
  });
});

describe('providerPlugin', () => {
  it('reports the repo link and the display label for a provider that has a plugin', () => {
    // when
    const plugin = providerPlugin('copilot', 'de');

    // then
    expect(plugin).toEqual({
      repoUrl: 'https://github.com/neuland/tokendashboard-plugin-copilot',
      label: providerPluginLabel('copilot', 'de'),
    });
  });

  it('exposes the browse URL, not the clone URL the install command uses', () => {
    // given
    const config = PROVIDER_PLUGIN_CONFIG.claude!;

    // when
    const plugin = providerPlugin('claude', 'de');

    // then
    expect(plugin!.repoUrl).toBe(config.repoUrl);
    expect(plugin!.repoUrl).not.toContain('.git');
    expect(config.installGitUrl).toContain('.git');
  });

  it('localises the label it carries', () => {
    // given / when / then — one locale per line
    expect(providerPlugin('claude', 'de')!.label).toBe(providerPluginLabel('claude', 'de'));
    expect(providerPlugin('claude', 'en')!.label).toBe(providerPluginLabel('claude', 'en'));
  });
});

describe('providerPluginLabel', () => {
  it('appends the locale-specific plugin suffix to the provider name', () => {
    // given / when / then
    expect(providerPluginLabel('claude', 'de')).toBe('Claude-Plugin');
    expect(providerPluginLabel('claude', 'en')).toBe('Claude plugin');
  });

  it('builds on the shared provider label rather than a second spelling', () => {
    // given / when / then
    for (const locale of LOCALES) {
      expect(providerPluginLabel('opencode', locale)).toContain(PROVIDER_LABELS[locale].opencode);
    }
  });
});

describe('PROVIDER_PLUGIN_CONFIG', () => {
  it('clones from the browse URL with .git appended', () => {
    // given / when / then
    for (const config of Object.values(PROVIDER_PLUGIN_CONFIG)) {
      expect(config.installGitUrl).toBe(`${config.repoUrl}.git`);
    }
  });

  it('covers every provider the app knows, so no page renders without install help', () => {
    // given / when / then
    expect(Object.keys(PROVIDER_PLUGIN_CONFIG).sort()).toEqual([...PROVIDERS].sort());
  });

  it('uses the upstream URLs when nothing is configured', () => {
    // given — the test environment has no .env, so the module saw no PUBLIC_PLUGIN_* variable

    // when
    const config = PROVIDER_PLUGIN_CONFIG.claude!;

    // then
    expect(config.repoUrl).toBe(DEFAULT_PLUGIN_URLS.claude.repo);
    expect(config.rawBaseUrl).toBe(DEFAULT_PLUGIN_URLS.claude.raw);
  });
});

// The module reads `import.meta.env` once at import time, so each case needs a fresh
// module registry rather than a re-read — the same pattern as `company.test.ts`.
describe('PUBLIC_PLUGIN_* configuration', () => {
  type Plugins = typeof import('./plugins');

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  async function loadWith(env: Record<string, string | undefined>): Promise<Plugins> {
    for (const [key, value] of Object.entries(env)) {
      vi.stubEnv(key, value);
    }
    return import('./plugins');
  }

  it('takes both URLs of a provider verbatim from its two variables', async () => {
    // given
    const env = {
      PUBLIC_PLUGIN_COPILOT_REPO: 'https://gitlab.example.com/tools/copilot-usage',
      PUBLIC_PLUGIN_COPILOT_RAW: 'https://gitlab.example.com/tools/copilot-usage/-/raw/stable',
    };

    // when
    const { PROVIDER_PLUGIN_CONFIG } = await loadWith(env);

    // then — no naming convention: the fork's repository is not called tokendashboard-plugin-copilot
    expect(PROVIDER_PLUGIN_CONFIG.copilot).toEqual({
      repoUrl: 'https://gitlab.example.com/tools/copilot-usage',
      installGitUrl: 'https://gitlab.example.com/tools/copilot-usage.git',
      rawBaseUrl: 'https://gitlab.example.com/tools/copilot-usage/-/raw/stable',
    });
  });

  it('leaves the other providers on their defaults', async () => {
    // given
    const env = { PUBLIC_PLUGIN_COPILOT_REPO: 'https://gitlab.example.com/tools/copilot-usage' };

    // when
    const { PROVIDER_PLUGIN_CONFIG, DEFAULT_PLUGIN_URLS } = await loadWith(env);

    // then
    expect(PROVIDER_PLUGIN_CONFIG.claude!.repoUrl).toBe(DEFAULT_PLUGIN_URLS.claude.repo);
    expect(PROVIDER_PLUGIN_CONFIG.opencode!.rawBaseUrl).toBe(DEFAULT_PLUGIN_URLS.opencode.raw);
  });

  it('overrides one URL of a provider without touching the other', async () => {
    // given
    const env = { PUBLIC_PLUGIN_CLAUDE_RAW: 'https://raw.githubusercontent.com/neuland/tokendashboard-plugin-claude/stable' };

    // when
    const { PROVIDER_PLUGIN_CONFIG, DEFAULT_PLUGIN_URLS } = await loadWith(env);

    // then
    expect(PROVIDER_PLUGIN_CONFIG.claude!.rawBaseUrl).toBe(
      'https://raw.githubusercontent.com/neuland/tokendashboard-plugin-claude/stable',
    );
    expect(PROVIDER_PLUGIN_CONFIG.claude!.repoUrl).toBe(DEFAULT_PLUGIN_URLS.claude.repo);
  });

  it('tolerates trailing slashes', async () => {
    // given
    const env = {
      PUBLIC_PLUGIN_CLAUDE_REPO: 'https://github.com/acme/claude-plugin/',
      PUBLIC_PLUGIN_CLAUDE_RAW: 'https://raw.githubusercontent.com/acme/claude-plugin/main/',
    };

    // when
    const { PROVIDER_PLUGIN_CONFIG } = await loadWith(env);

    // then
    expect(PROVIDER_PLUGIN_CONFIG.claude!.installGitUrl).toBe('https://github.com/acme/claude-plugin.git');
    expect(PROVIDER_PLUGIN_CONFIG.claude!.rawBaseUrl).toBe('https://raw.githubusercontent.com/acme/claude-plugin/main');
  });

  it('treats empty strings as unset, which is what an omitted --build-arg produces', async () => {
    // given
    const env = { PUBLIC_PLUGIN_CLAUDE_REPO: '', PUBLIC_PLUGIN_CLAUDE_RAW: '' };

    // when
    const { PROVIDER_PLUGIN_CONFIG, DEFAULT_PLUGIN_URLS } = await loadWith(env);

    // then
    expect(PROVIDER_PLUGIN_CONFIG.claude!.repoUrl).toBe(DEFAULT_PLUGIN_URLS.claude.repo);
    expect(PROVIDER_PLUGIN_CONFIG.claude!.rawBaseUrl).toBe(DEFAULT_PLUGIN_URLS.claude.raw);
  });
});
