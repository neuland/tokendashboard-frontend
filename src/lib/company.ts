// Company/organization name shown in titles, footer, and lede text.
// Comes from PUBLIC_COMPANY_NAME: a local `.env` (see `.env.example`) or, for the
// container image, `docker build --build-arg`. Empty when unset; every template that
// takes it (see `src/i18n`) reads cleanly without it.
export const COMPANY_NAME = import.meta.env.PUBLIC_COMPANY_NAME ?? '';
