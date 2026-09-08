// @vitest-environment node
//
// Renders whole pages through Astro's container API. Two constraints, both discovered
// the hard way and neither obvious from a failure message:
//
//   * The container pulls in esbuild, which asserts `new TextEncoder().encode('')
//     instanceof Uint8Array`. Under jsdom that is false, so this file must run in the
//     node environment while the rest of the suite stays on jsdom.
//   * The React renderer has to be registered explicitly. Without it any page holding a
//     React component — including `FaqAsterisk` inside `Header` — throws NoMatchingRenderer.
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

/**
 * The props Astro hands to a client island, decoded from the `<astro-island>` element.
 * Astro serialises each value as `[typeTag, value]`; only the value matters here.
 */
function islandProps(html: string): Record<string, unknown> {
  const raw = html.match(/<astro-island[^>]*\sprops="([^"]*)"/)?.[1] ?? '{}';
  const parsed = JSON.parse(raw.replace(/&quot;/g, '"')) as Record<string, [number, unknown]>;
  return Object.fromEntries(Object.entries(parsed).map(([k, [, value]]) => [k, value]));
}

function island(html: string): { url?: string; export?: string; client?: string } {
  const tag = html.match(/<astro-island[^>]*>/)?.[0] ?? '';
  return {
    url: tag.match(/component-url="([^"]*)"/)?.[1],
    export: tag.match(/component-export="([^"]*)"/)?.[1],
    client: tag.match(/\sclient="([^"]*)"/)?.[1],
  };
}

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

  it('hands the provider to the island, which is where the page stops and React starts', async () => {
    // given
    const c = await container();

    // when
    const html = await c.renderToString(DeProvider, {
      props: { provider: 'opencode' },
      params: { provider: 'opencode' },
      request: new Request('http://localhost/provider/opencode/'),
    });

    // then
    expect(islandProps(html)).toEqual({ provider: 'opencode', locale: DEFAULT_LOCALE });
  });

  it('defers the island until the browser, since it needs the API', async () => {
    // given
    const c = await container();

    // when
    const html = await c.renderToString(DeProvider, {
      props: { provider: 'claude' },
      params: { provider: 'claude' },
      request: new Request('http://localhost/provider/claude/'),
    });

    // then
    expect(island(html)).toMatchObject({ export: 'default', client: 'only' });
    expect(island(html).url).toContain('ProviderDetail');
  });

  it('shows the provider name as the heading, with the detail lede', async () => {
    // given
    const c = await container();

    // when
    const html = await c.renderToString(DeProvider, {
      props: { provider: 'claude' },
      params: { provider: 'claude' },
      request: new Request('http://localhost/provider/claude/'),
    });

    // then
    expect(html).toContain('<h1 class="ds-h1"');
    expect(html).toContain(PROVIDER_LABELS[DEFAULT_LOCALE].claude);
    expect(html).toContain(t.providerDetail.lede);
  });

  it('marks the visited provider active in the navigation, and only that one', async () => {
    // given
    const c = await container();

    // when
    const html = await c.renderToString(DeProvider, {
      props: { provider: 'copilot' },
      params: { provider: 'copilot' },
      request: new Request('http://localhost/provider/copilot/'),
    });

    // then
    const active = [...html.matchAll(/<a href="([^"]+)" class="nav-link active"/g)].map((m) => m[1]);
    expect(active).toEqual(['/provider/copilot/']);
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

describe('index page', () => {
  it('mounts the dashboard island with just the locale', async () => {
    // given
    const c = await container();

    // when
    const html = await c.renderToString(DeIndex, { request: new Request('http://localhost/') });

    // then
    expect(islandProps(html)).toEqual({ locale: DEFAULT_LOCALE });
    expect(island(html).url).toContain('Dashboard');
  });

  it('marks the overview active in the navigation', async () => {
    // given
    const c = await container();

    // when
    const html = await c.renderToString(DeIndex, { request: new Request('http://localhost/') });

    // then
    const active = [...html.matchAll(/<a href="([^"]+)" class="nav-link active"/g)].map((m) => m[1]);
    expect(active).toEqual(['/']);
  });

  it('exists in both trees and mounts the same island', async () => {
    // given
    const c = await container();

    // when
    const de = await c.renderToString(DeIndex, { request: new Request('http://localhost/') });
    const en = await c.renderToString(EnIndex, { request: new Request('http://localhost/en/') });

    // then
    expect(island(en).url).toBe(island(de).url);
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
