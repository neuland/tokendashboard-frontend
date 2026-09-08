# neuland Token & CO₂ Dashboard – Frontend

Company-wide dashboard visualizing token consumption, estimated cost and estimated
CO₂ emissions across AI providers (Claude, Copilot, OpenCode, local open-weight
models).

## Overview

The frontend is an [Astro](https://astro.build/) application with React islands. It
loads usage data from a backend API at runtime and presents it on two levels:

- **Overview** (`/`) – company-wide KPIs, a provider comparison, and a history chart
  with one bar segment per provider, for a selectable time window.
- **Provider detail** (`/provider/<provider>`) – breakdown by model and token type
  (in, out, cache write, cache read) for a single provider, plus its history.
- **FAQ** (`/faq`) – static content on methodology, cost and privacy.

The selected time window is persisted in the URL (`?preset=` or `?from=&to=`) and in
`localStorage`, so it survives navigation and reloads, and links stay shareable. The
same applies to the provider selection of the home-page chart (`?providers=`).

> **Note:** live data currently exists for **Claude**, **Copilot** and **OpenCode**
> (`ACTIVE_PROVIDERS` in [`src/lib/api.ts`](src/lib/api.ts)). Other providers are
> modeled in the types but have no backend data yet; the list grows as the backend
> starts reporting them.

## Tech stack

- [Astro 7](https://astro.build/) (static build, React integration)
- [React 18](https://react.dev/) for interactive islands
- [Recharts](https://recharts.org/) for the charts
- [lucide-react](https://lucide.dev/) for icons
- TypeScript
- [vitest](https://vitest.dev/) + jsdom for the unit tests

## Requirements

- Node.js >= 24, declared as `engines.node` in `package.json`. [`.nvmrc`](.nvmrc)
  pins 24, which is also what the devcontainer, the [`Dockerfile`](Dockerfile) and
  the example CI use
- npm
- A running backend serving the `/api/usage/*` endpoints (see [API](#api))

## Development

```bash
npm install
npm run dev
```

The dev server runs on <http://localhost:4321>. Requests to `/api` are forwarded by
the Vite proxy to a local backend on `http://localhost:8080` (configured in
[`astro.config.mjs`](astro.config.mjs)) — this keeps the calls same-origin, so no CORS
setup is needed.

To develop against a remote backend instead of localhost:

```bash
API_PROXY_TARGET=https://tokendashboard.example.com npm run dev
```

### npm scripts

| Script             | Description                              |
|--------------------|------------------------------------------|
| `npm run dev`      | Dev server with hot reload               |
| `npm run build`    | Production build into `dist/`            |
| `npm run preview`  | Serve the production build locally       |
| `npm test`         | Run the unit tests (`src/lib/*.test.ts`) |
| `npm run lint`     | Run ESLint over `src/` and the configs   |
| `npm run lint:fix` | Same as `lint`, applying autofixes       |

Type-check with `npx astro check`. Note that `npm run build` does *not* type-check —
a build can succeed while `astro check` reports errors. ESLint is configured in
`eslint.config.js` (see `npm run lint`); no formatter is configured.

## Configuration

| Variable           | Default                 | Description                                                                                                                                          |
|--------------------|-------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------|
| `PUBLIC_COMPANY_NAME` | `""` (empty)         | Company or organization name shown in page titles and the lede ("… from AI agents at *Company*"). Left empty, those texts simply omit it. |
| `PUBLIC_API_BASE`  | `""` (empty)            | Base URL of the API. Empty means same origin. Only needed if the API lives on another host. |
| `PUBLIC_PLUGIN_<PROVIDER>_REPO` | upstream repository | Repository of the usage-reporting plugin for `CLAUDE`, `COPILOT` or `OPENCODE`; shown on the provider page and cloned (with `.git` appended) by the install command. |
| `PUBLIC_PLUGIN_<PROVIDER>_RAW` | upstream raw URL | Raw-file base the installed plugin auto-updates from, e.g. `https://raw.githubusercontent.com/<owner>/<repo>/main`. |
| `API_PROXY_TARGET` | `http://localhost:8080` | Dev-server proxy target for `/api`. Has no effect on the production build.                   |

The six plugin variables default to the upstream repositories under
`github.com/neuland`, see [`.env.example`](.env.example) for the exact values. If you
host your own forks of the plugins, set both URLs per provider verbatim — copy them
from each plugin's README. The `_RAW` URL is the plugins' **update source**: an
installed plugin fetches new versions from there, so whoever operates the dashboard
decides where every user's plugin updates from. See the plugins' `SECURITY.md`.

The `PUBLIC_*` values are baked into the static build, so they have to be set at build
time — either in a local `.env` (copy [`.env.example`](.env.example)) or, for the
container image, as `--build-arg` (see [Build & deployment](#build--deployment)). The
environment wins over the file, so both can coexist.

In production the API runs on the same origin as the frontend, so `PUBLIC_API_BASE`
is normally left empty. Pointing it at another host requires CORS on the backend.

## API

The frontend expects the following endpoints. All take the query parameters `from`
and `to` as `YYYY-MM-DD`, both inclusive; the series endpoints additionally take
`granularity=day|week`. Every route ends in a version segment — currently `v1`, set
via `API_VERSION_1` in [`src/lib/api.ts`](src/lib/api.ts).

| Endpoint                              | Purpose                                          |
|---------------------------------------|--------------------------------------------------|
| `GET /api/usage/all/v1`               | Company-wide overview (totals per provider)      |
| `GET /api/usage/<provider>/v1`        | One provider's usage, broken down by model       |
| `GET /api/usage/all/series/v1`        | History in daily or weekly buckets, per provider |
| `GET /api/usage/<provider>/series/v1` | History for a single provider                    |

The raw response schema and its mapping onto the domain types are documented in
[`src/lib/api.ts`](src/lib/api.ts) and [`src/lib/types.ts`](src/lib/types.ts). That
mapping is the place to update when the backend schema changes.

## Project structure

```
src/
├── components/      React islands & Astro components (dashboard, KPIs, charts …)
├── layouts/         Layout.astro – global page shell
├── lib/             api.ts, types.ts, format.ts, range.ts (time window logic),
│                    seriesChartData.ts, providerSelection.ts, *.test.ts
├── pages/           index.astro, faq.astro, provider/[provider].astro; en/ mirrors them
├── i18n/            de.ts, en.ts – UI strings per locale
├── styles/          global.css, tokens.css (design tokens)
└── assets/          fonts (DM Sans, Fira Code; both OFL-licensed, licence files alongside)
```

Imports reach across directories through the `~/` alias — `~/lib/api` rather than
`../lib/api` — mapped in `tsconfig.json` and enforced by ESLint; same-directory imports
stay relative.

Business logic lives in `src/lib/`, not in the components. The trickiest piece is
`range.ts`: a selection is either a named **preset** ("last 30 days", "this week") or
an explicit **custom** range. The selection — not the resolved dates — is the source
of truth, and presets are recomputed against the current day on every load, so
"today" still means today tomorrow.

## Build & deployment

The production build emits a fully static site into `dist/`, served by
[nginx](https://nginx.org/).

- **Container:** multi-stage build (Node → nginx), see [`Dockerfile`](Dockerfile).
- **CI:** the GitHub Actions workflow in
  [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs lint, type-check, unit
  and e2e tests on every push to `main` and every pull request. It does not build or
  publish an image — how and where the image is deployed is up to each installation.
- **Deployment examples:** [`examples/`](examples/) holds generic, placeholder-valued
  starting points for your own pipeline — a GitLab CI pipeline
  ([`examples/gitlab-ci.yml`](examples/gitlab-ci.yml)) that builds the image, pushes it
  to the GitLab registry and applies the Kubernetes manifests under
  [`examples/kustomize/`](examples/kustomize/). The ingress there routes `/` to this
  frontend and `/api` to the backend, which is what keeps the API same-origin.

```bash
# build the image locally; the PUBLIC_* values are baked in at this point
docker build \
  --build-arg PUBLIC_COMPANY_NAME="Some Org GmbH" \
  -t tokendashboard-frontend .
docker run -p 8080:80 tokendashboard-frontend
```

Without `--build-arg`, the build falls back to a `.env` in the checkout, if present
(`.dockerignore` deliberately lets it through); with neither, the company name is
simply omitted from the page texts.

### Devcontainer (optional)

`.devcontainer/` provides a ready-to-use container with Claude Code
preinstalled. It mounts your host `~/.claude`, so your existing settings,
plugins and hooks work inside the container unchanged. Everything above
works without it — the devcontainer is a convenience, not a requirement.
Note that Claude inside the devcontainer is started with the parameter
`--dangerously-skip-permissions`.

## Language

UI text is available in German and English (`/` and `/en/...`, respectively; see
the `i18n` configuration in [`astro.config.mjs`](astro.config.mjs)). Code comments
and identifiers are in English.
