import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import ResolutionToggle, { canSwitchResolution } from './ResolutionToggle';
import { dict } from '~/i18n';

const t = dict('de');

// Without vitest globals nothing unmounts between cases, so a second render would
// find the first one's buttons as well.
afterEach(cleanup);

describe('ResolutionToggle', () => {
  it('presses the effective granularity, not the pinned choice', () => {
    // given — `auto` resolved to weeks for a long range

    // when
    const { getByRole } = render(<ResolutionToggle resolution="auto" granularity="week" onChange={vi.fn()} locale="de" />);

    // then
    expect(getByRole('button', { name: t.resolution.week }).getAttribute('aria-pressed')).toBe('true');
    expect(getByRole('button', { name: t.resolution.day }).getAttribute('aria-pressed')).toBe('false');
  });

  it('pins the clicked granularity', () => {
    // given
    const onChange = vi.fn();
    const { getByRole } = render(<ResolutionToggle resolution="auto" granularity="week" onChange={onChange} locale="de" />);

    // when
    fireEvent.click(getByRole('button', { name: t.resolution.day }));

    // then
    expect(onChange).toHaveBeenCalledExactlyOnceWith('day');
  });

  it('explains the automatic rule in the tooltip', () => {
    // given / when
    const { getByRole } = render(<ResolutionToggle resolution="auto" granularity="day" onChange={vi.fn()} locale="de" />);

    // then
    expect(getByRole('group', { name: t.resolution.label }).getAttribute('title')).toBe(t.resolution.autoHint);
  });

  it('is only worth showing from two weeks on', () => {
    // given / when / then — one boundary per line
    expect(canSwitchResolution(13)).toBe(false);
    expect(canSwitchResolution(14)).toBe(true);
    expect(canSwitchResolution(90)).toBe(true);
  });
});
