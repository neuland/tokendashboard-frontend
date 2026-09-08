import { useEffect, useRef, useState, type JSX } from 'react';
import { CalendarRange, ChevronDown, Check, X } from 'lucide-react';
import type { DateRange, PresetId, RangeSelection } from '~/lib/range';
import { PRESET_GROUPS, normalize, toISO } from '~/lib/range';
import { formatDateRange } from '~/lib/format';
import { dict, type Locale } from '~/i18n';

/**
 * Time range picker: a trigger showing the current selection, opening a panel of
 * grouped presets plus a custom from/to mode. Renders as a dropdown on desktop and
 * as a bottom sheet on narrow viewports.
 *
 * Takes both the `selection` and the `range` its caller resolved from it — the picker
 * never maps a range back to a preset (see `RangeSelection` in `range.ts`).
 */
export default function DateRangePicker({
  selection,
  range,
  onChange,
  disabled = false,
  locale,
}: {
  selection: RangeSelection;
  range: DateRange;
  onChange: (selection: RangeSelection) => void;
  disabled?: boolean;
  locale: Locale;
}): JSX.Element {
  const t = dict(locale);
  const today = new Date();
  const maxDate = toISO(today);
  const activePreset = selection.kind === 'preset' ? selection.id : null;

  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Custom mode and the from/to fields are local state: editing dates must not commit
  // a selection, or every keystroke would trigger a fetch. Committed by "Anwenden".
  //
  // Both are stored against the prop they were entered for, so anything arriving from
  // outside — a preset picked in the panel, a range restored from the URL — drops the
  // local value on the next render instead of an effect overwriting it afterwards.
  const [customModeFor, setCustomModeFor] = useState<{ kind: RangeSelection['kind']; custom: boolean } | null>(null);
  const customMode =
    customModeFor && customModeFor.kind === selection.kind
      ? customModeFor.custom
      : selection.kind === 'custom';
  const setCustomMode = (custom: boolean) => setCustomModeFor({ kind: selection.kind, custom });

  const rangeKey = `${range.from}|${range.to}`;
  const [draftFor, setDraftFor] = useState<{ key: string; range: DateRange } | null>(null);
  const draft = draftFor && draftFor.key === rangeKey ? draftFor.range : range;
  const setDraft = (update: (current: DateRange) => DateRange) =>
    setDraftFor({ key: rangeKey, range: update(draft) });

  // Dismiss on outside click and Escape.
  useEffect(() => {
    if (!open) {
      return;
    }
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const showCustom = customMode;
  const label = !showCustom && activePreset ? t.presets[activePreset] : t.dateRangePicker.customRange;

  const applyPreset = (id: PresetId) => {
    setCustomMode(false);
    onChange({ kind: 'preset', id });
    setOpen(false);
  };

  const applyCustom = () => {
    onChange({ kind: 'custom', range: normalize(draft) });
    setOpen(false);
  };

  const draftValid = Boolean(draft.from && draft.to);

  return (
    <div className="rp" ref={wrapRef}>
      <button
        type="button"
        className="rp__trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
      >
        <CalendarRange size={18} strokeWidth={1.75} aria-hidden="true" className="rp__trigger-icon" />
        <span className="rp__trigger-text">
          <span className="rp__trigger-label">{label}</span>
          <span className="rp__trigger-range">{formatDateRange(range.from, range.to, locale)}</span>
        </span>
        <ChevronDown size={18} strokeWidth={2} aria-hidden="true" className={`rp__trigger-chevron${open ? ' rp__trigger-chevron--open' : ''}`} />
      </button>

      {open && (
        <>
          <div className="rp__backdrop" onClick={() => setOpen(false)} />
          <div className="rp__panel" role="dialog" aria-label={t.dateRangePicker.panelAriaLabel}>
            <div className="rp__panel-head">
              <span className="ds-small rp__panel-title">{t.dateRangePicker.panelTitle}</span>
              <button type="button" className="rp__close" aria-label={t.dateRangePicker.closeAriaLabel} onClick={() => setOpen(false)}>
                <X size={18} strokeWidth={2} aria-hidden="true" />
              </button>
            </div>

            <div className="rp__groups">
              {PRESET_GROUPS.map((group) => (
                <div className="rp__group" key={group.id}>
                  <div className="rp__group-title">{t.presetGroups[group.id]}</div>
                  {group.presets.map((p) => {
                    const isActive = !showCustom && activePreset === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className={`rp__option${isActive ? ' rp__option--active' : ''}`}
                        aria-pressed={isActive}
                        onClick={() => applyPreset(p.id)}
                      >
                        <span>{t.presets[p.id]}</span>
                        {isActive && <Check size={15} strokeWidth={2.25} aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              ))}

              <div className="rp__group">
                <div className="rp__group-title">{t.dateRangePicker.customGroupTitle}</div>
                <button
                  type="button"
                  className={`rp__option${showCustom ? ' rp__option--active' : ''}`}
                  aria-pressed={showCustom}
                  onClick={() => setCustomMode(true)}
                >
                  <span>{t.dateRangePicker.customRange}</span>
                  {showCustom && <Check size={15} strokeWidth={2.25} aria-hidden="true" />}
                </button>

                {showCustom && (
                  <div className="rp__custom">
                    <label className="rp__field">
                      <span className="rp__field-label">{t.dateRangePicker.fromLabel}</span>
                      <input
                        type="date"
                        className="rp__input"
                        value={draft.from}
                        max={draft.to || maxDate}
                        onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
                      />
                    </label>
                    <label className="rp__field">
                      <span className="rp__field-label">{t.dateRangePicker.toLabel}</span>
                      <input
                        type="date"
                        className="rp__input"
                        value={draft.to}
                        min={draft.from}
                        max={maxDate}
                        onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
                      />
                    </label>
                    <button
                      type="button"
                      className="rp__apply"
                      disabled={!draftValid}
                      onClick={applyCustom}
                    >
                      {t.dateRangePicker.applyButton}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
