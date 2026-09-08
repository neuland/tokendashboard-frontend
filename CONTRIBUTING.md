# Contributing to TokenDashboard Frontend

Thanks for your interest in contributing! This project is maintained by
[neuland - Büro für Informatik](https://neuland-bfi.de) and developed as
open source.

## Before you start

For anything beyond a small fix (new pages, architectural changes, API
contract changes), please open an issue first to discuss the approach. This
avoids wasted effort if the direction doesn't fit the project.

See [CLAUDE.md](CLAUDE.md) for import conventions and testing structure, and
the backend's [TokenDashboard](https://github.com/neuland/TokenDashboard)
repository for the API contract this frontend consumes.

## Development setup

```bash
npm install
npm run dev   # http://localhost:4321, proxies /api to a local backend on :8080
```

See [README.md](README.md#development) for pointing the dev proxy at a remote
backend instead of localhost.

## Code style

- Formatting/linting is handled by **ESLint** — run `npm run lint:fix` before
  committing. ESLint is deliberately not type-aware, so a green lint says
  nothing about types (see below).
- Imports across directories go through the `~/` alias (`~/lib/api`, not
  `../lib/api`); same-directory imports stay relative — see
  [CLAUDE.md](CLAUDE.md#imports).
- Tests use **vitest** with `@testing-library/react`, structured with
  `// given` / `// when` / `// then` comments — see
  [CLAUDE.md](CLAUDE.md#tests) for the full conventions, including the
  table-style-check exception.

## Before opening a pull request

```bash
npm run lint
npx astro check
npm test
npm run test:e2e
```

All four must pass — `npm test`/`npm run build` do **not** type-check, so a
green build can still hide a type error caught only by `astro check`. Please
keep changes focused — unrelated refactors or formatting-only changes make
review harder and should go in a separate PR.

## Pull request guidelines

- Describe the "why", not just the "what" — especially for anything touching
  the API contract in [`src/lib/api.ts`](src/lib/api.ts) or
  [`src/lib/types.ts`](src/lib/types.ts).
- Add or update tests for behavioural changes.
- Update the corresponding `__mocks__` file (see [CLAUDE.md](CLAUDE.md#mocks))
  when adding an export to a mocked module — it fails silently otherwise.

## Reporting bugs / security issues

Open an issue with steps to reproduce. For security-relevant findings, please
avoid filing a public issue — see [SECURITY.md](SECURITY.md) instead.
