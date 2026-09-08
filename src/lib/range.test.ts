import { beforeEach, describe, expect, it } from 'vitest';
import {
  DATA_START,
  DEFAULT_PRESET,
  DEFAULT_SELECTION,
  PRESETS,
  PRESET_GROUPS,
  addDays,
  defaultRange,
  eachDay,
  eachWeekStart,
  exceedsMonths,
  fromISO,
  isPresetId,
  isWeekend,
  loadSelection,
  normalize,
  persistSelection,
  rangeDays,
  resolveRange,
  toISO,
  withRangeParams,
  type RangeSelection,
} from './range';

function preset(id: string) {
  const p = PRESETS.find((p) => p.id === id);
  if (!p) {
    throw new Error(`unknown preset ${id}`);
  }
  return p;
}

describe('toISO / fromISO', () => {
  it('round-trips a date', () => {
    // given
    const d = new Date(2026, 6, 22);

    // when
    const iso = toISO(d);
    const roundTripped = toISO(fromISO('2026-07-22'));

    // then
    expect(iso).toBe('2026-07-22');
    expect(roundTripped).toBe('2026-07-22');
  });

  it('pads single-digit month/day', () => {
    // given / when / then
    expect(toISO(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('addDays', () => {
  it('adds and subtracts days across month/year boundaries', () => {
    // given / when / then — one boundary direction per line
    expect(toISO(addDays(fromISO('2026-01-01'), -1))).toBe('2025-12-31');
    expect(toISO(addDays(fromISO('2026-12-31'), 1))).toBe('2027-01-01');
  });
});

describe('isWeekend', () => {
  it('flags Saturday and Sunday only', () => {
    // given / when / then — one weekday per line
    expect(isWeekend('2026-07-18')).toBe(true); // Sat
    expect(isWeekend('2026-07-19')).toBe(true); // Sun
    expect(isWeekend('2026-07-20')).toBe(false); // Mon
  });
});

describe('rangeDays', () => {
  it('counts inclusively', () => {
    // given / when / then — single day, then a full week
    expect(rangeDays({ from: '2026-07-01', to: '2026-07-01' })).toBe(1);
    expect(rangeDays({ from: '2026-07-01', to: '2026-07-07' })).toBe(7);
  });
});

describe('eachDay', () => {
  it('lists every ISO date in range, inclusive', () => {
    // given
    const range = { from: '2026-07-01', to: '2026-07-03' };

    // when
    const days = eachDay(range);

    // then
    expect(days).toEqual(['2026-07-01', '2026-07-02', '2026-07-03']);
  });
});

describe('eachWeekStart', () => {
  it('returns Monday of every calendar week touching the range', () => {
    // given — 2026-07-01 is a Wednesday, 2026-07-14 a Tuesday.
    const range = { from: '2026-07-01', to: '2026-07-14' };

    // when
    const weekStarts = eachWeekStart(range);

    // then
    expect(weekStarts).toEqual(['2026-06-29', '2026-07-06', '2026-07-13']);
  });
});

describe('exceedsMonths', () => {
  it('is false at exactly N months, true just beyond', () => {
    // given / when / then — the boundary day, then one day past it
    expect(exceedsMonths({ from: '2026-01-15', to: '2026-03-15' }, 2)).toBe(false);
    expect(exceedsMonths({ from: '2026-01-15', to: '2026-03-16' }, 2)).toBe(true);
  });
});

describe('normalize', () => {
  it('leaves an already-ordered range untouched', () => {
    // given
    const ordered = { from: '2026-07-01', to: '2026-07-10' };

    // when
    const result = normalize(ordered);

    // then
    expect(result).toEqual({ from: '2026-07-01', to: '2026-07-10' });
  });

  it('swaps from/to when reversed', () => {
    // given
    const reversed = { from: '2026-07-10', to: '2026-07-01' };

    // when
    const result = normalize(reversed);

    // then
    expect(result).toEqual({ from: '2026-07-01', to: '2026-07-10' });
  });
});

describe('isPresetId', () => {
  it('accepts known preset ids, rejects unknown strings', () => {
    // given / when / then — a known id, then an invented one
    expect(isPresetId('last30')).toBe(true);
    expect(isPresetId('lastWeekOrSo')).toBe(false);
  });
});

describe('preset compute', () => {
  // Wednesday — mid-week reference, unambiguous for "to date" presets.
  const wed = new Date(2026, 6, 22);
  // Monday — the tricky edge case: "this week" on the week's first day must
  // stay a single-day range, not be misread as "today" elsewhere.
  const mon = new Date(2026, 6, 20);

  it('today', () => {
    // given / when / then — `wed` is the shared reference day
    expect(preset('today').compute(wed)).toEqual({ from: '2026-07-22', to: '2026-07-22' });
  });

  it('weekToDate spans Monday to today', () => {
    // given / when / then
    expect(preset('weekToDate').compute(wed)).toEqual({ from: '2026-07-20', to: '2026-07-22' });
  });

  it('weekToDate on a Monday is a single day, not "today"-like by coincidence only', () => {
    // given / when / then — `mon` instead of `wed`, see the note above
    expect(preset('weekToDate').compute(mon)).toEqual({ from: '2026-07-20', to: '2026-07-20' });
  });

  it('monthToDate spans the 1st to today', () => {
    // given / when / then
    expect(preset('monthToDate').compute(wed)).toEqual({ from: '2026-07-01', to: '2026-07-22' });
  });

  it('yearToDate spans Jan 1 to today', () => {
    // given / when / then
    expect(preset('yearToDate').compute(wed)).toEqual({ from: '2026-01-01', to: '2026-07-22' });
  });

  it('yesterday is a single day before today', () => {
    // given / when / then
    expect(preset('yesterday').compute(wed)).toEqual({ from: '2026-07-21', to: '2026-07-21' });
  });

  it('prevWeek is the full Mon–Sun before this week', () => {
    // given / when / then
    expect(preset('prevWeek').compute(wed)).toEqual({ from: '2026-07-13', to: '2026-07-19' });
  });

  it('prevBusinessWeek is Mon–Fri of the previous calendar week', () => {
    // given / when / then
    expect(preset('prevBusinessWeek').compute(wed)).toEqual({ from: '2026-07-13', to: '2026-07-17' });
  });

  it('prevMonth is the full calendar month before this one', () => {
    // given / when / then
    expect(preset('prevMonth').compute(wed)).toEqual({ from: '2026-06-01', to: '2026-06-30' });
  });

  it('prevYear is the full calendar year before this one', () => {
    // given / when / then
    expect(preset('prevYear').compute(wed)).toEqual({ from: '2025-01-01', to: '2025-12-31' });
  });

  it('lastN presets are rolling N-day windows ending today', () => {
    // given / when / then — one window length per line
    expect(preset('last2').compute(wed)).toEqual({ from: '2026-07-21', to: '2026-07-22' });
    expect(preset('last7').compute(wed)).toEqual({ from: '2026-07-16', to: '2026-07-22' });
    expect(preset('last30').compute(wed)).toEqual({ from: '2026-06-23', to: '2026-07-22' });
  });

  it('allTime starts at DATA_START', () => {
    // given / when / then
    expect(preset('allTime').compute(wed)).toEqual({ from: DATA_START, to: '2026-07-22' });
  });
});

describe('resolveRange', () => {
  const today = new Date(2026, 6, 22);

  it('recomputes a preset against the given day', () => {
    // given
    const selection: RangeSelection = { kind: 'preset', id: 'today' };

    // when
    const range = resolveRange(selection, today);

    // then
    expect(range).toEqual({ from: '2026-07-22', to: '2026-07-22' });
  });

  it('falls back to the default preset for an unknown id', () => {
    // given
    const selection = { kind: 'preset', id: 'madeUpPreset' } as unknown as RangeSelection;

    // when
    const range = resolveRange(selection, today);

    // then
    expect(range).toEqual(preset('last30').compute(today));
  });

  it('normalizes a custom range', () => {
    // given
    const selection: RangeSelection = { kind: 'custom', range: { from: '2026-07-10', to: '2026-07-01' } };

    // when
    const range = resolveRange(selection, today);

    // then
    expect(range).toEqual({ from: '2026-07-01', to: '2026-07-10' });
  });
});

describe('URL/localStorage persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('loadSelection defaults when nothing is set', () => {
    // given — beforeEach cleared both the URL params and localStorage

    // when
    const selection = loadSelection();

    // then
    expect(selection).toEqual(DEFAULT_SELECTION);
  });

  it('persistSelection writes a preset to the URL and clears from/to', () => {
    // given
    window.history.replaceState({}, '', '/?from=2026-01-01&to=2026-01-02');

    // when
    persistSelection({ kind: 'preset', id: 'last7' });

    // then
    const params = new URLSearchParams(window.location.search);
    expect(params.get('preset')).toBe('last7');
    expect(params.get('from')).toBeNull();
    expect(params.get('to')).toBeNull();
  });

  it('persistSelection writes a custom range to the URL and clears preset', () => {
    // given
    window.history.replaceState({}, '', '/?preset=last7');

    // when
    persistSelection({ kind: 'custom', range: { from: '2026-07-01', to: '2026-07-10' } });

    // then
    const params = new URLSearchParams(window.location.search);
    expect(params.get('preset')).toBeNull();
    expect(params.get('from')).toBe('2026-07-01');
    expect(params.get('to')).toBe('2026-07-10');
  });

  it('loadSelection reads a preset from the URL, ignoring localStorage', () => {
    // given — a different preset in each source, so the winner is unambiguous
    window.localStorage.setItem('tokendashboard.range', JSON.stringify({ preset: 'last30' }));
    window.history.replaceState({}, '', '/?preset=last7');

    // when
    const selection = loadSelection();

    // then
    expect(selection).toEqual({ kind: 'preset', id: 'last7' });
  });

  it('loadSelection reads a custom range from the URL', () => {
    // given
    window.history.replaceState({}, '', '/?from=2026-07-01&to=2026-07-10');

    // when
    const selection = loadSelection();

    // then
    expect(selection).toEqual({ kind: 'custom', range: { from: '2026-07-01', to: '2026-07-10' } });
  });

  it('loadSelection falls back to localStorage when the URL has no params', () => {
    // given
    persistSelection({ kind: 'preset', id: 'last14' });
    window.history.replaceState({}, '', '/'); // strip the URL params persistSelection just set

    // when
    const selection = loadSelection();

    // then
    expect(selection).toEqual({ kind: 'preset', id: 'last14' });
  });

  it('loadSelection ignores malformed localStorage content', () => {
    // given
    window.localStorage.setItem('tokendashboard.range', '{not json');

    // when
    const selection = loadSelection();

    // then
    expect(selection).toEqual(DEFAULT_SELECTION);
  });
});

describe('withRangeParams', () => {
  it('appends a preset param to a bare href', () => {
    // given
    const selection: RangeSelection = { kind: 'preset', id: 'last7' };

    // when
    const href = withRangeParams('/provider/claude', selection);

    // then
    expect(href).toBe('/provider/claude?preset=last7');
  });

  it('appends from/to for a custom range, using & when the href already has a query', () => {
    // given
    const selection: RangeSelection = {
      kind: 'custom',
      range: { from: '2026-07-01', to: '2026-07-10' },
    };

    // when
    const href = withRangeParams('/provider/claude?foo=bar', selection);

    // then
    expect(href).toBe('/provider/claude?foo=bar&from=2026-07-01&to=2026-07-10');
  });
});

describe('PRESET_GROUPS', () => {
  it('flattens into PRESETS without losing or duplicating a preset', () => {
    // given
    const grouped = PRESET_GROUPS.flatMap((g) => g.presets.map((p) => p.id));

    // then
    expect(grouped).toEqual(PRESETS.map((p) => p.id));
    expect(new Set(grouped).size).toBe(grouped.length);
  });

  it('leaves no group empty, since each renders as a labelled column in the picker', () => {
    // given / when / then
    expect(PRESET_GROUPS.every((g) => g.presets.length > 0)).toBe(true);
  });

  it('gives every preset a compute function', () => {
    // given / when / then
    expect(PRESETS.every((p) => typeof p.compute === 'function')).toBe(true);
  });
});

describe('defaultRange', () => {
  it('resolves the default preset against the given day', () => {
    // given
    const wed = new Date(2026, 6, 22);

    // when
    const range = defaultRange(wed);

    // then
    expect(range).toEqual(preset(DEFAULT_PRESET).compute(wed));
  });

  it('agrees with resolving DEFAULT_SELECTION, so the two entry points cannot drift', () => {
    // given
    const wed = new Date(2026, 6, 22);

    // when
    const viaDefault = defaultRange(wed);
    const viaSelection = resolveRange(DEFAULT_SELECTION, wed);

    // then
    expect(viaDefault).toEqual(viaSelection);
  });

  it('names a preset that actually exists', () => {
    // given / when / then
    expect(PRESETS.map((p) => p.id)).toContain(DEFAULT_PRESET);
  });
});
