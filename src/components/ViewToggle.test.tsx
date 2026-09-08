import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import ViewToggle from './ViewToggle';
import type { View } from '~/lib/seriesChartData';
import { dict } from '~/i18n';

const VIEWS: View[] = ['tokenType', 'co2', 'cost'];

describe('ViewToggle', () => {
  it('renders one labelled button per offered view, in order', () => {
    // given
    const t = dict('de');

    // when
    const { container } = render(<ViewToggle views={VIEWS} active="co2" onChange={() => {}} locale="de" />);

    // then
    const labels = [...container.querySelectorAll('button')].map((b) => b.textContent);
    expect(labels).toEqual(VIEWS.map((v) => t.viewToggleLabels[v]));
  });

  it('marks only the active view', () => {
    // when
    const { container } = render(<ViewToggle views={VIEWS} active="co2" onChange={() => {}} locale="de" />);

    // then
    const active = [...container.querySelectorAll('button')].filter((b) =>
      b.className.includes('view-toggle__btn--active'),
    );
    expect(active).toHaveLength(1);
    expect(active[0].textContent).toBe(dict('de').viewToggleLabels.co2);
  });

  it('reports the clicked view', () => {
    // given
    const onChange = vi.fn();
    const { container } = render(<ViewToggle views={VIEWS} active="co2" onChange={onChange} locale="de" />);

    // when
    fireEvent.click(container.querySelectorAll('button')[2]);

    // then
    expect(onChange).toHaveBeenCalledExactlyOnceWith('cost');
  });

  it('groups the buttons under the localised aria label', () => {
    // given / when / then
    expect(
      render(<ViewToggle views={VIEWS} active="co2" onChange={() => {}} locale="en" />)
        .container.querySelector('[role="group"]')!
        .getAttribute('aria-label'),
    ).toBe(dict('en').viewToggle.ariaLabel);
  });
});
