import type { JSX } from 'react';
import type { View } from '~/lib/seriesChartData';
import { dict, type Locale } from '~/i18n';

interface Props {
  views: View[];
  active: View;
  onChange: (view: View) => void;
  locale: Locale;
}

/** View switcher; the caller decides which views to offer (`model` is provider-only). */
export default function ViewToggle({ views, active, onChange, locale }: Props): JSX.Element {
  const t = dict(locale);
  return (
    <div className="view-toggle" role="group" aria-label={t.viewToggle.ariaLabel}>
      {views.map((v) => (
        <button
          key={v}
          type="button"
          className={`view-toggle__btn${active === v ? ' view-toggle__btn--active' : ''}`}
          onClick={() => onChange(v)}
        >
          {t.viewToggleLabels[v]}
        </button>
      ))}
    </div>
  );
}
