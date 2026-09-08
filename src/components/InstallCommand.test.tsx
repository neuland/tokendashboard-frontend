import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';
import InstallCommand from './InstallCommand';
import { backendApiUrl, buildPluginInstallCommand, buildPluginUninstallCommand } from '~/lib/plugins';
import { dict } from '~/i18n';

vi.mock('~/lib/plugins');

const writeText = vi.fn<(text: string) => Promise<void>>();

beforeEach(() => {
  writeText.mockReset().mockResolvedValue(undefined);
  // jsdom ships no clipboard.
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.mocked(buildPluginInstallCommand).mockClear();
  vi.mocked(buildPluginUninstallCommand).mockClear();
});

describe('InstallCommand', () => {
  it('shows the install command and label in install mode', () => {
    // given
    const expected = buildPluginInstallCommand('claude', backendApiUrl());

    // when
    const { container } = render(<InstallCommand provider="claude" locale="de" mode="install" />);

    // then
    expect(container.querySelector('code')!.textContent).toBe(expected);
    expect(container.querySelector('.install-command__label')!.textContent).toBe(
      dict('de').installCommand.installLabel,
    );
  });

  it('shows the uninstall command and label in uninstall mode', () => {
    // given
    const expected = buildPluginUninstallCommand('claude');

    // when
    const { container } = render(<InstallCommand provider="claude" locale="de" mode="uninstall" />);

    // then
    expect(container.querySelector('code')!.textContent).toBe(expected);
    expect(container.querySelector('.install-command__label')!.textContent).toBe(
      dict('de').installCommand.uninstallLabel,
    );
  });

  it('copies the shown command to the clipboard', async () => {
    // given
    const { container } = render(<InstallCommand provider="copilot" locale="de" mode="install" />);
    const shown = container.querySelector('code')!.textContent;

    // when
    await act(async () => {
      fireEvent.click(container.querySelector('button')!);
    });

    // then
    expect(writeText).toHaveBeenCalledExactlyOnceWith(shown);
  });

  it('confirms the copy, then reverts the label after two seconds', async () => {
    // given
    vi.useFakeTimers();
    const t = dict('de').installCommand;
    const { container } = render(<InstallCommand provider="claude" locale="de" mode="install" />);
    const button = container.querySelector('button')!;
    expect(button.getAttribute('title')).toBe(t.copy);

    // when
    await act(async () => {
      fireEvent.click(button);
    });

    // then
    expect(button.getAttribute('title')).toBe(t.copied);
    expect(button.getAttribute('aria-label')).toBe(t.copied);

    // when — the reset timer fires
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    // then
    expect(button.getAttribute('title')).toBe(t.copy);
  });

  it('renders nothing when the provider has no plugin command', () => {
    // given
    vi.mocked(buildPluginInstallCommand).mockReturnValueOnce(undefined);

    // when
    const { container } = render(<InstallCommand provider="claude" locale="de" mode="install" />);

    // then
    expect(container.innerHTML).toBe('');
  });

  it('localises the copy affordance for en', () => {
    // given / when / then
    expect(
      render(<InstallCommand provider="claude" locale="en" mode="install" />)
        .container.querySelector('button')!
        .getAttribute('aria-label'),
    ).toBe(dict('en').installCommand.copy);
  });
});
