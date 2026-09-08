import { useEffect, useMemo, useState, type JSX } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { Provider, UsageOverview } from '~/lib/types';
import type { RangeSelection } from '~/lib/range';
import { loadSelection, persistSelection, resolveRange } from '~/lib/range';
import { loadProviderSelection, persistProviderSelection } from '~/lib/providerSelection';
import { ACTIVE_PROVIDERS, fetchUsageOverview } from '~/lib/api';
import { dict, type Locale } from '~/i18n';
import { errorDetail } from '~/lib/errors';
import DateRangePicker from './DateRangePicker';
import KpiCards from './KpiCards';
import ProviderComparison from './ProviderComparison';
import EmptyRangeNotice from './EmptyRangeNotice';
import HomeUsageSeriesChart from './HomeUsageSeriesChart';

type State =
  | { status: 'loading' }
  | { status: 'error'; error: unknown }
  | { status: 'ready'; data: UsageOverview };

export default function Dashboard({ locale }: { locale: Locale }): JSX.Element {
  const t = dict(locale);
  const [selection, setSelection] = useState<RangeSelection>(() => loadSelection());
  const [selectedProviders, setSelectedProviders] = useState<Provider[]>(() => loadProviderSelection());
  // Memoised so this component's fetch effect and the chart's own hook both see a
  // stable object. A preset therefore stays pinned to the day it was resolved on.
  const range = useMemo(() => resolveRange(selection), [selection]);
  const rangeKey = `${range.from}|${range.to}`;
  // Which range the settled result belongs to. `loading` is derived from a stale key
  // instead of set inside the effect, so a new range renders as loading in the same
  // pass rather than one render later.
  const [settled, setSettled] = useState<{ key: string; state: State } | null>(null);
  const state: State = settled && settled.key === rangeKey ? settled.state : { status: 'loading' };

  useEffect(() => {
    persistSelection(selection);
  }, [selection]);

  useEffect(() => {
    persistProviderSelection(selectedProviders);
  }, [selectedProviders]);

  useEffect(() => {
    let active = true;
    fetchUsageOverview(range)
      .then((data) => {
        if (active) {
          setSettled({ key: rangeKey, state: { status: 'ready', data } });
        }
      })
      .catch((err: unknown) => {
        if (!active) {
          return;
        }
        setSettled({
          key: rangeKey,
          state: {
            status: 'error',
            error: err,
          },
        });
      });
    return () => {
      active = false;
    };
  }, [range, rangeKey]);

  let body;
  if (state.status === 'loading') {
    body = (
      <div className="status">
        <span className="spinner" aria-hidden="true" />
        <span className="ds-body">{t.common.loading}</span>
      </div>
    );
  } else if (state.status === 'error') {
    body = (
      <div className="status" role="alert">
        <AlertTriangle size={22} color="#FF5A55" />
        <span className="ds-body">{t.common.loadFailed(errorDetail(state.error, locale))}</span>
      </div>
    );
  } else {
    const hasProviderData = state.data.tokensInOut > 0;
    body = (
      <>
        <KpiCards overview={state.data} locale={locale} />

        <HomeUsageSeriesChart
          range={range}
          selectedProviders={selectedProviders}
          onSelectedProvidersChange={ACTIVE_PROVIDERS.length > 1 ? setSelectedProviders : undefined}
          locale={locale}
        />

        {hasProviderData ? (
          <>
            <h2 className="ds-h2 section-title">{t.dashboard.usageByProvider}</h2>
            <ProviderComparison overview={state.data} selection={selection} locale={locale} />
          </>
        ) : (
          <EmptyRangeNotice locale={locale} />
        )}
      </>
    );
  }

  return (
    <>
      <div className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
        <h2 className="ds-h2">{t.dashboard.companyTotals}</h2>
        <DateRangePicker selection={selection} range={range} onChange={setSelection} disabled={state.status === 'loading'} locale={locale} />
      </div>

      {body}
    </>
  );
}
