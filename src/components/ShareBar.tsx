import type { JSX } from 'react';

interface Props {
  /** 0..1; anything outside is clamped. */
  fraction: number;
  color: string;
  thin?: boolean;
  /** Show the percentage next to the bar. */
  withPercent?: boolean;
  title?: string;
}

/** A proportion as a horizontal bar, used in tables and lists instead of a chart. */
export default function ShareBar({ fraction, color, thin = false, withPercent = false, title }: Props): JSX.Element {
  const clamped = Number.isFinite(fraction) ? Math.min(1, Math.max(0, fraction)) : 0;
  const pct = Math.round(clamped * 100);
  const bar = (
    <div className={`app-share${thin ? ' app-share--thin' : ''}`} title={title} aria-hidden="true">
      <div className="app-share__fill" style={{ width: `${clamped * 100}%`, background: color }} />
    </div>
  );
  if (!withPercent) {
    return bar;
  }
  return (
    <div className="app-share-cell">
      {bar}
      <span className="app-share-cell__pct">{pct} %</span>
    </div>
  );
}
