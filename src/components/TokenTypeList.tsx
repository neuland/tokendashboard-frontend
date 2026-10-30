import type { JSX } from 'react';
import type { TokenCounts, TokenType } from '~/lib/types';
import { TOKEN_TYPE_LABELS, TOKEN_TYPE_COLORS } from '~/lib/types';
import { formatNumber, formatTokens } from '~/lib/format';
import { dict, type Locale } from '~/i18n';
import SectionCard from './SectionCard';
import CacheBadge from './CacheBadge';
import ShareBar from './ShareBar';

interface Props {
  tokens: TokenCounts;
  /** All four types together, shown in the card head. */
  total: number;
  locale: Locale;
}

/**
 * In/Out and the two cache types as two pairs, each bar measured against its own pair.
 * Against one shared total, cache reads (often a hundred times the rest) would flatten the
 * other three bars to nothing; the pair sums keep the size difference readable as numbers.
 * The split matches the key figures, which count In + Out without cache.
 */
const GROUPS: { key: 'inOut' | 'cache'; types: TokenType[] }[] = [
  { key: 'inOut', types: ['input', 'output'] },
  { key: 'cache', types: ['cacheWrite', 'cacheRead'] },
];

/** The four token types in two pairs, for the right-hand column. */
export default function TokenTypeList({ tokens, total, locale }: Props): JSX.Element {
  const t = dict(locale);
  const amount = (n: number): string => {
    const f = formatTokens(n, locale);
    return `${f.value} ${f.unit || t.common.tokensLabel}`;
  };
  return (
    <SectionCard title={t.dashboard.tokenTypes} aside={<><span className="app-num" title={formatNumber(total, locale)}>{amount(total)}</span><CacheBadge locale={locale} /></>} headingId="app-token-types">
      {GROUPS.map((group) => {
        const sum = group.types.reduce((acc, tt) => acc + tokens[tt], 0);
        return (
          <div className="app-tgroup" key={group.key}>
            <div className="app-tgroup__head">
              <span>{t.dashboard.tokenGroups[group.key]}</span>
              <span className="app-num" title={formatNumber(sum, locale)}>{amount(sum)}</span>
            </div>
            <div className="app-tgroup__rows">
              {group.types.map((tt) => (
                <div className="app-trow" key={tt}>
                  <div className="app-trow__line">
                    <span>{TOKEN_TYPE_LABELS[locale][tt]}</span>
                    <span className="app-num" title={formatNumber(tokens[tt], locale)}>{amount(tokens[tt])}</span>
                  </div>
                  <ShareBar fraction={sum > 0 ? tokens[tt] / sum : 0} color={TOKEN_TYPE_COLORS[tt]} thin />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </SectionCard>
  );
}
