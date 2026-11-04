import { Fragment, useState, type JSX } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { ProviderUsage, TokenCounts, TokenType } from '~/lib/types';
import { TOKEN_TYPE_LABELS, usdCentToUsd } from '~/lib/types';
import { tokensInOut, tokensTotal } from '~/lib/api';
import { formatNumber, formatTokensAdaptive, formatCo2, formatUsd } from '~/lib/format';
import { dict, type Locale } from '~/i18n';
import { FaqAsterisk } from './FaqAsterisk';
import { modelFamilyColors, rankFamiliesByInOut, versionColor } from '~/lib/modelColors';
import SectionCard from './SectionCard';
import ShareBar from './ShareBar';
import CacheBadge from './CacheBadge';

export type ModelColumns = 'compact' | 'all';

/** A token column: one token type, the In + Out sum, or the sum including cache. */
type TokenColumn = TokenType | 'inOut' | 'inclCache';

/**
 * Compact is In + Out only, like every other token figure on the page. All token types
 * lists the four types, then both sums side by side: In + Out, and the total including
 * cache, the only column carrying the cache badge.
 */
const TOKEN_COLUMNS: Record<ModelColumns, TokenColumn[]> = {
  compact: ['inOut'],
  all: ['input', 'output', 'cacheWrite', 'cacheRead', 'inOut', 'inclCache'],
};

function columnValue(tokens: TokenCounts, column: TokenColumn): number {
  if (column === 'inOut') {
    return tokensInOut(tokens);
  }
  if (column === 'inclCache') {
    return tokensTotal(tokens);
  }
  return tokens[column];
}

interface Props {
  usage: ProviderUsage;
  locale: Locale;
  /** Which columns to start with; the user can switch. */
  initialColumns?: ModelColumns;
  /**
   * The families in the order the history chart ranks them, so each bar takes the same
   * colour as that family in the chart's `model` view. Without it the ranking is computed
   * from `usage`, which matches the chart for the same range.
   */
  familyOrder?: string[];
}

/* Sized so the compact view (model, share, In + Out tokens, CO₂, cost = 606px) fits the main
   column at 1280px without scrolling; token counts are abbreviated ("133,9 Mio."),
   CO₂ and cost carry their unit and need more room. */
const MODEL_COL_WIDTH = 136;
const SHARE_COL_WIDTH = 80;
const TOKEN_COL_WIDTH = 116;
/* The two sums have the longest heads: `inOut` (the `totalTokens` label plus its FAQ mark)
   and `inclCache` (the cache badge) */
const IN_OUT_COL_WIDTH = 128;
const CACHE_SUM_COL_WIDTH = 132;
const CO2_COL_WIDTH = 130;
const COST_COL_WIDTH = 132;

/** Table cell token count: abbreviated above 1 million, exact value on hover. */
function tokenCell(value: number, locale: Locale): JSX.Element {
  const f = formatTokensAdaptive(value, locale);
  return <span title={formatNumber(value, locale)}>{f.unit ? `${f.value} ${f.unit}` : f.value}</span>;
}

/**
 * Usage per model family, full width. "Compact" shows share, In + Out tokens, CO₂ and cost;
 * "all token types" adds the four token types and the total including cache. Shares are
 * In + Out, matching the key figures and the history chart's `model` view. A family with
 * several model versions expands into one indented row per version.
 */
