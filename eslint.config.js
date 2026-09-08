// Flat ESLint config. Run with `npm run lint` (`npm run lint:fix` to autofix).
// Deliberately not type-aware: type-checked rules over astro-eslint-parser are
// brittle, and `npm run astro check` already covers the type layer.
import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import reactHooks from 'eslint-plugin-react-hooks';
import stylistic from '@stylistic/eslint-plugin';

const reactHooksRecommended = reactHooks.configs.flat['recommended-latest'];

export default defineConfig([
  { ignores: ['dist/', '.astro/', 'node_modules/', 'public/'] },

  // Baseline for every linted file.
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // React islands.
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: reactHooksRecommended.plugins,
    rules: reactHooksRecommended.rules,
  },

  // Astro pages, layouts and components (parser + <script> processor).
  ...astro.configs['flat/recommended'],

  // Node-only scripts: the OG image renderer and the build configs.
  {
    files: ['src/og/*.mjs', '*.config.{js,mjs,ts}'],
    languageOptions: { globals: globals.node },
  },

  // Ambient declarations: Astro's generated types are pulled in via triple-slash.
  {
    files: ['**/*.d.ts'],
    rules: { '@typescript-eslint/triple-slash-reference': 'off' },
  },

  // Braces are mandatory after if/else/for/while — never a bare statement — and the
  // block body always goes on its own line, so `if (x) { return; }` is a violation as
  // well. `brace-style` lives in ESLint Stylistic; the core copy is deprecated.
  {
    plugins: { '@stylistic': stylistic },
    rules: {
      curly: ['error', 'all'],
      '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: false }],
    },
  },

  // Reach for the `~/…` alias instead of climbing out of a directory: `~/lib/api`
  // rather than `../lib/api` or `../../lib/api`. The mapping lives in `tsconfig.json`,
  // which Astro also hands to Vite, so it resolves in dev, build, check and vitest
  // alike. Same-directory `./sibling` imports stay as they are — an alias buys nothing
  // there and only makes the specifier longer.
  {
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['..', '../*'],
              message: 'Use the ~/ alias instead of a parent-relative path, e.g. ~/lib/api.',
            },
          ],
        },
      ],
    },
  },

  // Every exported function states its return type — the module boundary is where an
  // inferred type stops being a local convenience and becomes an unwritten contract for
  // every caller. Unlike the type-checked rules the header rejects, this one reads only
  // the syntax, so it works over `astro-eslint-parser` too. It also insists on typed
  // *parameters* at the boundary, which is the same contract from the other side.
  // Scoped to TS — the plain `.mjs` scripts and configs have no type layer to annotate.
  {
    files: ['**/*.{ts,tsx,astro}'],
    rules: { '@typescript-eslint/explicit-module-boundary-types': 'error' },
  },

  // Unused args are fine when they document a signature; `_`-prefixed names opt out.
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
]);
