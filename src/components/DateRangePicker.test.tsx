import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import DateRangePicker from './DateRangePicker';
import type { DateRange, RangeSelection } from '~/lib/range';
import { formatDateRange } from '~/lib/format';
import { dict } from '~/i18n';

const t = dict('de');

function setup(overrides: Partial<Parameters<typeof DateRangePicker>[0]> = {}) {
  const props = {
    selection: { kind: 'preset', id: 'last30' } as RangeSelection,
    range: { from: '2026-07-01', to: '2026-07-30' } as DateRange,
    onChange: vi.fn(),
    locale: 'de' as const,
    ...overrides,
  };
  return { ...render(<DateRangePicker {...props} />), props };
}

function option(container: HTMLElement, text: string) {
  return [...container.querySelectorAll<HTMLButtonElement>('button.rp__option')].find(
    (b) => b.textContent?.includes(text),
  )!;
}

function openPanel(container: HTMLElement) {
  fireEvent.click(container.querySelector('button.rp__trigger')!);
}

function inputs(container: HTMLElement) {
  return [...container.querySelectorAll<HTMLInputElement>('input.rp__input')];
}

describe('DateRangePicker trigger', () => {
  it('names the active preset and shows the resolved dates', () => {
    // when
    const { container } = setup();

    // then
    expect(container.querySelector('.rp__trigger-label')!.textContent).toBe(t.presets.last30);
    expect(container.querySelector('.rp__trigger-range')!.textContent).toBe(
      formatDateRange('2026-07-01', '2026-07-30', 'de'),
    );
  });

  it('labels a custom selection as a custom range rather than a preset', () => {
    // given
    const selection: RangeSelection = { kind: 'custom', range: { from: '2026-07-01', to: '2026-07-05' } };

    // when
    const { container } = setup({ selection });

    // then
    expect(container.querySelector('.rp__trigger-label')!.textContent).toBe(t.dateRangePicker.customRange);
  });

  it('stays closed until the trigger is clicked', () => {
    // given
    const { container } = setup();
    expect(container.querySelector('[role="dialog"]')).toBeNull();

    // when
    openPanel(container);

    // then
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
  });
});

