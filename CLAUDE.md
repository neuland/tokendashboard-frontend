# tokendashboard-frontend

Astro 7 with React 18 islands, TypeScript. Notes for working in this repo.

## Imports

Anything outside the current directory is imported through the `~/` alias, which maps
to `src/`. Siblings stay relative:

```ts
import { usdCentToUsd } from '~/lib/types';
import { dict, type Locale } from '~/i18n';
import KpiCard from './KpiCard';
```

`../lib/api` and `../../lib/api` are rejected by
`@typescript-eslint/no-restricted-imports` — `./sibling` is not, because an alias buys
nothing there and only lengthens the specifier.

The mapping is declared once, in `tsconfig.json` `compilerOptions.paths` — deliberately
without `baseUrl`, which would additionally make `src/i18n` resolve as a bare specifier
and open a second import form the ESLint rule cannot see. Astro reads the paths and
hands them to Vite, so the same alias resolves under `astro dev`, `astro build`,
`astro check` and vitest; there is no second copy in `vitest.config.ts` to keep in sync.
`~` rather than `@`, because `@` is already the npm scope prefix (`@astrojs/react`,
`@testing-library/react`).

It applies to every specifier, not just `import`: `vi.mock('~/lib/api')` still finds
`src/lib/__mocks__/api.ts`, and a `__mocks__` file reaching for the real module uses
`vi.importActual('~/lib/api')` — the same path it is registered under, which resolves to
the real module rather than recursing.

## Tests

### Structure: given / when / then

Every test body is divided by `// given`, `// when` and `// then` comments, in that
order. All three are mandatory — not decoration. If one of the phases has nothing to
put under it, that is a signal about the test, not a licence to drop the comment: a
test with no `// when` is asserting on a constant, and one with no `// given` usually
depends on hidden ambient state.

```ts
it('normalises a reversed range', () => {
  // given
  const reversed = { from: '2026-03-31', to: '2026-03-01' };

  // when
  const result = normalize(reversed);

  // then
  expect(result).toEqual({ from: '2026-03-01', to: '2026-03-31' });
});
```

Keep the phases in that order and put the assertions last. Setup that belongs to the
whole `describe` block goes into `beforeEach` rather than being repeated in every
test — the `// given` then stays, naming where the setup actually happened:

```ts
it('loadSelection defaults when nothing is set', () => {
  // given — beforeEach cleared both the URL params and localStorage

  // when
  const selection = loadSelection();

  // then
  expect(selection).toEqual(DEFAULT_SELECTION);
});
```

A rejection is the one case where `when` and `then` genuinely cannot be separated,
because the call *is* the subject of the assertion. Combine those two and say so:

```ts
// given
mockFetch({}, false, 500);

// when / then — a rejection cannot be split; the call is the assertion subject
await expect(fetchProviderUsage('claude', range)).rejects.toThrow('500');
```

### Exception: table-style checks

When a test body is nothing but one-line assertions and *each line is already a
complete given + when + then* — a lookup table, scale boundaries, the same call per
locale — do not split it artificially. Collapse the three phases into one combined
comment above the block. This covers a single such assertion as well as a series of
them; one line is the most artificial case of all to split.

```ts
it('de: Tsd./Mio./Mrd.', () => {
  // given / when / then — one scale boundary per line
  expect(formatTokens(1_000, 'de')).toEqual({ value: '1,0', unit: 'Tsd.' });
  expect(formatTokens(1_000_000, 'de')).toEqual({ value: '1,0', unit: 'Mio.' });
  expect(formatTokens(1_000_000_000, 'de')).toEqual({ value: '1,0', unit: 'Mrd.' });
});
```

Breaking each of those lines into three phases would triple the line count without
adding information.

The operative test when deciding: **does the assertion fit on one line with the call
inline?** If yes, collapse. If the test needs its own setup statements, or the
assertion has to span several lines, split it — and extract the call into a named
variable under `// when`, which is what makes the split worth having:

```ts
// before
expect(eachDay({ from: '2026-07-01', to: '2026-07-03' })).toEqual([
  '2026-07-01',
  '2026-07-02',
  '2026-07-03',
]);

// after
// given
const range = { from: '2026-07-01', to: '2026-07-03' };

// when
const days = eachDay(range);

// then
expect(days).toEqual(['2026-07-01', '2026-07-02', '2026-07-03']);
```

`src/lib/format.test.ts` is the reference for the fully collapsed style;
`src/lib/range.test.ts` mixes both and is the reference for the judgement call.

### Running them

| Command | Purpose |
| --- | --- |
| `npm test` | Whole suite once (`vitest run`) — this is what CI runs |
| `npx vitest` | Watch mode |
| `npx vitest run src/lib/format.test.ts` | A single file |
| `npx vitest run -t 'thousands separators'` | Only tests whose name matches |

`vitest.config.ts` builds on Astro's own Vite config via `getViteConfig`, so imports
resolve exactly as they do under `astro dev` and `astro build`. The environment is
`jsdom`, and `src/**/*.test.{ts,tsx}` is collected — a component test can be written
in `.tsx` with plain JSX.

### Component tests

Rendering goes through `@testing-library/react`: `render` returns a `container` to
query, `rerender` feeds in new props (which is how the prop-following behaviour of
`DateRangePicker` is pinned), and `fireEvent` drives interaction.

`vitest.setup.ts` stubs `ResizeObserver`, which jsdom does not ship and recharts'
`ResponsiveContainer` subscribes to on mount. Without it every component that renders
a chart throws on render rather than failing an assertion.

