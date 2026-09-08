import type { JSX } from 'react';
import { dict, type Locale } from '~/i18n';

const BASE = import.meta.env.BASE_URL;

export type FaqAsteriskKind = Exclude<keyof ReturnType<typeof dict>['faqAsterisk'], 'explanation'>;

export function FaqAsterisk({ kind, locale }: { kind: FaqAsteriskKind; locale: Locale }): JSX.Element {
  const t = dict(locale);
  const mark = t.faqAsterisk[kind];
  const faqPath = locale === 'de' ? `${BASE}faq/` : `${BASE}en/faq/`;
  return (
    <a
      className="footnote-mark"
      href={`${faqPath}#${mark.id}`}
      title={`${mark.q} — ${t.faqAsterisk.explanation}`}
      aria-label={mark.aria}
    >
      *
    </a>
  );
}