describe('DateRangePicker dismissal', () => {
  it('closes on an outside mousedown', () => {
    // given
    const { container } = setup();
    openPanel(container);

    // when
    fireEvent.mouseDown(document.body);

    // then
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('stays open on a mousedown inside the panel', () => {
    // given
    const { container } = setup();
    openPanel(container);

    // when
    fireEvent.mouseDown(container.querySelector('.rp__panel')!);

    // then
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('closes on Escape', () => {
    // given
    const { container } = setup();
    openPanel(container);

    // when
    fireEvent.keyDown(document, { key: 'Escape' });

    // then
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('closes via the close button', () => {
    // given
    const { container } = setup();
    openPanel(container);

    // when
    fireEvent.click(container.querySelector('button.rp__close')!);

    // then
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });
});

describe('DateRangePicker presets', () => {
  it('commits the clicked preset and closes', () => {
    // given
    const { container, props } = setup();
    openPanel(container);

    // when
    fireEvent.click(option(container, t.presets.last7));

    // then
    expect(props.onChange).toHaveBeenCalledExactlyOnceWith({ kind: 'preset', id: 'last7' });
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('marks only the active preset', () => {
    // given
    const { container } = setup();

    // when
    openPanel(container);

    // then
    const active = [...container.querySelectorAll('button.rp__option--active')];
    expect(active).toHaveLength(1);
    expect(active[0].textContent).toContain(t.presets.last30);
  });
});

describe('DateRangePicker custom mode', () => {
  it('hides the date fields until custom mode is entered', () => {
    // given
    const { container } = setup();
    openPanel(container);
    expect(inputs(container)).toHaveLength(0);

    // when
    fireEvent.click(option(container, t.dateRangePicker.customRange));

    // then
    expect(inputs(container)).toHaveLength(2);
  });

  it('opens straight into custom mode when the selection is already custom', () => {
    // given
    const range: DateRange = { from: '2026-07-01', to: '2026-07-05' };
    const selection: RangeSelection = { kind: 'custom', range };

    // when
    const { container } = setup({ selection, range });
    openPanel(container);

    // then
    expect(inputs(container)).toHaveLength(2);
  });

  it('seeds the fields from the resolved range', () => {
    // given
    const { container } = setup();
    openPanel(container);

    // when
    fireEvent.click(option(container, t.dateRangePicker.customRange));

    // then
    expect(inputs(container).map((i) => i.value)).toEqual(['2026-07-01', '2026-07-30']);
  });

  it('commits an edited range, normalising a reversed one', () => {
    // given
    const { container, props } = setup();
    openPanel(container);
    fireEvent.click(option(container, t.dateRangePicker.customRange));

    // when — enter the dates the wrong way round, then apply
    fireEvent.change(inputs(container)[0], { target: { value: '2026-08-10' } });
    fireEvent.change(inputs(container)[1], { target: { value: '2026-08-01' } });
    fireEvent.click(container.querySelector('button.rp__apply')!);

    // then
    expect(props.onChange).toHaveBeenCalledExactlyOnceWith({
      kind: 'custom',
      range: { from: '2026-08-01', to: '2026-08-10' },
    });
  });

  it('blocks applying while a field is empty', () => {
    // given
    const { container } = setup();
    openPanel(container);
    fireEvent.click(option(container, t.dateRangePicker.customRange));

    // when
    fireEvent.change(inputs(container)[1], { target: { value: '' } });

    // then
    expect(container.querySelector<HTMLButtonElement>('button.rp__apply')!.disabled).toBe(true);
  });
});

describe('DateRangePicker follows its props', () => {
  it('discards a half-finished edit when a new range arrives from outside', () => {
    // given — custom mode with an edited "from" that was never applied
    const { container, rerender } = setup();
    openPanel(container);
    fireEvent.click(option(container, t.dateRangePicker.customRange));
    fireEvent.change(inputs(container)[0], { target: { value: '2026-01-01' } });
    expect(inputs(container)[0].value).toBe('2026-01-01');

    // when — the parent resolves a different range, e.g. a preset picked elsewhere
    rerender(
      <DateRangePicker
        selection={{ kind: 'preset', id: 'last7' }}
        range={{ from: '2026-09-01', to: '2026-09-07' }}
        onChange={vi.fn()}
        locale="de"
      />,
    );

    // then
    expect(inputs(container).map((i) => i.value)).toEqual(['2026-09-01', '2026-09-07']);
  });

  it('keeps an edit while the incoming range is unchanged', () => {
    // given
    const { container, rerender } = setup();
    openPanel(container);
    fireEvent.click(option(container, t.dateRangePicker.customRange));
    fireEvent.change(inputs(container)[0], { target: { value: '2026-01-01' } });

    // when — an unrelated re-render with the same range
    rerender(
      <DateRangePicker
        selection={{ kind: 'preset', id: 'last30' }}
        range={{ from: '2026-07-01', to: '2026-07-30' }}
        onChange={vi.fn()}
        locale="de"
      />,
    );

    // then
    expect(inputs(container)[0].value).toBe('2026-01-01');
  });

  it('leaves custom mode when the selection turns into a preset', () => {
    // given
    const custom: RangeSelection = { kind: 'custom', range: { from: '2026-07-01', to: '2026-07-05' } };
    const { container, rerender } = setup({ selection: custom, range: { from: '2026-07-01', to: '2026-07-05' } });
    openPanel(container);
    expect(inputs(container)).toHaveLength(2);

    // when
    rerender(
      <DateRangePicker
        selection={{ kind: 'preset', id: 'last7' }}
        range={{ from: '2026-09-01', to: '2026-09-07' }}
        onChange={vi.fn()}
        locale="de"
      />,
    );

    // then
    expect(inputs(container)).toHaveLength(0);
  });

  it('leaves custom mode the user opened when a preset arrives from outside', () => {
    // given — the user switched to custom mode while a custom selection was active
    const range: DateRange = { from: '2026-07-01', to: '2026-07-05' };
    const { container, rerender } = setup({ selection: { kind: 'custom', range }, range });
    openPanel(container);
    fireEvent.click(option(container, t.dateRangePicker.customRange));
    expect(inputs(container)).toHaveLength(2);

    // when — the parent switches to a preset
    rerender(
      <DateRangePicker
        selection={{ kind: 'preset', id: 'last7' }}
        range={{ from: '2026-09-01', to: '2026-09-07' }}
        onChange={vi.fn()}
        locale="de"
      />,
    );

    // then — the local toggle is dropped rather than pinning custom mode
    expect(inputs(container)).toHaveLength(0);
  });

  it('enters custom mode when a custom range arrives after a preset was picked', () => {
    // given — picking a preset also clears custom mode locally
    const { container, rerender } = setup();
    openPanel(container);
    fireEvent.click(option(container, t.presets.last7));
    openPanel(container);
    expect(inputs(container)).toHaveLength(0);

    // when — the parent hands in an explicit custom range
    const range: DateRange = { from: '2026-10-01', to: '2026-10-31' };
    rerender(
      <DateRangePicker selection={{ kind: 'custom', range }} range={range} onChange={vi.fn()} locale="de" />,
    );

    // then
    expect(inputs(container)).toHaveLength(2);
  });

  it('is disabled while its caller is loading', () => {
    // given / when / then
    expect(setup({ disabled: true }).container.querySelector<HTMLButtonElement>('button.rp__trigger')!.disabled).toBe(true);
  });
});
