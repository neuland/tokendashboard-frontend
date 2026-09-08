import type { JSX } from 'react';
import { AlertTriangle } from 'lucide-react';
import { dict, type Locale } from '~/i18n';
import { errorDetail } from '~/lib/errors';

type Props = ({ status: 'loading' } | { status: 'error'; error: unknown }) & { locale: Locale };

/** Loading and error state for the history charts. */
export default function ChartStatus(props: Props): JSX.Element {
  const t = dict(props.locale);
  if (props.status === 'loading') {
    return (
      <div className="status">
        <span className="spinner" aria-hidden="true" />
        <span className="ds-body">{t.common.loading}</span>
      </div>
    );
  }
  return (
    <div className="status" role="alert">
      <AlertTriangle size={22} color="#FF5A55" />
      <span className="ds-body">{t.common.loadFailed(errorDetail(props.error, props.locale))}</span>
    </div>
  );
}
