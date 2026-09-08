import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import KpiCard from './KpiCard';

const base = { label: 'Tokens', value: '1,2', unit: 'Mio.', icon: <svg /> };

describe('KpiCard', () => {
  it('renders label, value and unit', () => {
    // when
    const { container } = render(<KpiCard {...base} />);

    // then
    expect(container.querySelector('.kpi-card__label')!.textContent).toBe('Tokens');
    expect(container.querySelector('.kpi-card__value')!.textContent).toBe('1,2');
    expect(container.querySelector('.kpi-card__unit')!.textContent).toBe('Mio.');
  });

  it('maps the variant onto a modifier class', () => {
    // given / when / then — one variant per line
    expect(render(<KpiCard {...base} />).container.firstElementChild!.className).toBe('card kpi-card');
    expect(render(<KpiCard {...base} variant="accent" />).container.firstElementChild!.className).toBe('card kpi-card kpi-card--accent');
    expect(render(<KpiCard {...base} variant="teal" />).container.firstElementChild!.className).toBe('card kpi-card kpi-card--teal');
  });

  it('omits the unit element when the unit is empty', () => {
    // given / when / then
    expect(render(<KpiCard {...base} unit="" />).container.querySelector('.kpi-card__unit')).toBeNull();
  });

  it('omits the subtitle unless one is given', () => {
    // given / when / then — absent, then present
    expect(render(<KpiCard {...base} />).container.querySelector('.kpi-card__sub')).toBeNull();
    expect(render(<KpiCard {...base} sub="over 3 providers" />).container.querySelector('.kpi-card__sub')!.textContent).toBe('over 3 providers');
  });

  it('passes the title through as the hover tooltip', () => {
    // given / when / then
    expect(render(<KpiCard {...base} title="1234567" />).container.firstElementChild!.getAttribute('title')).toBe('1234567');
  });
});
