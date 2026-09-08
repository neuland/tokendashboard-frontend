// Date range selection for the dashboard, plus its persistence in URL and
// localStorage. See `RangeSelection` for the central invariant.

/** Day granularity; `from` and `to` are ISO dates (YYYY-MM-DD) and inclusive. */
export interface DateRange {
  from: string;
  to: string;
}

export type PresetId =
  // to date (ongoing, ends today)
  | 'today'
  | 'weekToDate'
  | 'monthToDate'
  | 'yearToDate'
  // completed previous periods
  | 'yesterday'
  | 'prevWeek'
  | 'prevBusinessWeek'
  | 'prevMonth'
  | 'prevYear'
  // rolling "last N days"
  | 'last2'
  | 'last4'
  | 'last7'
  | 'last14'
  | 'last30'
  | 'allTime';

export const DATA_START = '2026-01-01';

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
function isISO(s: string): boolean {
  return ISO_RE.test(s);
}

export function isWeekend(iso: string): boolean {
  const dow = fromISO(iso).getDay();
  return dow === 0 || dow === 6;
}

export function rangeDays(range: DateRange): number {
  const ms = fromISO(range.to).getTime() - fromISO(range.from).getTime();
  return Math.floor(ms / 86_400_000) + 1;
}

export function eachDay(range: DateRange): string[] {
  const days: string[] = [];
  const end = fromISO(range.to);
  for (let d = fromISO(range.from); d <= end; d = addDays(d, 1)) {
    days.push(toISO(d));
  }
  return days;
}

// Monday of every calendar week touching the range — the keys weekly buckets are
// grouped and gap-filled by.
export function eachWeekStart(range: DateRange): string[] {
  const weeks: string[] = [];
  const end = fromISO(range.to);
  for (let d = startOfWeek(fromISO(range.from)); d <= end; d = addDays(d, 7)) {
    weeks.push(toISO(d));
  }
  return weeks;
}

// Whether the range spans more than `months` calendar months from `from` — used to
// pick day vs. week granularity. Relies on JS date rollover to normalise
// overlong month ends (e.g. 31 Jan + 1 month → 3 Mar).
export function exceedsMonths(range: DateRange, months: number): boolean {
  const from = fromISO(range.from);
  const limit = new Date(from.getFullYear(), from.getMonth() + months, from.getDate());
  return fromISO(range.to) > limit;
}

export interface Preset {
  id: PresetId;
  compute: (today: Date) => DateRange;
}

function startOfWeek(t: Date): Date {
  const dow = (t.getDay() + 6) % 7; // Monday = 0
  return addDays(new Date(t.getFullYear(), t.getMonth(), t.getDate()), -dow);
}

export type PresetGroupId = 'toDate' | 'prevPeriod' | 'rolling' | 'misc';

export interface PresetGroup {
  id: PresetGroupId;
  presets: Preset[];
}

export const PRESET_GROUPS: PresetGroup[] = [
  {
    id: 'toDate',
    presets: [
      { id: 'today', compute: (t) => ({ from: toISO(t), to: toISO(t) }) },
      { id: 'weekToDate', compute: (t) => ({ from: toISO(startOfWeek(t)), to: toISO(t) }) },
      {
        id: 'monthToDate',
        compute: (t) => ({ from: toISO(new Date(t.getFullYear(), t.getMonth(), 1)), to: toISO(t) }),
      },
      {
        id: 'yearToDate',
        compute: (t) => ({ from: toISO(new Date(t.getFullYear(), 0, 1)), to: toISO(t) }),
      },
    ],
  },
  {
    id: 'prevPeriod',
    presets: [
      { id: 'yesterday', compute: (t) => ({ from: toISO(addDays(t, -1)), to: toISO(addDays(t, -1)) }) },
      {
        id: 'prevWeek',
        compute: (t: Date): DateRange => {
          const mon = startOfWeek(t);
          return { from: toISO(addDays(mon, -7)), to: toISO(addDays(mon, -1)) };
        },
      },
      {
        id: 'prevBusinessWeek',
        compute: (t: Date): DateRange => {
          const mon = addDays(startOfWeek(t), -7);
          return { from: toISO(mon), to: toISO(addDays(mon, 4)) };
        },
      },
      {
        id: 'prevMonth',
        compute: (t) => ({
          from: toISO(new Date(t.getFullYear(), t.getMonth() - 1, 1)),
          to: toISO(new Date(t.getFullYear(), t.getMonth(), 0)),
        }),
      },
      {
        id: 'prevYear',
        compute: (t) => ({
          from: toISO(new Date(t.getFullYear() - 1, 0, 1)),
          to: toISO(new Date(t.getFullYear() - 1, 11, 31)),
        }),
      },
    ],
  },
  {
    id: 'rolling',
    presets: [
      { id: 'last2', compute: (t) => ({ from: toISO(addDays(t, -1)), to: toISO(t) }) },
      { id: 'last4', compute: (t) => ({ from: toISO(addDays(t, -3)), to: toISO(t) }) },
      { id: 'last7', compute: (t) => ({ from: toISO(addDays(t, -6)), to: toISO(t) }) },
      { id: 'last14', compute: (t) => ({ from: toISO(addDays(t, -13)), to: toISO(t) }) },
      { id: 'last30', compute: (t) => ({ from: toISO(addDays(t, -29)), to: toISO(t) }) },
    ],
  },
  {
    id: 'misc',
    presets: [{ id: 'allTime', compute: (t) => ({ from: DATA_START, to: toISO(t) }) }],
  },
];

