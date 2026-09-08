import type { JSX } from 'react';
import { Bar } from 'recharts';
import { TOKEN_TYPES, TOKEN_TYPE_LABELS, TOKEN_TYPE_COLORS } from '~/lib/types';
import type { View } from '~/lib/seriesChartData';
import { dict, type Locale } from '~/i18n';

const CO2_COLOR = '#0EA19C';
const COST_COLOR = '#FF5A55';
const INSTALLATIONS_COLOR = '#77C4B4';
const TOKENS_PER_INSTALLATION_COLOR = '#E54D4D';

/** Cycled per model family, since how many the backend reports is not known up front. */
const MODEL_COLORS = [
  '#FF5A55',
  '#0EA19C',
  '#77C4B4',
  '#857871',
  '#FFACAA',
  '#B7DCE1',
  '#FF9A3C',
  '#E54D4D',
];

/** The bar segments for a view, keyed by the row keys `buildProviderChartData` writes. */
export function renderProviderUsageBars(view: View, families: string[], locale: Locale): JSX.Element | JSX.Element[] {
  const t = dict(locale);
  switch (view) {
    case 'tokenType':
      return (['input', 'output'] as const).map((tt) => (
        <Bar key={tt} dataKey={tt} stackId="usage" name={TOKEN_TYPE_LABELS[locale][tt]} fill={TOKEN_TYPE_COLORS[tt]} isAnimationActive={false} />
      ));
    case 'tokenTypeAll':
      return TOKEN_TYPES.map((tt) => (
        <Bar key={tt} dataKey={tt} stackId="usage" name={TOKEN_TYPE_LABELS[locale][tt]} fill={TOKEN_TYPE_COLORS[tt]} isAnimationActive={false} />
      ));
    case 'model':
      return families.map((family, i) => (
        <Bar
          key={family}
          dataKey={family}
          stackId="usage"
          name={family}
          fill={MODEL_COLORS[i % MODEL_COLORS.length]}
          isAnimationActive={false}
        />
      ));
    case 'co2':
      return <Bar dataKey="co2" name={t.usageBars.co2} fill={CO2_COLOR} isAnimationActive={false} />;
    case 'cost':
      return <Bar dataKey="cost" name={t.usageBars.cost} fill={COST_COLOR} isAnimationActive={false} />;
    case 'installations':
      return <Bar dataKey="installations" name={t.usageBars.installations} fill={INSTALLATIONS_COLOR} isAnimationActive={false} />;
    case 'tokensPerInstallation':
      return (
        <Bar
          dataKey="tokensPerInstallation"
          name={t.usageBars.tokensPerInstallation}
          fill={TOKENS_PER_INSTALLATION_COLOR}
          isAnimationActive={false}
        />
      );
  }
}
