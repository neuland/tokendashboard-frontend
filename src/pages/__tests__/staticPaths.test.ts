// @vitest-environment node
//
// `.astro` modules only expose their exports under the node environment; jsdom yields
// an empty module. Lives in `__tests__` because Astro treats everything else under
// `src/pages` as a route — an `_`-prefixed folder is excluded from routing.
import { describe, expect, it } from 'vitest';
import { getStaticPaths as dePaths } from '~/pages/provider/[provider].astro';
import { getStaticPaths as enPaths } from '~/pages/en/provider/[provider].astro';
import { PROVIDERS } from '~/lib/types';

const trees = [
  { name: 'de', getStaticPaths: dePaths },
  { name: 'en', getStaticPaths: enPaths },
];

describe.each(trees)('$name provider route', ({ getStaticPaths }) => {
  it('generates one page per provider the app knows', () => {
    // when
    const paths = getStaticPaths();

    // then
    expect(paths.map((p) => p.params.provider)).toEqual(PROVIDERS);
  });

  it('passes the provider as a prop as well as a param, so the page needs no lookup', () => {
    // when
    const paths = getStaticPaths();

    // then
    expect(paths.every((p) => p.params.provider === p.props.provider)).toBe(true);
  });

  it('generates no page for anything outside PROVIDERS', () => {
    // given / when / then
    expect(getStaticPaths()).toHaveLength(PROVIDERS.length);
  });
});

describe('both provider routes', () => {
  it('cover the same providers, so no language is missing a page', () => {
    // given / when
    const de = dePaths().map((p) => p.params.provider);
    const en = enPaths().map((p) => p.params.provider);

    // then
    expect(de).toEqual(en);
  });
});
