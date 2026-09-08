import type { JSX } from 'react';
import type { Provider } from '~/lib/types';
import { PROVIDER_SHORT_LABELS } from '~/lib/types';
import { ACTIVE_PROVIDERS } from '~/lib/api';
import { dict, type Locale } from '~/i18n';

interface Props {
  selected: Provider[];
  onChange: (providers: Provider[]) => void;
  disabled?: boolean;
  locale: Locale;
}

// Picks the providers the home page history aggregates. The last active provider cannot
// be switched off, which would leave the chart empty.
export default function ProviderFilter({ selected, onChange, disabled, locale }: Props): JSX.Element | null {
  const t = dict(locale);
  if (ACTIVE_PROVIDERS.length < 2) {
    return null;
  }

  const toggle = (provider: Provider) => {
    const isActive = selected.includes(provider);
    if (isActive && selected.length === 1) {
      return;
    }
    onChange(isActive ? selected.filter((p) => p !== provider) : [...selected, provider]);
  };

  return (
    <div className="view-toggle" role="group" aria-label={t.providerFilter.ariaLabel}>
      {ACTIVE_PROVIDERS.map((provider) => {
        const active = selected.includes(provider);
        return (
          <button
            key={provider}
            type="button"
            className={`view-toggle__btn${active ? ' view-toggle__btn--active' : ''}`}
            aria-pressed={active}
            disabled={disabled}
            onClick={() => toggle(provider)}
          >
            {PROVIDER_SHORT_LABELS[locale][provider]}
          </button>
        );
      })}
    </div>
  );
}
