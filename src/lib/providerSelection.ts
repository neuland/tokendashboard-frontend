// Which providers the home page chart aggregates over. Persisted like the date range
// (see `range.ts`): URL param wins, then localStorage, then all `ACTIVE_PROVIDERS`.

import type { Provider } from './types';
import { PROVIDERS } from './types';
import { ACTIVE_PROVIDERS } from './api';

const STORAGE_KEY = 'tokendashboard.providers';
const PARAM = 'providers';

export function defaultProviderSelection(): Provider[] {
  return [...ACTIVE_PROVIDERS];
}

function isProvider(s: string): s is Provider {
  return (PROVIDERS as string[]).includes(s);
}

// A stored or shared selection can name a provider that has since been retired; an
// empty result would leave the chart with nothing to draw, so fall back to the default.
function keepActiveProviders(providers: Provider[]): Provider[] {
  const active = providers.filter((p) => ACTIVE_PROVIDERS.includes(p));
  return active.length > 0 ? active : defaultProviderSelection();
}

function parseList(raw: string): Provider[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(isProvider);
}

function readStoredSelection(): Provider[] | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = parseList(raw);
    return parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function loadProviderSelection(): Provider[] {
  if (typeof window === 'undefined') {
    return defaultProviderSelection();
  }
  const params = new URLSearchParams(window.location.search);
  const param = params.get(PARAM);
  if (param) {
    const parsed = parseList(param);
    if (parsed.length > 0) {
      return keepActiveProviders(parsed);
    }
  }
  const stored = readStoredSelection();
  return keepActiveProviders(stored ?? defaultProviderSelection());
}

export function persistProviderSelection(providers: Provider[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  const url = new URL(window.location.href);
  url.searchParams.set(PARAM, providers.join(','));
  window.history.replaceState({}, '', url);
  try {
    window.localStorage.setItem(STORAGE_KEY, providers.join(','));
  } catch {
    // Storage unavailable (e.g. private mode); the URL param is enough.
  }
}
