// Default mock for `src/lib/useUsageSeries.ts`, picked up by a bare
// `vi.mock('~/lib/useUsageSeries')`. Stubbing the hook keeps the chart components out
// of the network entirely; each test declares the state it wants to render from.
import { vi } from 'vitest';

type Module = typeof import('~/lib/useUsageSeries');

export const useUsageSeries = vi.fn<Module['useUsageSeries']>();
