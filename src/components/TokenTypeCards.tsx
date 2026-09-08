import { ArrowDownToLine, ArrowUpFromLine, DatabaseZap, Database } from 'lucide-react';
import type { JSX, ReactNode } from 'react';
import type { TokenCounts, TokenType } from '~/lib/types';
import { TOKEN_TYPES, TOKEN_TYPE_LABELS } from '~/lib/types';
import { formatTokens, formatNumber } from '~/lib/format';
import { dict, type Locale } from '~/i18n';
import KpiCard from './KpiCard';

const TYPE_ICONS: Record<TokenType, ReactNode> = {
  input: <ArrowDownToLine size={20} strokeWidth={1.75} />,
  output: <ArrowUpFromLine size={20} strokeWidth={1.75} />,
  cacheWrite: <DatabaseZap size={20} strokeWidth={1.75} />,
  cacheRead: <Database size={20} strokeWidth={1.75} />,
};

export default function TokenTypeCards({ tokens, locale }: { tokens: TokenCounts; locale: Locale }): JSX.Element {
  const t = dict(locale);
  return (
    <div className="kpi-grid">
      {TOKEN_TYPES.map((tt) => {
        const f = formatTokens(tokens[tt], locale);
        return (
          <KpiCard
            key={tt}
            label={TOKEN_TYPE_LABELS[locale][tt]}
            value={f.value}
            unit={f.unit ? `${f.unit} ${t.common.tokensLabel}` : t.common.tokensLabel}
            icon={TYPE_ICONS[tt]}
            title={formatNumber(tokens[tt], locale)}
          />
        );
      })}
    </div>
  );
}
