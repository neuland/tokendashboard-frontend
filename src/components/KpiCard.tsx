import type { JSX, ReactNode } from 'react';

export interface KpiCardProps {
  label: ReactNode;
  value: string;
  unit: string;
  sub?: string;
  icon: ReactNode;
  variant?: 'default' | 'accent' | 'teal';
  title?: string;
}

export default function KpiCard({ label, value, unit, sub, icon, variant = 'default', title }: KpiCardProps): JSX.Element {
  const cls =
    'card kpi-card' +
    (variant === 'accent' ? ' kpi-card--accent' : variant === 'teal' ? ' kpi-card--teal' : '');
  return (
    <div className={cls} title={title}>
      <div className="kpi-card__head">
        <span className="ds-small kpi-card__label">{label}</span>
        <span className="kpi-card__icon">{icon}</span>
      </div>
      <div>
        <span className="kpi-card__value">{value}</span>
        {unit && <span className="kpi-card__unit">{unit}</span>}
      </div>
      {sub && <span className="ds-small kpi-card__sub">{sub}</span>}
    </div>
  );
}
