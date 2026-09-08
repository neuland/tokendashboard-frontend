import { Fragment, useEffect, useMemo, useState } from 'react';
import type { JSX, ReactNode } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { AlertTriangle, ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';
import type { ProviderUsage, Provider } from '~/lib/types';
import {
  TOKEN_TYPES,
  TOKEN_TYPE_LABELS,
  TOKEN_TYPE_COLORS,
  usdCentToUsd,
} from '~/lib/types';
import { fetchProviderUsage, ACTIVE_PROVIDERS } from '~/lib/api';
import { formatNumber, formatTokens, formatTokensAdaptive, formatCo2, formatUsd } from '~/lib/format';
import type { RangeSelection } from '~/lib/range';
import { loadSelection, persistSelection, resolveRange, withRangeParams } from '~/lib/range';
import { dict, type Locale } from '~/i18n';
import { errorDetail } from '~/lib/errors';
import DateRangePicker from './DateRangePicker';
import KpiSummaryRow from './KpiSummaryRow';
import TokenTypeCards from './TokenTypeCards';
import { FaqAsterisk } from './FaqAsterisk';
import PluginPanel from './PluginPanel';
import EmptyRangeNotice from './EmptyRangeNotice';
import ProviderUsageSeriesChart from './ProviderUsageSeriesChart';

type State =
  | { status: 'loading' }
  | { status: 'error'; error: unknown }
  | { status: 'notfound' }
  | { status: 'ready'; usage: ProviderUsage };

/** Table cell token count: abbreviated above 1 million, exact value on hover. */
function tokenCellContent(value: number, locale: Locale) {
  const f = formatTokensAdaptive(value, locale);
  const text = f.unit ? `${f.value} ${f.unit}` : f.value;
  return <span title={formatNumber(value, locale)}>{text}</span>;
}

interface ModelChartRow {
  model: string;
  input: number;
  output: number;
  cacheWrite: number;
  cacheRead: number;
}

export default function ProviderDetail({ provider, locale }: { provider: Provider; locale: Locale }): JSX.Element {
  const tr = dict(locale);
  const [selection, setSelection] = useState<RangeSelection>(() => loadSelection());
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(new Set());
  const toggleFamily = (modelFamily: string) => {
    setExpandedFamilies((prev) => {
      const next = new Set(prev);
      if (next.has(modelFamily)) {
        next.delete(modelFamily);
      } else {
        next.add(modelFamily);
      }
      return next;
    });
  };
  // Memoised so this component's fetch effect and the chart's own hook both see a
  // stable object. A preset therefore stays pinned to the day it was resolved on.
  const range = useMemo(() => resolveRange(selection), [selection]);

  // Every provider in `PROVIDERS` gets a static page, but only active ones have data.
  // A pure derivation from the props, so it belongs in render rather than an effect.
  const hasData = ACTIVE_PROVIDERS.includes(provider);
  const requestKey = `${provider}|${range.from}|${range.to}`;
  // Which request the settled result belongs to. `loading` is derived from a stale key
  // instead of set inside the effect, so a new range renders as loading in the same
  // pass rather than one render later.
  const [settled, setSettled] = useState<{ key: string; state: State } | null>(null);
  let state: State;
  if (!hasData) {
    state = { status: 'notfound' };
  } else if (settled && settled.key === requestKey) {
    state = settled.state;
  } else {
    state = { status: 'loading' };
  }

  useEffect(() => {
    persistSelection(selection);
  }, [selection]);

  useEffect(() => {
    if (!hasData) {
      return;
    }
    let active = true;
    fetchProviderUsage(provider, range)
      .then((usage) => {
        if (active) {
          setSettled({ key: requestKey, state: { status: 'ready', usage } });
        }
      })
      .catch((err: unknown) => {
        if (!active) {
          return;
        }
        setSettled({
          key: requestKey,
          state: {
            status: 'error',
            error: err,
          },
        });
      });
    return () => {
      active = false;
    };
  }, [hasData, provider, range, requestKey]);

  // Carry the time window along, so the overview keeps showing the same period.
  const overviewHref = locale === 'de' ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}en/`;
  const backLink = (
    <a className="back-link" href={withRangeParams(overviewHref, selection)}>
      <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" /> {tr.providerDetail.backToOverview}
    </a>
  );

  const picker = <DateRangePicker selection={selection} range={range} onChange={setSelection} disabled={state.status === 'loading'} locale={locale} />;
  const pickerBar = <div className="picker-row">{picker}</div>;

  // Loading, error and not-found states keep the back link and picker visible.
  const statusFrame = (content: ReactNode) => (
    <>
      {backLink}
      {pickerBar}
      {content}
    </>
  );

  if (state.status === 'loading') {
    return statusFrame(
      <div className="status">
        <span className="spinner" aria-hidden="true" />
        <span className="ds-body">{tr.common.loading}</span>
      </div>,
    );
  }

  if (state.status === 'error') {
    return statusFrame(
      <div className="status" role="alert">
        <AlertTriangle size={22} color="#FF5A55" />
        <span className="ds-body">{tr.common.loadFailed(errorDetail(state.error, locale))}</span>
      </div>,
    );
  }

  if (state.status === 'notfound') {
    return statusFrame(
      <div className="status" role="alert">
        <AlertTriangle size={22} color="#FF5A55" />
        <span className="ds-body">{tr.providerDetail.notFound}</span>
      </div>,
    );
  }

  const { usage } = state;
  const totals = usage.overallTokens;
  const co2Fmt = formatCo2(usage.totalEstimatedCo2, locale);
  const costFmt = formatUsd(usdCentToUsd(usage.totalCostUsdCent), locale);

  const activeUsers = usage.activeUsers;
  // Totals still render (as zeros) for an empty period; the model breakdown does not.
  const hasModels = usage.modelFamilies.length > 0;

  const chartData: ModelChartRow[] = usage.modelFamilies.map((f) => ({
    model: f.modelFamily,
    input: f.tokens.input,
    output: f.tokens.output,
    cacheWrite: f.tokens.cacheWrite,
    cacheRead: f.tokens.cacheRead,
  }));

  return (
    <>
      {backLink}

      <div className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
        <h2 className="ds-h2">{tr.providerDetail.totals}</h2>
        {picker}
      </div>

      <KpiSummaryRow
        tokensInOut={usage.tokensInOut}
        totalEstimatedCo2={usage.totalEstimatedCo2}
        totalCostUsdCent={usage.totalCostUsdCent}
        scope={tr.common.scopeModels}
        locale={locale}
      />

      <h2 className="ds-h2 section-title">{tr.providerDetail.pluginTracking}</h2>
      <PluginPanel activeUsers={activeUsers} provider={provider} locale={locale} />

      {!hasModels ? (
        <EmptyRangeNotice locale={locale} />
      ) : (
      <>
      <h2 className="ds-h2 section-title">{tr.providerDetail.byTokenType}</h2>
      <TokenTypeCards tokens={totals} locale={locale} />

      <h2 className="ds-h2 section-title">{tr.providerDetail.byModel}</h2>
      <div className="card chart-card">
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 16, right: 8, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEEBE6" vertical={false} />
              <XAxis
                dataKey="model"
                interval={0}
                tick={{ fontSize: 12, fill: '#666666', fontFamily: 'DM Sans, sans-serif' }}
                tickLine={false}
                axisLine={{ stroke: '#C5BDB6' }}
              />
              <YAxis
                tickFormatter={(v: number) => {
                  const f = formatTokens(v, locale);
                  return f.unit ? `${f.value} ${f.unit}` : f.value;
                }}
                tick={{ fontSize: 12, fill: '#666666', fontFamily: 'Fira Code, monospace' }}
                tickLine={false}
                axisLine={{ stroke: '#C5BDB6' }}
                width={88}
              />
              <Tooltip
                formatter={(value: number, name: string) => [`${formatNumber(value, locale)} ${tr.common.tokensLabel}`, name]}
                contentStyle={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 13,
                  border: '1px solid #EEEBE6',
                  borderRadius: 8,
                }}
              />
              <Legend wrapperStyle={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13 }} />
              {TOKEN_TYPES.map((tt) => (
                <Bar
                  key={tt}
                  dataKey={tt}
                  stackId="tokens"
                  name={TOKEN_TYPE_LABELS[locale][tt]}
                  fill={TOKEN_TYPE_COLORS[tt]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="table-scroll">
          <table className="ds-table" style={{ marginTop: 'var(--space-sm)' }}>
            <thead>
              <tr>
                <th>{tr.providerDetail.modelColumn}</th>
                {TOKEN_TYPES.map((tt) => (
                  <th key={tt} className="num">
                    {TOKEN_TYPE_LABELS[locale][tt]}
                  </th>
                ))}
                <th className="num">{tr.common.total}</th>
                <th className="num">{tr.common.co2Column}<FaqAsterisk kind="co2" locale={locale} /></th>
                <th className="num">{tr.common.costColumn}<FaqAsterisk kind="cost" locale={locale} /></th>
              </tr>
            </thead>
            <tbody>
              {usage.modelFamilies.map((f) => {
                const co2 = formatCo2(f.estimatedCo2, locale);
                const cost = formatUsd(usdCentToUsd(f.costUsdCent), locale);
                const expanded = expandedFamilies.has(f.modelFamily);
                const expandable = f.models.length > 1;
                return (
                  <Fragment key={f.modelFamily}>
                    <tr>
                      <td>
                        {expandable ? (
                          <button
                            type="button"
                            onClick={() => toggleFamily(f.modelFamily)}
                            aria-expanded={expanded}
                            className="model-family-toggle"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              cursor: 'pointer',
                              font: 'inherit',
                              color: 'inherit',
                            }}
                          >
                            {expanded ? (
                              <ChevronDown size={14} aria-hidden="true" />
                            ) : (
                              <ChevronRight size={14} aria-hidden="true" />
                            )}
                            {f.modelFamily}
                          </button>
                        ) : (
                          f.modelFamily
                        )}
                      </td>
                      {TOKEN_TYPES.map((tt) => (
                        <td key={tt} className="num">
                          {tokenCellContent(f.tokens[tt], locale)}
                        </td>
                      ))}
                      <td className="num">{tokenCellContent(f.tokensTotal, locale)}</td>
                      <td className="num">
                        {co2.value} {co2.unit}
                      </td>
                      <td className="num">
                        {cost.value} {cost.unit}
                      </td>
                    </tr>
                    {expanded &&
                      f.models.map((m) => {
                        const modelCo2 = formatCo2(m.estimatedCo2, locale);
                        const modelCost = formatUsd(usdCentToUsd(m.costUsdCent), locale);
                        return (
                          <tr key={m.model}>
                            <td style={{ paddingLeft: 'var(--space-lg, 24px)', color: 'var(--color-text-muted, #666666)' }}>
                              {m.model}
                            </td>
                            {TOKEN_TYPES.map((tt) => (
                              <td key={tt} className="num">
                                {tokenCellContent(m.tokens[tt], locale)}
                              </td>
                            ))}
                            <td className="num">{tokenCellContent(m.tokensTotal, locale)}</td>
                            <td className="num">
                              {modelCo2.value} {modelCo2.unit}
                            </td>
                            <td className="num">
                              {modelCost.value} {modelCost.unit}
                            </td>
                          </tr>
                        );
                      })}
                  </Fragment>
                );
              })}
              <tr>
                <td style={{ fontWeight: 600 }}>{tr.common.total}</td>
                {TOKEN_TYPES.map((tt) => (
                  <td key={tt} className="num" style={{ fontWeight: 600 }}>
                    {tokenCellContent(totals[tt], locale)}
                  </td>
                ))}
                <td className="num" style={{ fontWeight: 600 }}>
                  {tokenCellContent(usage.overallTokensTotal, locale)}
                </td>
                <td className="num" style={{ fontWeight: 600 }}>
                  {co2Fmt.value} {co2Fmt.unit}
                </td>
                <td className="num" style={{ fontWeight: 600 }}>
                  {costFmt.value} {costFmt.unit}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      <ProviderUsageSeriesChart range={range} provider={provider} locale={locale} />

    </>
  );
}
