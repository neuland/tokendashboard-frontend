import type { JSX } from 'react';
import { dict, type Locale } from '~/i18n';

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  locale: Locale;
}

export default function ForceDayToggle({ checked, onChange, locale }: Props): JSX.Element {
  const t = dict(locale);
  return (
    <label className="force-day-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{t.forceDayToggle.label}</span>
    </label>
  );
}
