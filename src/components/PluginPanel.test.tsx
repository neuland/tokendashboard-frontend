import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import PluginPanel from './PluginPanel';
import { providerPlugin } from '~/lib/plugins';
import { formatNumber } from '~/lib/format';
import { dict } from '~/i18n';

vi.mock('~/lib/plugins');

afterEach(() => {
  vi.mocked(providerPlugin).mockClear();
});

describe('PluginPanel', () => {
  it('shows the active-user count formatted for the locale', () => {
    // when
    const { container } = render(<PluginPanel activeUsers={1_234} provider="claude" locale="de" />);

    // then
    expect(container.querySelector('.kpi-card__value')!.textContent).toBe(formatNumber(1_234, 'de'));
    expect(container.querySelector('.kpi-card__label')!.textContent).toContain(
      dict('de').pluginPanel.activeUsers,
    );
  });

  it('links to the plugin repository, opening it safely in a new tab', () => {
    // given
    const plugin = providerPlugin('copilot', 'de')!;

    // when
    const { container } = render(<PluginPanel activeUsers={0} provider="copilot" locale="de" />);

    // then
    const link = container.querySelector('.plugin-hint__text a')!;
    expect(link.getAttribute('href')).toBe(plugin.repoUrl);
    expect(link.textContent).toBe(plugin.label);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('offers the install command when a plugin exists', () => {
    // given / when / then
    expect(
      render(<PluginPanel activeUsers={0} provider="claude" locale="de" />)
        .container.querySelector('.install-command'),
    ).not.toBeNull();
  });

  it('falls back to a generic name and drops the install command when no plugin exists', () => {
    // given
    vi.mocked(providerPlugin).mockReturnValue(undefined);

    // when
    const { container } = render(<PluginPanel activeUsers={0} provider="claude" locale="de" />);

    // then
    expect(container.querySelector('.plugin-hint__text a')).toBeNull();
    expect(container.querySelector('.plugin-hint__text')!.textContent).toContain(
      dict('de').pluginPanel.trackingFallback,
    );
    expect(container.querySelector('.install-command')).toBeNull();
  });

  it('marks the user count with the privacy footnote', () => {
    // given / when / then
    expect(
      render(<PluginPanel activeUsers={5} provider="claude" locale="de" />)
        .container.querySelector('a.footnote-mark'),
    ).not.toBeNull();
  });
});
