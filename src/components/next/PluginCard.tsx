import { useState, type JSX } from 'react';
import type { Provider } from '~/lib/types';
import { providerPlugin } from '~/lib/plugins';
import { formatNumber } from '~/lib/format';
import { dict, type Locale } from '~/i18n';
import { FaqAsterisk } from '~/components/FaqAsterisk';
import InstallCommand from '~/components/InstallCommand';
import SectionCard from './SectionCard';

interface Props {
  activeUsers: number;
  provider: Provider;
  locale: Locale;
}

/**
 * Active plugin installations at the end of the right-hand column. The install command
 * is long and rarely needed, so it unfolds behind a button.
 */
export default function PluginCard({ activeUsers, provider, locale }: Props): JSX.Element {
  const t = dict(locale);
  const plugin = providerPlugin(provider, locale);
  const [showInstall, setShowInstall] = useState(false);
  return (
    <SectionCard title={t.next.pluginTracking} aside={t.next.pluginWindow} soft headingId="nx-plugin">
      <div className="nx-stack">
        <div>
          <span className="nx-big">{formatNumber(activeUsers, locale)}</span>
          <span>
            {t.next.activeInstallations}
            <FaqAsterisk kind="privacy" locale={locale} />
          </span>
        </div>
        <p className="ds-small" style={{ margin: 0 }}>
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
        {plugin && (
          <button type="button" className="nx-button nx-button--quiet" aria-expanded={showInstall} onClick={() => setShowInstall((v) => !v)}>
            {t.next.installButton}
          </button>
        )}
        {plugin && showInstall && <InstallCommand provider={provider} locale={locale} mode="install" />}
      </div>
    </SectionCard>
  );
}
