// @vitest-environment node
//
// Renders whole pages through Astro's container API. Two constraints, both discovered
// the hard way and neither obvious from a failure message:
//
//   * The container pulls in esbuild, which asserts `new TextEncoder().encode('')
//     instanceof Uint8Array`. Under jsdom that is false, so this file must run in the
//     node environment while the rest of the suite stays on jsdom.
//   * The React renderer has to be registered explicitly. Without it any page holding a
//     React component — including the sidebar's provider glyphs — throws NoMatchingRenderer.
//
// What the container cannot do: `Astro.currentLocale` is a product of i18n *routing*,
// which the container does not apply. Every page here therefore falls back to
// DEFAULT_LOCALE, so the English tree renders German copy. Locale-dependent output is
// covered by the component and dictionary tests instead, not from here.
import { describe, expect, it } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { loadRenderers } from 'astro:container';
import { getContainerRenderer } from '@astrojs/react/container-renderer';
import DeIndex from '~/pages/index.astro';
import EnIndex from '~/pages/en/index.astro';
import DeProvider from '~/pages/provider/[provider].astro';
import EnProvider from '~/pages/en/provider/[provider].astro';
import DeFaq from '~/pages/faq.astro';
import { COMPANY_NAME } from '~/lib/company';
import { DEFAULT_LOCALE, dict } from '~/i18n';
import { PROVIDER_LABELS } from '~/lib/types';

const t = dict(DEFAULT_LOCALE);

async function container() {
  const renderers = await loadRenderers([getContainerRenderer()]);
  return AstroContainer.create({ renderers });
}

function meta(html: string, key: string): string | undefined {
  return html.match(new RegExp(`<meta (?:name|property)="${key}" content="([^"]*)"`))?.[1];
}

function title(html: string): string | undefined {
  return html.match(/<title>([^<]*)<\/title>/)?.[1];
}

/** The page's own island is the `client:only` one; the sidebar's provider items hydrate with `client:load`. */
function pageIsland(html: string): string {
  return [...html.matchAll(/<astro-island[^>]*>/g)].map((m) => m[0]).find((tag) => /\sclient="only"/.test(tag)) ?? '';
}

/**
 * The props Astro hands to the page island, decoded from the `<astro-island>` element.
 * Astro serialises each value as `[typeTag, value]`; only the value matters here.
 */
function islandProps(html: string): Record<string, unknown> {
  const raw = pageIsland(html).match(/\sprops="([^"]*)"/)?.[1] ?? '{}';
  const parsed = JSON.parse(raw.replace(/&quot;/g, '"')) as Record<string, [number, unknown]>;
  return Object.fromEntries(Object.entries(parsed).map(([k, [, value]]) => [k, value]));
}

function islandUrl(html: string): string | undefined {
  return pageIsland(html).match(/component-url="([^"]*)"/)?.[1];
}

function activeNav(html: string): string[] {
  return [...html.matchAll(/<a href="([^"]+)" class="app-nav__link" aria-current="page"/g)].map((m) => m[1]);
}

describe('index page', () => {
  it('mounts the dashboard with the locale, title and lede', async () => {
    // given
    const c = await container();

    // when
    const html = await c.renderToString(DeIndex, { request: new Request('http://localhost/') });

    // then
    expect(islandProps(html)).toEqual({
      locale: DEFAULT_LOCALE,
      title: t.header.defaultTitle,
      lede: t.header.defaultLede(COMPANY_NAME),
    });
    expect(islandUrl(html)).toContain('Dashboard');
  });

  it('marks the company-wide item active in the sidebar, and only that one', async () => {
    // given
    const c = await container();

    // when
    const html = await c.renderToString(DeIndex, { request: new Request('http://localhost/') });

    // then
    expect(activeNav(html)).toEqual(['/']);
  });

  it('carries no design switch any more', async () => {
    // given
    const c = await container();

    // when
    const html = await c.renderToString(DeIndex, { request: new Request('http://localhost/') });

    // then
    expect(html).not.toContain('design-toggle');
    expect(html).not.toContain('tokendashboard.design');
  });

  it('exists in both locales and mounts the same island', async () => {
    // given
    const c = await container();

    // when
    const de = await c.renderToString(DeIndex, { request: new Request('http://localhost/') });
    const en = await c.renderToString(EnIndex, { request: new Request('http://localhost/en/') });

    // then
    expect(islandUrl(en)).toBe(islandUrl(de));
  });
});

