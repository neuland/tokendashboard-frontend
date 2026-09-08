import type { JSX } from 'react';
import { Bar } from 'recharts';
import type { Provider } from '~/lib/types';
import { PROVIDER_LABELS, PROVIDER_COLORS } from '~/lib/types';
import type { Locale } from '~/i18n';

/** One stacked bar segment per provider, keyed by the row keys `buildHomeChartData` writes. */
export function renderHomeUsageBars(providers: Provider[], locale: Locale): JSX.Element[] {
  return providers.map((p) => (
    <Bar key={p} dataKey={p} stackId="usage" name={PROVIDER_LABELS[locale][p]} fill={PROVIDER_COLORS[p]} isAnimationActive={false} />
  ));
}
