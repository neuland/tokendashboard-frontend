import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import ChartStatus from './ChartStatus';
import { dict } from '~/i18n';
import { FetchError } from '~/lib/errors';

describe('ChartStatus', () => {
  it('shows a spinner and the loading copy while loading, without announcing an alert', () => {
    // when
    const { container } = render(<ChartStatus status="loading" locale="de" />);

    // then
    expect(container.textContent).toContain(dict('de').common.loading);
    expect(container.querySelector('.spinner')).not.toBeNull();
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it('announces an alert carrying the failure message on error', () => {
    // when
    const { container } = render(<ChartStatus status="error" error={new Error('boom')} locale="de" />);

    // then
    const alert = container.querySelector('[role="alert"]')!;
    expect(alert.textContent).toBe(dict('de').common.loadFailed('boom'));
    expect(container.querySelector('.spinner')).toBeNull();
  });

  it('localises a failed request rather than showing its English message', () => {
    // given
    const rejection = new FetchError(503);

    // when
    const { container } = render(<ChartStatus status="error" error={rejection} locale="de" />);

    // then
    expect(container.querySelector('[role="alert"]')!.textContent).toBe(
      dict('de').common.loadFailed(dict('de').common.fetchFailed(503)),
    );
  });

  it('takes the copy from the requested locale', () => {
    // when
    const { container } = render(<ChartStatus status="loading" locale="en" />);

    // then
    expect(container.textContent).toContain(dict('en').common.loading);
  });
});
