import type { JSX } from 'react';
import type { SeriesGranularity } from '~/lib/types';
import type { SeriesResolution } from '~/lib/useUsageSeries';
import { dict, type Locale } from '~/i18n';

interface Props {
  /** What the user pinned, or `auto`. */
  resolution: SeriesResolution;
  /** What the chart currently shows — `auto` resolved for the selected range. */
  granularity: SeriesGranularity;
  onChange: (resolution: SeriesResolution) => void;
  disabled?: boolean;
  locale: Locale;
}

/**
 * Compact "Day | Week" switch, placed at the chart it changes. The pressed button is
 * the effective granularity, so an `auto` choice still shows what is on screen; the
 * rule `auto` follows is in the tooltip. The caller decides whether switching makes
 * sense for the range at all (see `canSwitchResolution`).
 */
export default function ResolutionToggle({ resolution, granularity, onChange, disabled = false, locale }: Props): JSX.Element {
  const t = dict(locale);
  const options: { value: SeriesGranularity; label: string }[] = [
    { value: 'day', label: t.resolution.day },
    { value: 'week', label: t.resolution.week },
  ];
  return (
    <div
      className="app-seg app-seg--compact"
      role="group"
      aria-label={t.resolution.label}
      title={t.resolution.autoHint}
      data-resolution={resolution}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className="app-seg__btn"
          aria-pressed={granularity === o.value}
          disabled={disabled}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Below two weeks a weekly chart has one or two bars, so the switch is pointless. */
export const MIN_DAYS_FOR_WEEKS = 14;

export function canSwitchResolution(days: number): boolean {
  return days >= MIN_DAYS_FOR_WEEKS;
}
