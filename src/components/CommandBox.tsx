import type { JSX } from 'react';
import { Check, Copy } from 'lucide-react';
import { useCopy } from '~/lib/useCopy';
import { dict, type Locale } from '~/i18n';

interface Props {
  command: string;
  locale: Locale;
}

/** A terminal command in a grey box, with a copy button. */
export default function CommandBox({ command, locale }: Props): JSX.Element {
  const t = dict(locale).installCommand;
  const { copied, copy } = useCopy(command);
  return (
    <div className="app-cmd">
      <code className="app-cmd__code">{command}</code>
      <button type="button" className="app-cmd__copy" onClick={copy} aria-label={copied ? t.copied : t.copy} title={copied ? t.copied : t.copy}>
        {copied ? <Check size={16} strokeWidth={1.75} /> : <Copy size={16} strokeWidth={1.75} />}
      </button>
    </div>
  );
}
