// jsdom ships no ResizeObserver, but recharts' ResponsiveContainer subscribes to one on
// mount. Without this stub every component that renders a chart throws on render.
// It deliberately never reports a size: the chart body stays empty, which is fine —
// chart internals are not what the component tests assert on.
class ResizeObserverStub implements ResizeObserver {
  observe(): void {
    // no-op: nothing ever resizes in jsdom
  }

  unobserve(): void {
    // no-op
  }

  disconnect(): void {
    // no-op
  }
}

globalThis.ResizeObserver ??= ResizeObserverStub;
