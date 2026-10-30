import type { JSX, ReactNode } from 'react';

interface Props {
  title: ReactNode;
  /** Right-hand side of the card head: a note, a toggle, a link. */
  aside?: ReactNode;
  /** `flush` drops the body padding, for tables that run edge to edge. */
  flush?: boolean;
  soft?: boolean;
  foot?: ReactNode;
  children: ReactNode;
  headingId?: string;
}

/** A titled card; every section of a page is one of these. */
export default function SectionCard({ title, aside, flush = false, soft = false, foot, children, headingId }: Props): JSX.Element {
  return (
    <section className={`nx-card${soft ? ' nx-card--soft' : ''}`} aria-labelledby={headingId}>
      <div className="nx-card__head">
        <h2 className="nx-card__title" id={headingId}>{title}</h2>
        {aside && <div className="nx-card__aside">{aside}</div>}
      </div>
      <div className={`nx-card__body${flush ? ' nx-card__body--flush' : ''}`}>{children}</div>
      {foot && <div className="nx-card__foot">{foot}</div>}
    </section>
  );
}