Four things the jsdom environment does not give you, each already worked around in an
existing test worth copying from:

| Obstacle | Where it is solved |
| --- | --- |
| Charts never get a size, so axis and bar props never reach the DOM | `SeriesBarChart.test.tsx` walks the returned element tree; the component is pure and hook-free |
| `navigator.clipboard` is absent, and a bare `setTimeout` leaks | `InstallCommand.test.tsx` defines the property and uses `vi.useFakeTimers()` |
| `ACTIVE_PROVIDERS` holds all three providers, so "no data for this provider" is unreachable | `ProviderFilter.test.tsx` and `ProviderDetail.test.tsx` splice the mutable copy the default mock hands out |
| A child that fetches puts a second `loading` in the tree and masks the parent's own state | `Dashboard.test.tsx` stubs `./HomeUsageSeriesChart`; the chart has its own test file |

Components that fetch (`Dashboard`, `ProviderDetail`) also read and write the URL and
`localStorage` on mount via `loadSelection`/`persistSelection`, so their tests clear
both in `beforeEach`. To observe a `loading` state at all, hand the mocked fetch a
promise the test settles itself — resolving immediately means the first assertion
already sees the ready state.

`DecoBars.astro` and `Header.astro` have no tests of their own; both are exercised
through the page render tests below.

### Page tests

Three things about `src/pages`, each of which costs a failing run to rediscover:

- **Test files live in `src/pages/__tests__/`.** Everything else under `src/pages` is a
  route; Astro excludes `_`-prefixed folders from routing, which is what keeps a
  `.test.ts` from being built as an endpoint.
- **Importing a `.astro` module requires the node environment.** Under jsdom the module
  resolves with none of its exports, so `getStaticPaths` comes back undefined. Put
  `// @vitest-environment node` at the top; the rest of the suite stays on jsdom.
- **Rendering needs a container plus a registered renderer.** `experimental_AstroContainer`
  from `astro/container`, and `loadRenderers([getContainerRenderer()])` from
  `astro:container` and `@astrojs/react/container-renderer`. Without the renderer any
  page holding a React component — `FaqAsterisk` inside `Header` counts — throws
  `NoMatchingRenderer`. The container also drags in esbuild, which asserts
  `new TextEncoder().encode('') instanceof Uint8Array`; that is false under jsdom, hence
  the node environment again.

Pass `request: new Request('http://localhost/provider/claude/')` so `Astro.url` is real —
without it the navigation marks the wrong link active.

What a page test can reach: the `<title>`, the head's Open Graph and Twitter tags, the
navigation, and — via the `<astro-island props="…">` attribute — **the props the page
hands to its island**. That last one is the only place the page-to-React seam is covered;
the island itself stays empty, because `client:only` renders nothing server-side.

What it cannot reach: `Astro.currentLocale` is a product of i18n *routing*, which the
container does not apply. Every page therefore falls back to `DEFAULT_LOCALE`, so the
English tree renders German copy under test. Locale-dependent output belongs in the
component and dictionary tests, not here.

`faqAnchors.test.ts` needs neither: `FaqAsterisk` links `#<id>` values from the
dictionary, and nothing else ties those to the headings on the FAQ pages, so it compares
the two directly — pulling the page in as a string with Vite's `?raw`.

### Mocks

A module mocked by more than one test file gets a default mock in a `__mocks__` folder
**next to the module**, not next to the test:

```
src/lib/api.ts
src/lib/__mocks__/api.ts
```

The test then needs nothing but the trigger:

```ts
vi.mock('~/lib/api');
```

The `vi.mock` call stays mandatory. Automatic application without it happens only for
`node_modules` packages; for our own modules the folder supplies the *content* of the
mock, never the decision to use one. There are three:

| Module | What the default mock does |
| --- | --- |
| `src/lib/__mocks__/api.ts` | All four `fetch*` functions become bare `vi.fn()`; the pure helpers stay real; `ACTIVE_PROVIDERS` is a mutable copy |
| `src/lib/__mocks__/plugins.ts` | The command builders and `providerPlugin` keep their real behaviour, wrapped in spies, so a test can override a single case |
| `src/lib/__mocks__/useUsageSeries.ts` | The hook becomes a `vi.fn()`; each test declares the state to render from |

Module state is per test file, so one file splicing `ACTIVE_PROVIDERS` cannot affect
another — restoring it in `afterEach` is about the other tests in the *same* file.

A stub needed by only one test file stays an inline factory, as `Dashboard.test.tsx`
does for its chart. Both forms next to each other are worth keeping: a bare `vi.mock`
means "shared default", a factory means "this file only".

**One sharp edge.** If a module grows a new export and the `__mocks__` file is not
updated, that export silently becomes `undefined` in every test that mocks the module.
There is no link error, and TypeScript does not catch it either, because the types
still resolve against the real module. The failure only surfaces where a test actually
calls the missing function. So: adding an export to `api.ts`, `plugins.ts` or
`useUsageSeries.ts` means adding it to the matching mock.

### What the tests do not cover

`npm test` does not type-check, and neither does `npm run build` — a build can succeed
while types are broken. The separate gates are:

| Command | Gate |
| --- | --- |
| `npx astro check` | TypeScript, including `.astro` files |
| `npm run lint` | ESLint (`npm run lint:fix` to autofix) |

Neither substitutes for the other: ESLint is deliberately configured *without*
type-aware rules (see the comment at the top of `eslint.config.js`), so a green lint
says nothing about types. Run all three before calling a change done.
