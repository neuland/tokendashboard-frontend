import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import ForceDayToggle from './ForceDayToggle';
import { dict } from '~/i18n';

describe('ForceDayToggle', () => {
  it('reflects the checked prop and shows the localised label', () => {
    // when
    const { container } = render(<ForceDayToggle checked onChange={() => {}} locale="de" />);

    // then
    expect(container.querySelector<HTMLInputElement>('input')!.checked).toBe(true);
    expect(container.textContent).toContain(dict('de').forceDayToggle.label);
  });

  it('reports the new state when toggled on', () => {
    // given
    const onChange = vi.fn();
    const { container } = render(<ForceDayToggle checked={false} onChange={onChange} locale="de" />);

    // when
    fireEvent.click(container.querySelector('input')!);

    // then
    expect(onChange).toHaveBeenCalledExactlyOnceWith(true);
  });

  it('reports the new state when toggled off', () => {
    // given
    const onChange = vi.fn();
    const { container } = render(<ForceDayToggle checked onChange={onChange} locale="de" />);

    // when
    fireEvent.click(container.querySelector('input')!);

    // then
    expect(onChange).toHaveBeenCalledExactlyOnceWith(false);
  });
});
