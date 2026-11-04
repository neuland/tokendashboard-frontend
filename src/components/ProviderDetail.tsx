import { useEffect, useMemo, useState, type JSX, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { ProviderUsage, Provider } from '~/lib/types';
import { fetchProviderUsage, ACTIVE_PROVIDERS } from '~/lib/api';
import type { RangeSelection } from '~/lib/range';
import { loadSelection, persistSelection, resolveRange, withRangeParams } from '~/lib/range';
import { useUsageSeries } from '~/lib/useUsageSeries';
import type { View } from '~/lib/seriesChartData';
import { sortedModelFamilies } from '~/lib/seriesChartData';
import { pagePath } from '~/lib/paths';
import { dict, type Locale } from '~/i18n';
import DateRangePicker from './DateRangePicker';
import ChartStatus from './ChartStatus';
import EmptyRangeNotice from './EmptyRangeNotice';
import PageBar from './PageBar';
import ProviderHistoryCard from './ProviderHistoryCard';
import KpiList from './KpiList';
import TokenTypeList from './TokenTypeList';
import PluginCard from './PluginCard';
import ModelTable from './ModelTable';
import ProviderGlyph from './ProviderGlyph';

const BASE = import.meta.env.BASE_URL;

type State =
  | { status: 'loading' }
  | { status: 'error'; error: unknown }
  | { status: 'notfound' }
  | { status: 'ready'; usage: ProviderUsage };

interface Props {
  provider: Provider;
  locale: Locale;
  title: string;
  lede: string;
}

/**
 * Provider page: the history and the model table on the left,
 * key figures, token types and plugin tracking on the right.
 */
export default function ProviderDetail({ provider, locale, title, lede }: Props): JSX.Element {
  const t = dict(locale);
  const [selection, setSelection] = useState<RangeSelection>(() => loadSelection());
  const [view, setView] = useState<View>('tokenType');
  const range = useMemo(() => resolveRange(selection), [selection]);

  // Every provider in `PROVIDERS` gets a static page, but only active ones have data.
  const hasData = ACTIVE_PROVIDERS.includes(provider);
  const requestKey = `${provider}|${range.from}|${range.to}`;
  const [settled, setSettled] = useState<{ key: string; state: State } | null>(null);
  let state: State;
  if (!hasData) {
    state = { status: 'notfound' };
  } else if (settled && settled.key === requestKey) {
    state = settled.state;
  } else {
    state = { status: 'loading' };
  }
  const series = useUsageSeries(range, provider);

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
        if (active) {
          setSettled({ key: requestKey, state: { status: 'error', error: err } });
        }
      });
    return () => {
      active = false;
    };
  }, [hasData, provider, range, requestKey]);

  const overviewHref = withRangeParams(pagePath(BASE, locale), selection);
  const marker = <ProviderGlyph provider={provider} size={22} />;
  const busy = state.status === 'loading';

  const pageBar = (
    <PageBar title={title} lede={lede} marker={marker} crumbs={[{ href: overviewHref, label: t.nav.companyWide }]}>
      <DateRangePicker selection={selection} range={range} onChange={setSelection} disabled={busy} locale={locale} />
    </PageBar>
  );

  const statusFrame = (content: ReactNode): JSX.Element => (
    <>
      {pageBar}
      <div className="app-card">{content}</div>
    </>
  );

  if (state.status === 'loading') {
    return statusFrame(<ChartStatus status="loading" locale={locale} />);
  }
  if (state.status === 'error') {
    return statusFrame(<ChartStatus status="error" error={state.error} locale={locale} />);
  }
  if (state.status === 'notfound') {
    return statusFrame(
      <div className="status" role="alert">
        <AlertTriangle size={22} color="#FF5A55" />
        <span className="ds-body">{t.providerDetail.notFound}</span>
      </div>,
    );
  }

  const { usage } = state;
  const hasModels = usage.modelFamilies.length > 0;

  return (
    <>
      {pageBar}

      <KpiList
        tokensInOut={usage.tokensInOut}
        totalEstimatedCo2={usage.totalEstimatedCo2}
        totalCostUsdCent={usage.totalCostUsdCent}
        scope={t.dashboard.kpisScopeModels}
        locale={locale}
      />

      <div className="app-grid">
        <div className="app-area-main">
          <ProviderHistoryCard series={series} range={range} view={view} onViewChange={setView} locale={locale} />

          {hasModels ? (
            <ModelTable
              usage={usage}
              locale={locale}
              initialColumns="compact"
              familyOrder={series.state.status === 'ready' ? sortedModelFamilies(series.state.series) : undefined}
            />
          ) : (
            <EmptyRangeNotice locale={locale} />
          )}
        </div>

        <div className="app-area-rail">
          <TokenTypeList tokens={usage.overallTokens} total={usage.overallTokensTotal} locale={locale} />
          <PluginCard activeUsers={usage.activeUsers} provider={provider} locale={locale} />
        </div>
      </div>
    </>
  );
}
