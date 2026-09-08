import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { FaqAsterisk } from './FaqAsterisk';
import { dict } from '~/i18n';

describe('FaqAsterisk', () => {
  it('points at the German FAQ page for de', () => {
    // given
    const mark = dict('de').faqAsterisk.co2;

    // when
    const { container } = render(<FaqAsterisk kind="co2" locale="de" />);

    // then
    const link = container.querySelector('a')!;
    expect(link.getAttribute('href')).toBe(`/faq/#${mark.id}`);
    expect(link.getAttribute('aria-label')).toBe(mark.aria);
    expect(link.textContent).toBe('*');
  });

  it('prefixes the locale segment for en', () => {
    // given
    const mark = dict('en').faqAsterisk.co2;

    // when
    const { container } = render(<FaqAsterisk kind="co2" locale="en" />);

    // then
    expect(container.querySelector('a')!.getAttribute('href')).toBe(`/en/faq/#${mark.id}`);
  });

  it('carries the question and the explanation in the tooltip', () => {
    // given
    const t = dict('de');

    // when
    const { container } = render(<FaqAsterisk kind="cost" locale="de" />);

    // then
    expect(container.querySelector('a')!.getAttribute('title')).toBe(
      `${t.faqAsterisk.cost.q} — ${t.faqAsterisk.explanation}`,
    );
  });
});
