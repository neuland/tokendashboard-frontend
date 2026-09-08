import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import EmptyRangeNotice from './EmptyRangeNotice';
import { dict } from '~/i18n';

describe('EmptyRangeNotice', () => {
  it('announces the empty-period message as an alert', () => {
    // when
    const { container } = render(<EmptyRangeNotice locale="de" />);

    // then
    const alert = container.querySelector('[role="alert"]')!;
    expect(alert.textContent).toContain(dict('de').emptyRangeNotice.message);
  });

  it('uses the English copy for en', () => {
    // given / when / then
    expect(render(<EmptyRangeNotice locale="en" />).container.textContent).toContain(
      dict('en').emptyRangeNotice.message,
    );
  });
});
