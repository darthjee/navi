import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import jasmine from 'eslint-plugin-jasmine';
import sortClassMembers from 'eslint-plugin-sort-class-members';
import globals from 'globals';

// Stub plugin registering `security/detect-non-literal-fs-filename` as a
// *known* (but unimplemented and disabled) rule id. This package does not
// use eslint-plugin-security, but `server.js` and
// `spec/support/utils/FixturesUtils.js` carry
// `// eslint-disable-next-line security/detect-non-literal-fs-filename`
// comments aimed at Codacy's own ESLint-based scan (which does load that
// plugin and flags the non-literal `readFileSync()` paths there). Without
// this stub, ESLint's flat config treats a disable comment referencing an
// unregistered rule as a hard configuration error. With it registered (but
// never enabled), the comment is simply reported as an unused disable
// directive (a warning, not an error) for this package's own lint.
const securityStub = {
  rules: {
    'detect-non-literal-fs-filename': { create: () => ({}) },
  },
};

export default [
  {
    ignores: ['node_modules/**/*.js', 'report/**', 'coverage/**'],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    plugins: {
      'import': importPlugin,
      'sort-class-members': sortClassMembers,
      security: securityStub,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    settings: {
      'import/resolver': {
        node: { extensions: ['.js'] },
      },
    },
    rules: {
      'import/order': ['error', {
        alphabetize: { order: 'asc', caseInsensitive: true },
        'newlines-between': 'never',
        groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
      }],

      'no-trailing-spaces': ['error', { skipBlankLines: false, ignoreComments: false }],
      'no-multi-spaces': ['error', { ignoreEOLComments: true }],

      indent: ['error', 2, { SwitchCase: 1 }],
      'linebreak-style': ['error', 'unix'],
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'always'],

      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',

      'sort-class-members/sort-class-members': ['error', {
        order: [
          '[static-properties]',
          '[static-methods]',
          '[properties]',
          'constructor',
          { type: 'method', private: false },
          { type: 'method', private: true },
        ],
        accessorPairPositioning: 'getThenSet',
      }],
    },
  },
  {
    files: ['spec/**/*[sS]pec.js'],
    plugins: {
      jasmine,
    },
    languageOptions: {
      globals: {
        ...globals.jasmine,
      },
    },
    rules: {
      'jasmine/no-focused-tests': 'error',
      'jasmine/no-disabled-tests': 'warn',
    },
  },
];
