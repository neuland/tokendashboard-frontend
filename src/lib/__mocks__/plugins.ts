// Default mock for `src/lib/plugins.ts`, picked up by a bare `vi.mock('~/lib/plugins')`.
// The command builders keep their real behaviour and are only wrapped in spies, so a
// test asserts against real command strings and overrides just the case it is after
// (e.g. `mockReturnValueOnce(undefined)` for "this provider has no plugin").
import { vi } from 'vitest';

type Plugins = typeof import('~/lib/plugins');

const actual = await vi.importActual<Plugins>('~/lib/plugins');

// Pure lookups and label helpers stay real.
export const { DEFAULT_PLUGIN_URLS, PROVIDER_PLUGIN_CONFIG, providerPluginLabel, backendApiUrl } = actual;

export const providerPlugin = vi.fn(actual.providerPlugin);
export const buildPluginInstallCommand = vi.fn(actual.buildPluginInstallCommand);
export const buildPluginUninstallCommand = vi.fn(actual.buildPluginUninstallCommand);
