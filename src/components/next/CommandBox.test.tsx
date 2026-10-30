import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import CommandBox from './CommandBox';
import { dict } from '~/i18n';

const t = dict('de').installCommand;
const writeText = vi.fn<(text: string) => Promise<void>>();

beforeEach(() => {
  writeText.mockReset().mockResolvedValue(undefined);
  // jsdom ships no clipboard.
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('CommandBox', () => {
  it('shows the command as code with a copy button', () => {
    // given
    const command = 'node ~/.claude/tokendashboard-plugin/local-server.js status';

    // when
    const { container, getByRole } = render(<CommandBox command={command} locale="de" />);

    // then
    expect(container.querySelector('.nx-cmd code')?.textContent).toBe(command);
    expect(getByRole('button', { name: t.copy })).not.toBeNull();
  });

  it('copies the command and confirms for two seconds', async () => {
    // given
    vi.useFakeTimers();
    const command = 'node ~/.claude/tokendashboard-plugin/local-server.js stop';
    const { getByRole } = render(<CommandBox command={command} locale="de" />);

    // when
    await act(async () => {
      fireEvent.click(getByRole('button', { name: t.copy }));
    });

    // then
    expect(writeText).toHaveBeenCalledWith(command);
    expect(getByRole('button', { name: t.copied })).not.toBeNull();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(getByRole('button', { name: t.copy })).not.toBeNull();
  });
});
