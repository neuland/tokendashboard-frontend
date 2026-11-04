import type { JSX } from 'react';
import { Database } from 'lucide-react';
import { dict, type Locale } from '~/i18n';

/**
 * The one marker for a figure that counts cache tokens. Every token figure without it
 * is In + Out only, so the badge is what tells the two apart, always in the same look.
 */
export default function CacheBadge({ locale }: { locale: Locale }): JSX.Element {
  return (
    <span className="app-pill app-pill--cache">
      <Database size={12} strokeWidth={2.25} aria-hidden="true" />
      {dict(locale).common.inclCache}
    </span>
  );
}