export default function ModelTable({ usage, locale, initialColumns = 'all', familyOrder }: Props): JSX.Element {
  const t = dict(locale);
  const [columns, setColumns] = useState<ModelColumns>(initialColumns);
  const colors = modelFamilyColors(familyOrder ?? rankFamiliesByInOut(usage.modelFamilies));
  // A family the chart has not ranked (no in/out tokens in the series) still gets a colour.
  const colorOf = (family: string): string => colors[family] ?? 'var(--neuland-middle-grey)';
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const tokenColumns = TOKEN_COLUMNS[columns];
  // Fixed layout: the widths come from the <colgroup>, not from the content, so
  // expanding a family (longer, indented model names) never shifts a column.
  const columnWidth = (c: TokenColumn): number => (c === 'inOut' ? IN_OUT_COL_WIDTH : c === 'inclCache' ? CACHE_SUM_COL_WIDTH : TOKEN_COL_WIDTH);
  const minWidth = MODEL_COL_WIDTH + SHARE_COL_WIDTH + tokenColumns.reduce((sum, c) => sum + columnWidth(c), 0) + CO2_COL_WIDTH + COST_COL_WIDTH;
  const grand = usage.tokensInOut;
  const share = (tokens: TokenCounts): number => (grand > 0 ? tokensInOut(tokens) / grand : 0);
  const totalCo2 = formatCo2(usage.totalEstimatedCo2, locale);
  const totalCost = formatUsd(usdCentToUsd(usage.totalCostUsdCent), locale);

  const toggle = (family: string): void => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(family)) {
        next.delete(family);
      } else {
        next.add(family);
      }
      return next;
    });
  };

  const columnSwitch = (
    <>
      <span className="app-eyebrow">{t.dashboard.columns}</span>
      <div className="app-seg" role="group" aria-label={t.dashboard.columns}>
        <button type="button" className="app-seg__btn" aria-pressed={columns === 'compact'} onClick={() => setColumns('compact')}>
          {t.dashboard.columnsCompact}
        </button>
        <button type="button" className="app-seg__btn" aria-pressed={columns === 'all'} onClick={() => setColumns('all')}>
          {t.dashboard.columnsAll}
        </button>
      </div>
    </>
  );

  return (
    <SectionCard
      title={<>{t.dashboard.models} <span className="app-card__aside">{t.dashboard.modelsNote}</span></>}
      aside={columnSwitch}
      flush
      headingId="app-models"
    >
      <div className="app-scroll">
        <table className="app-table app-table--fixed app-table--tight" data-columns={columns} style={{ minWidth }}>
          <colgroup>
            <col style={{ width: MODEL_COL_WIDTH }} />
            <col style={{ width: SHARE_COL_WIDTH }} />
            {tokenColumns.map((c) => (
              <col key={c} style={{ width: columnWidth(c) }} />
            ))}
            <col style={{ width: CO2_COL_WIDTH }} />
            <col style={{ width: COST_COL_WIDTH }} />
          </colgroup>
          <thead>
            <tr>
              <th className="app-sticky">{t.providerDetail.modelColumn}</th>
              <th>{t.dashboard.share}</th>
              {tokenColumns.map((c) => (
                <th key={c} className="num">
                  {c === 'inOut' ? <span className="app-head-mark">{t.kpiSummaryRow.totalTokens}<FaqAsterisk kind="tokens" locale={locale} /></span> : c === 'inclCache' ? <CacheBadge locale={locale} /> : TOKEN_TYPE_LABELS[locale][c]}
                </th>
              ))}
              <th className="num"><span className="app-head-mark">{t.usageBars.co2}<FaqAsterisk kind="co2" locale={locale} /></span></th>
              <th className="num"><span className="app-head-mark">{t.common.costColumn}<FaqAsterisk kind="cost" locale={locale} /></span></th>
            </tr>
          </thead>
          <tbody>
            {usage.modelFamilies.map((f) => {
              const co2 = formatCo2(f.estimatedCo2, locale);
              const cost = formatUsd(usdCentToUsd(f.costUsdCent), locale);
              const isOpen = expanded.has(f.modelFamily);
              const expandable = f.models.length > 1;
              return (
                <Fragment key={f.modelFamily}>
                  <tr>
                    <td className="app-sticky">
                      {expandable ? (
                        <button
                          type="button"
                          className="app-family-toggle"
                          onClick={() => toggle(f.modelFamily)}
                          aria-expanded={isOpen}
                          aria-label={`${f.modelFamily}: ${isOpen ? t.dashboard.collapseFamily : t.dashboard.expandFamily}`}
                        >
                          {isOpen ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
                          {f.modelFamily}
                        </button>
                      ) : (
                        f.modelFamily
                      )}
                    </td>
                    <td><ShareBar fraction={share(f.tokens)} color={colorOf(f.modelFamily)} title={`${Math.round(share(f.tokens) * 100)} %`} /></td>
                    {tokenColumns.map((c) => (
                      <td key={c} className="num">{tokenCell(columnValue(f.tokens, c), locale)}</td>
                    ))}
                    <td className="num">{co2.value} {co2.unit}</td>
                    <td className="num">{cost.value} {cost.unit}</td>
                  </tr>
                  {isOpen &&
                    f.models.map((m) => {
                      const mCo2 = formatCo2(m.estimatedCo2, locale);
                      const mCost = formatUsd(usdCentToUsd(m.costUsdCent), locale);
                      return (
                        <tr key={m.model} className="app-sub">
                          <td className="app-sticky" title={m.model}>{m.model}</td>
                          <td><ShareBar fraction={share(m.tokens)} color={versionColor(colorOf(f.modelFamily))} thin title={`${Math.round(share(m.tokens) * 100)} %`} /></td>
                          {tokenColumns.map((c) => (
                            <td key={c} className="num">{tokenCell(columnValue(m.tokens, c), locale)}</td>
                          ))}
                          <td className="num">{mCo2.value} {mCo2.unit}</td>
                          <td className="num">{mCost.value} {mCost.unit}</td>
                        </tr>
                      );
                    })}
                </Fragment>
              );
            })}
            <tr className="app-total">
              <td className="app-sticky">{t.common.sum}</td>
              <td></td>
              {tokenColumns.map((c) => (
                <td key={c} className="num">{tokenCell(columnValue(usage.overallTokens, c), locale)}</td>
              ))}
              <td className="num">{totalCo2.value} {totalCo2.unit}</td>
              <td className="num">{totalCost.value} {totalCost.unit}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
