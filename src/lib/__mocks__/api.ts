// Default mock for `src/lib/api.ts`, picked up by a bare `vi.mock('~/lib/api')`.
// vitest resolves `__mocks__` next to the mocked module, Jest-style; unlike node_modules
// mocks it is not applied automatically, so the `vi.mock` call is still what enables it.
import { vi } from 'vitest';
import type { Provider } from '~/lib/types';

type Api = typeof import('~/lib/api');

const actual = await vi.importActual<Api>('~/lib/api');

// Pure helpers stay real — there is nothing to stub about them.
export const { tokensTotal, tokensInOut } = actual;

/**
 * A mutable copy of the real list. Tests that need the "no data for this provider"
 * branch splice it and restore it afterwards; module state is per test file, so the
 * edit cannot leak into another file.
 */
export const ACTIVE_PROVIDERS: Provider[] = [...actual.ACTIVE_PROVIDERS];

// Every network call is stubbed and returns undefined until a test says otherwise.
export const fetchProviderUsage = vi.fn<Api['fetchProviderUsage']>();
export const fetchUsageOverview = vi.fn<Api['fetchUsageOverview']>();
export const fetchProviderUsageSeries = vi.fn<Api['fetchProviderUsageSeries']>();
export const fetchAllUsageSeries = vi.fn<Api['fetchAllUsageSeries']>();