export const PRESETS: Preset[] = PRESET_GROUPS.flatMap((g) => g.presets);

export const DEFAULT_PRESET: PresetId = 'last30';

export function defaultRange(today: Date = new Date()): DateRange {
  const preset = PRESETS.find((p) => p.id === DEFAULT_PRESET);
  return preset!.compute(today);
}

/**
 * What the user picked, and the source of truth for the whole app: either a
 * preset (semantic, recomputed against the current day) or an explicit range
 * (absolute). A preset is never inferred back from a `DateRange` — on a Monday
 * "this week" resolves to Mon–Mon, which would be misread as "today".
 */
export type RangeSelection =
  | { kind: 'preset'; id: PresetId }
  | { kind: 'custom'; range: DateRange };

export const DEFAULT_SELECTION: RangeSelection = { kind: 'preset', id: DEFAULT_PRESET };

export function isPresetId(id: string): id is PresetId {
  return PRESETS.some((p) => p.id === id);
}

/** Resolve a selection to concrete dates; presets are computed against `today`. */
export function resolveRange(selection: RangeSelection, today: Date = new Date()): DateRange {
  if (selection.kind === 'preset') {
    const preset = PRESETS.find((p) => p.id === selection.id);
    return preset ? preset.compute(today) : defaultRange(today);
  }
  return normalize(selection.range);
}

export function normalize(range: DateRange): DateRange {
  return range.from <= range.to ? range : { from: range.to, to: range.from };
}

const STORAGE_KEY = 'tokendashboard.range';
const PRESET_PARAM = 'preset';

// Stored shape: a preset id, or an absolute range. `Partial<DateRange>` keeps
// entries written by older versions (from/to only) readable.
interface StoredSelection extends Partial<DateRange> {
  preset?: string;
}

function readStoredSelection(): RangeSelection | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as StoredSelection;
    if (parsed?.preset && isPresetId(parsed.preset)) {
      return { kind: 'preset', id: parsed.preset };
    }
    if (parsed && isISO(parsed.from ?? '') && isISO(parsed.to ?? '')) {
      return { kind: 'custom', range: normalize({ from: parsed.from!, to: parsed.to! }) };
    }
  } catch {
    // Corrupt or blocked storage: fall back to the default.
  }
  return null;
}

/**
 * The selection to start from: URL params win (shareable links), then
 * localStorage (survives in-app navigation without params), then the default.
 */
export function loadSelection(): RangeSelection {
  if (typeof window === 'undefined') {
    return DEFAULT_SELECTION;
  }
  const params = new URLSearchParams(window.location.search);
  const presetParam = params.get(PRESET_PARAM);
  if (presetParam && isPresetId(presetParam)) {
    return { kind: 'preset', id: presetParam };
  }
  const from = params.get('from');
  const to = params.get('to');
  if (from && to && isISO(from) && isISO(to)) {
    return { kind: 'custom', range: normalize({ from, to }) };
  }
  return readStoredSelection() ?? DEFAULT_SELECTION;
}

/** Write the selection to the URL (shareable) and localStorage (sticky). */
export function persistSelection(selection: RangeSelection): void {
  if (typeof window === 'undefined') {
    return;
  }
  const url = new URL(window.location.href);
  if (selection.kind === 'preset') {
    url.searchParams.set(PRESET_PARAM, selection.id);
    url.searchParams.delete('from');
    url.searchParams.delete('to');
  } else {
    url.searchParams.delete(PRESET_PARAM);
    url.searchParams.set('from', selection.range.from);
    url.searchParams.set('to', selection.range.to);
  }
  window.history.replaceState({}, '', url);
  try {
    const payload: StoredSelection =
      selection.kind === 'preset' ? { preset: selection.id } : { ...selection.range };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Storage unavailable (e.g. private mode); the URL params are enough.
  }
}

/** Append the selection to a link, so navigation keeps the same time window. */
export function withRangeParams(href: string, selection: RangeSelection): string {
  const sep = href.includes('?') ? '&' : '?';
  return selection.kind === 'preset'
    ? `${href}${sep}${PRESET_PARAM}=${selection.id}`
    : `${href}${sep}from=${selection.range.from}&to=${selection.range.to}`;
}
