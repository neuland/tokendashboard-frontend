import type { JSX } from 'react';
import { Users, Plug } from 'lucide-react';
import { formatNumber } from '~/lib/format';
import type { Provider } from '~/lib/types';
import { providerPlugin } from '~/lib/plugins';
import { dict, type Locale } from '~/i18n';
import KpiCard from './KpiCard';
import { FaqAsterisk } from './FaqAsterisk';
import InstallCommand from './InstallCommand';

interface PluginPanelProps {
  activeUsers: number;
  provider: Provider;
  locale: Locale;
}

export default function PluginPanel({ activeUsers, provider, locale }: PluginPanelProps): JSX.Element {
  const t = dict(locale);
  const plugin = providerPlugin(provider, locale);
  return (
    <div className="plugin-grid">
      <KpiCard
        label={<>{t.pluginPanel.activeUsers}<FaqAsterisk kind="privacy" locale={locale} /></>}
        value={formatNumber(activeUsers, locale)}
        unit=""
        sub={t.pluginPanel.activeUsersSub}
        icon={<Users size={20} strokeWidth={1.75} />}
      />

      <aside className="card plugin-hint" role="note">
        <span className="plugin-hint__icon">
          <Plug size={20} strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div className="plugin-hint__body">
          <p className="ds-body plugin-hint__title">{t.pluginPanel.enableTracking}</p>
          <p className="ds-small plugin-hint__text">
            {t.pluginPanel.descriptionPrefix}{' '}
            {plugin ? (
              <a href={plugin.repoUrl} target="_blank" rel="noopener noreferrer">
                <strong>{plugin.label}</strong>
              </a>
            ) : (
              <strong>{t.pluginPanel.trackingFallback}</strong>
            )}{' '}
            {t.pluginPanel.descriptionSuffix}
          </p>
          {plugin && <InstallCommand provider={provider} locale={locale} mode="install" />}
        </div>
      </aside>
    </div>
  );
}
