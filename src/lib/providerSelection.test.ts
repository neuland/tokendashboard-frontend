import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  defaultProviderSelection,
  loadProviderSelection,
  persistProviderSelection,
} from './providerSelection';
import { ACTIVE_PROVIDERS } from './api';
import type { Provider } from './types';

// A mutable copy of the real list, so a provider can be retired for one test — the
// "everything I stored is gone" fallback is otherwise unreachable, because
// PROVIDERS and ACTIVE_PROVIDERS currently hold the same three entries.
vi.mock('./api');

const STORAGE_KEY = 'tokendashboard.providers';
const allProviders: Provider[] = [...ACTIVE_PROVIDERS];

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState({}, '', '/');
});

afterEach(() => {
  ACTIVE_PROVIDERS.splice(0, ACTIVE_PROVIDERS.length, ...allProviders);
  window.localStorage.clear();
});

describe('defaultProviderSelection', () => {
  it('offers every active provider', () => {
    // given / when / then
    expect(defaultProviderSelection()).toEqual([...ACTIVE_PROVIDERS]);
  });

  it('returns a fresh array, so a caller mutating it cannot corrupt ACTIVE_PROVIDERS', () => {
    // given
    const selection = defaultProviderSelection();

    // when
    selection.pop();

    // then
    expect(ACTIVE_PROVIDERS).toHaveLength(selection.length + 1);
  });
});

describe('loadProviderSelection', () => {
  it('defaults to every active provider when nothing is set', () => {
    // given — beforeEach cleared both the URL params and localStorage

    // when
    const selection = loadProviderSelection();

    // then
    expect(selection).toEqual([...ACTIVE_PROVIDERS]);
  });

  it('reads a comma-separated list from the URL, ignoring localStorage', () => {
    // given — a different list in each source, so the winner is unambiguous
    window.localStorage.setItem(STORAGE_KEY, 'opencode');
    window.history.replaceState({}, '', '/?providers=claude,copilot');

    // when
    const selection = loadProviderSelection();

    // then
    expect(selection).toEqual(['claude', 'copilot']);
  });

  it('tolerates whitespace around the names', () => {
    // given
    window.history.replaceState({}, '', `/?providers=${encodeURIComponent(' claude , copilot ')}`);

    // when
    const selection = loadProviderSelection();

    // then
    expect(selection).toEqual(['claude', 'copilot']);
  });

  it('drops names that are not providers at all', () => {
    // given
    window.history.replaceState({}, '', '/?providers=claude,notAProvider');

    // when
    const selection = loadProviderSelection();

    // then
    expect(selection).toEqual(['claude']);
  });

  it('falls back to the default when the URL list names nothing recognisable', () => {
    // given
    window.history.replaceState({}, '', '/?providers=nope,alsoNope');

    // when
    const selection = loadProviderSelection();

    // then
    expect(selection).toEqual([...ACTIVE_PROVIDERS]);
  });

  it('falls back to localStorage when the URL has no param', () => {
    // given
    window.localStorage.setItem(STORAGE_KEY, 'copilot');

    // when
    const selection = loadProviderSelection();

    // then
    expect(selection).toEqual(['copilot']);
  });

  it('falls back to the default when the stored list is empty', () => {
    // given
    window.localStorage.setItem(STORAGE_KEY, '');

    // when
    const selection = loadProviderSelection();

    // then
    expect(selection).toEqual([...ACTIVE_PROVIDERS]);
  });

  it('falls back to the default when the stored name is no longer a provider at all', () => {
    // given
    window.localStorage.setItem(STORAGE_KEY, 'notAProvider');

    // when
    const selection = loadProviderSelection();

    // then
    expect(selection).toEqual([...ACTIVE_PROVIDERS]);
  });

  it('falls back to the default when every stored provider has since been retired', () => {
    // given — opencode is still in the Provider union but no longer reports data, so
    // honouring the stored list literally would leave the chart with nothing to draw
    ACTIVE_PROVIDERS.splice(ACTIVE_PROVIDERS.indexOf('opencode'), 1);
    window.localStorage.setItem(STORAGE_KEY, 'opencode');

    // when
    const selection = loadProviderSelection();

    // then
    expect(selection).toEqual([...ACTIVE_PROVIDERS]);
    expect(selection).not.toHaveLength(0);
  });

  it('keeps the still-active part of a partly retired list', () => {
    // given
    ACTIVE_PROVIDERS.splice(ACTIVE_PROVIDERS.indexOf('opencode'), 1);
    window.history.replaceState({}, '', '/?providers=claude,opencode');

    // when
    const selection = loadProviderSelection();

    // then
    expect(selection).toEqual(['claude']);
  });
});

describe('persistProviderSelection', () => {
  it('writes the list to the URL and to localStorage', () => {
    // given / when
    persistProviderSelection(['claude', 'opencode']);

    // then
    expect(new URLSearchParams(window.location.search).get('providers')).toBe('claude,opencode');
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('claude,opencode');
  });

  it('round-trips through loadProviderSelection', () => {
    // given
    persistProviderSelection(['copilot']);

    // when
    const selection = loadProviderSelection();

    // then
    expect(selection).toEqual(['copilot']);
  });

  it('replaces a previous param rather than appending a second one', () => {
    // given
    window.history.replaceState({}, '', '/?providers=claude');

    // when
    persistProviderSelection(['copilot']);

    // then
    expect(window.location.search).toBe('?providers=copilot');
  });
});
