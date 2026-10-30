import type { JSX } from 'react';
import { dict, type Locale } from '~/i18n';
import { pagePath } from '~/lib/paths';

const BASE = import.meta.env.BASE_URL;

export type FaqAsteriskKind = Exclude<keyof ReturnType<typeof dict>['faqAsterisk'], 'explanation'>;

/** Footnote mark linking into the FAQ page. */
export function FaqAsterisk({ kind, locale }: { kind: FaqAsteriskKind; locale: Locale }): JSX.Element {
  const t = dict(locale);
  const mark = t.faqAsterisk[kind];
  const faqPath = pagePath(BASE, locale, 'faq/');
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
