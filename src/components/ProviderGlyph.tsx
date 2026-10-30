import type { JSX } from 'react';
import type { Provider } from '~/lib/types';
import { PROVIDER_COLORS } from '~/lib/types';
import { PROVIDER_ICON_PATHS } from '~/lib/providerIcons';

interface Props {
  provider: Provider;
  size?: number;
  /** Grey instead of the provider colour, for a provider without data. */
  muted?: boolean;
}

/** The provider's logo in its colour, decorative next to the provider's name. */
export default function ProviderGlyph({ provider, size = 16, muted = false }: Props): JSX.Element {
  return (
    <svg
      className="app-glyph"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={muted ? 'var(--neuland-middle-grey)' : PROVIDER_COLORS[provider]}
      aria-hidden="true"
      data-provider={provider}
    >
      <path d={PROVIDER_ICON_PATHS[provider]} />
    </svg>
  );
}
