import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import ProviderFilter from './ProviderFilter';
import { ACTIVE_PROVIDERS } from '~/lib/api';
import { PROVIDER_SHORT_LABELS, type Provider } from '~/lib/types';
import { dict } from '~/i18n';

vi.mock('~/lib/api');

const allProviders = [...ACTIVE_PROVIDERS];

afterEach(() => {
  ACTIVE_PROVIDERS.splice(0, ACTIVE_PROVIDERS.length, ...allProviders);
});

describe('ProviderFilter', () => {
  it('renders one button per active provider, marking the selected ones', () => {
    // given
    const selected: Provider[] = ['claude', 'copilot'];

    // when
    const { container } = render(<ProviderFilter selected={selected} onChange={() => {}} locale="de" />);

    // then
    const buttons = [...container.querySelectorAll('button')];
    expect(buttons.map((b) => b.textContent)).toEqual(ACTIVE_PROVIDERS.map((p) => PROVIDER_SHORT_LABELS.de[p]));
    expect(buttons.map((b) => b.getAttribute('aria-pressed'))).toEqual(
      ACTIVE_PROVIDERS.map((p) => String(selected.includes(p))),
    );
  });

  it('switches a selected provider off', () => {
    // given
    const onChange = vi.fn();
    const { container } = render(
      <ProviderFilter selected={['claude', 'copilot']} onChange={onChange} locale="de" />,
    );

    // when
    fireEvent.click(container.querySelectorAll('button')[0]);

    // then
    expect(onChange).toHaveBeenCalledExactlyOnceWith(['copilot']);
  });

  it('appends a deselected provider, keeping the existing order', () => {
    // given
    const onChange = vi.fn();
    const { container } = render(<ProviderFilter selected={['copilot']} onChange={onChange} locale="de" />);

    // when
    fireEvent.click(container.querySelectorAll('button')[0]);

    // then
    expect(onChange).toHaveBeenCalledExactlyOnceWith(['copilot', 'claude']);
  });

  it('refuses to switch off the last remaining provider, which would empty the chart', () => {
    // given
    const onChange = vi.fn();
    const { container } = render(<ProviderFilter selected={['claude']} onChange={onChange} locale="de" />);

    // when
    fireEvent.click(container.querySelectorAll('button')[0]);

    // then
    expect(onChange).not.toHaveBeenCalled();
  });

  it('still allows switching a different provider on when only one is selected', () => {
    // given
    const onChange = vi.fn();
    const { container } = render(<ProviderFilter selected={['claude']} onChange={onChange} locale="de" />);

    // when
    fireEvent.click(container.querySelectorAll('button')[1]);

    // then
    expect(onChange).toHaveBeenCalledExactlyOnceWith(['claude', 'copilot']);
  });

  it('disables every button when disabled', () => {
    // given / when / then
    expect(
      [...render(<ProviderFilter selected={['claude']} onChange={() => {}} disabled locale="de" />)
        .container.querySelectorAll('button')].every((b) => b.disabled),
    ).toBe(true);
  });

  it('renders nothing when there is only one provider to choose from', () => {
    // given
    ACTIVE_PROVIDERS.splice(1);

    // when
    const { container } = render(<ProviderFilter selected={['claude']} onChange={() => {}} locale="de" />);

    // then
    expect(container.innerHTML).toBe('');
  });

  it('groups the buttons under the localised aria label', () => {
    // given / when / then
    expect(
      render(<ProviderFilter selected={['claude']} onChange={() => {}} locale="en" />)
        .container.querySelector('[role="group"]')!
        .getAttribute('aria-label'),
    ).toBe(dict('en').providerFilter.ariaLabel);
  });
});
