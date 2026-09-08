import { useState, type JSX } from 'react';
import { Copy, Check } from 'lucide-react';
import type { Provider } from '~/lib/types';
import { buildPluginInstallCommand, buildPluginUninstallCommand, backendApiUrl } from '~/lib/plugins';
import { dict, type Locale } from '~/i18n';

interface InstallCommandProps {
  provider: Provider;
  locale: Locale;
  mode: 'install' | 'uninstall';
}

export default function InstallCommand({ provider, locale, mode }: InstallCommandProps): JSX.Element | null {
  const t = dict(locale).installCommand;
  const [copied, setCopied] = useState(false);

  const command =
    mode === 'install'
      ? buildPluginInstallCommand(provider, backendApiUrl())
      : buildPluginUninstallCommand(provider);

  if (!command) {
    return null;
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="install-command">
      <span className="install-command__label">
        {mode === 'install' ? t.installLabel : t.uninstallLabel}
      </span>
      <code className="install-command__code">{command}</code>
      <button
        type="button"
        className="install-command__copy"
        onClick={handleCopy}
        aria-label={copied ? t.copied : t.copy}
        title={copied ? t.copied : t.copy}
      >
        {copied ? <Check size={16} strokeWidth={1.75} /> : <Copy size={16} strokeWidth={1.75} />}
      </button>
    </div>
  );
}
