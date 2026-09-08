import type { JSX } from 'react';
import { AlertTriangle } from 'lucide-react';
import { dict, type Locale } from '~/i18n';

/** Shown in place of a chart or table when the selected period holds no data yet. */
export default function EmptyRangeNotice({ locale }: { locale: Locale }): JSX.Element {
  const t = dict(locale);
  return (
    <div
      className="card"
      role="alert"
      style={{ marginTop: 'var(--space-lg)', borderLeft: '3px solid var(--state-warning)' }}
    >
      <div className="status">
        <AlertTriangle size={22} color="#FF9A3C" />
        <span className="ds-body">{t.emptyRangeNotice.message}</span>
      </div>
    </div>
  );
}