describe('provider page', () => {
  it('titles the page with the provider label and the company name', async () => {
    // given
    const c = await container();

    // when
    const html = await c.renderToString(DeProvider, {
      props: { provider: 'copilot' },
      params: { provider: 'copilot' },
      request: new Request('http://localhost/provider/copilot/'),
    });

    // then
    expect(title(html)).toBe(t.providerPage.title(PROVIDER_LABELS[DEFAULT_LOCALE].copilot, COMPANY_NAME));
  });

  it('hands provider, locale, title and lede to the island', async () => {
    // given
    const c = await container();

    // when
    const html = await c.renderToString(DeProvider, {
      props: { provider: 'copilot' },
      params: { provider: 'copilot' },
      request: new Request('http://localhost/provider/copilot/'),
    });

    // then
    expect(islandProps(html)).toEqual({
      provider: 'copilot',
      locale: DEFAULT_LOCALE,
      title: PROVIDER_LABELS[DEFAULT_LOCALE].copilot,
      lede: t.providerDetail.lede,
    });
    expect(islandUrl(html)).toContain('ProviderDetail');
  });

  it('marks the visited provider active in the sidebar', async () => {
    // given
    const c = await container();

    // when
    const html = await c.renderToString(DeProvider, {
      props: { provider: 'copilot' },
      params: { provider: 'copilot' },
      request: new Request('http://localhost/provider/copilot/'),
    });

    // then
    expect(activeNav(html)).toEqual(['/provider/copilot/']);
  });

  it('titles the English tree without the German hyphenation', async () => {
    // given
    const c = await container();

    // when
    const html = await c.renderToString(EnProvider, {
      props: { provider: 'claude' },
      params: { provider: 'claude' },
      request: new Request('http://localhost/en/provider/claude/'),
    });

    // then — note the locale caveat at the top: label and title template both come from DEFAULT_LOCALE
    expect(title(html)).toBe(t.providerPage.title(PROVIDER_LABELS[DEFAULT_LOCALE].claude, COMPANY_NAME));
  });
});

describe('sidebar', () => {
  it('offers the collapse button, remembered under the nav storage key', async () => {
    // given
    const c = await container();

    // when
    const html = await c.renderToString(DeIndex, { request: new Request('http://localhost/') });

    // then
    expect(html).toContain('data-app-collapse');
    expect(html).toContain('tokendashboard.nav');
  });
});

describe('FAQ page', () => {
  it('mounts the shared FAQ content, anchors included', async () => {
    // given
    const c = await container();

    // when
    const html = await c.renderToString(DeFaq, { request: new Request('http://localhost/faq/') });

    // then
    expect(html).toContain(`id="${t.faqAsterisk.co2.id}"`);
    expect(html).toContain('class="app-faq"');
  });

  it('answers "Plugins installieren" from the sidebar with every provider, not Claude alone', async () => {
    // given
    const c = await container();

    // when
    const html = await c.renderToString(DeFaq, { request: new Request('http://localhost/faq/') });

    // then
    expect(html).toMatch(new RegExp(`<a href="/faq/#plugins" class="app-nav__link"[^>]*title="${t.nav.installPlugins}"`));
    const entry = html.slice(html.indexOf('<section id="plugins"'), html.indexOf('</section>', html.indexOf('<section id="plugins"')));
    expect(entry).toContain('href="#plugin-installation"');
    expect(entry).toContain('href="#plugin-installation-copilot"');
    expect(entry).toContain('href="#plugin-installation-opencode"');
  });
});
describe('every page head', () => {
  it('mirrors the title into the Open Graph and Twitter cards', async () => {
    // given
    const c = await container();

    // when
    const html = await c.renderToString(DeIndex, { request: new Request('http://localhost/') });

    // then
    expect(meta(html, 'og:title')).toBe(title(html));
    expect(meta(html, 'twitter:title')).toBe(title(html));
    expect(meta(html, 'og:description')).toBe(meta(html, 'description'));
    expect(meta(html, 'twitter:description')).toBe(meta(html, 'description'));
  });

  it('uses the image-less Twitter card, since no preview image is generated', async () => {
    // given
    const c = await container();

    // when
    const html = await c.renderToString(DeIndex, { request: new Request('http://localhost/') });

    // then
    expect(meta(html, 'twitter:card')).toBe('summary');
    expect(meta(html, 'og:image')).toBeUndefined();
    expect(meta(html, 'twitter:image')).toBeUndefined();
  });

  it('declares both locales, so a share picks the right one', async () => {
    // given
    const c = await container();

    // when
    const html = await c.renderToString(DeIndex, { request: new Request('http://localhost/') });

    // then
    expect(meta(html, 'og:locale')).toBe('de_DE');
    expect(meta(html, 'og:locale:alternate')).toBe('en_US');
  });
});
