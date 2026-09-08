# Security Policy

## Reporting a vulnerability

Please do **not** file security issues as public GitHub issues. Instead,
report them to `tokendashboard@neuland-bfi.de`. You can expect an
acknowledgement within a few working days.

- A description of the issue and its potential impact
- Steps to reproduce (a minimal repro is ideal)
- The version/commit affected

We'll acknowledge reports as quickly as we can and keep you updated as we work on a
fix. Please give us a reasonable amount of time to address the issue before any
public disclosure.

## Security model

This is a static Astro site with no server-side logic of its own and **no
authentication** — it renders whatever the backend's `/api/usage/*` endpoints
return. It inherits the backend's trust model: see the
[TokenDashboard](https://github.com/neuland/TokenDashboard) repository's
`SECURITY.md` for why that API has no auth and must only run on a trusted
network.

What that means concretely:

- The frontend holds no secrets and no user credentials — there is nothing to
  steal from the build artifact or the running container.
- All displayed figures are aggregated token/cost/CO₂ estimates, never prompt
  or file content, and are not attributable to individual users or teams.
- API responses are rendered as data (charts, tables), not injected as raw
  HTML — a compromised or malicious `PUBLIC_API_BASE` backend could still feed
  it misleading numbers, but that is a trust decision made by whoever deploys
  and configures this frontend, not a vulnerability in the frontend itself.

## Deployment

The production image is stateless and serves only static files via nginx —
see [README.md](README.md#build--deployment). As with the backend, deploy it
only where it can reach a trusted `PUBLIC_API_BASE`; there is no built-in
access control on the frontend side either.

## Supported versions

Only the latest release is supported. This project has no release-branch
process, so fixes are applied to the current default branch only.
