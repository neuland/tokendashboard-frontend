import type { JSX, ReactNode } from 'react';

export interface Crumb {
  href: string;
  label: string;
}

interface Props {
  title: string;
  lede?: string;
  /** Links above the title, e.g. back to the overview. The current page is not listed. */
  crumbs?: Crumb[];
  /** A small marker in front of the title, e.g. a provider colour dot. */
  marker?: ReactNode;
  /** Sits right after the title, e.g. a project's favourite star. */
  afterTitle?: ReactNode;
  /** The page's controls, right-aligned: range picker, resolution, filters. */
  children?: ReactNode;
}

/** Page head: title and lede on the left, the page's controls on the right. */
export default function PageBar({ title, lede, crumbs, marker, afterTitle, children }: Props): JSX.Element {
  return (
    <div className="nx-pagebar">
      <div>
        {crumbs && crumbs.length > 0 && (
          <div className="nx-pagebar__crumbs">
            {crumbs.map((c) => (
              <span key={c.href} style={{ margin: 0 }}>
                <a href={c.href}>{c.label}</a>
                <span aria-hidden="true">›</span>
              </span>
            ))}
          </div>
        )}
        <div className="nx-pagebar__titlerow">
          <h1 className="nx-pagebar__title">
            {marker}
            {title}
          </h1>
          {afterTitle}
        </div>
        {lede && <p className="nx-pagebar__lede">{lede}</p>}
      </div>
      {children && <div className="nx-pagebar__tools">{children}</div>}
    </div>
  );
}
