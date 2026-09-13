import js from '@eslint/js';
import complexity from 'eslint-plugin-complexity';
import importPlugin from 'eslint-plugin-import';
import jasmine from 'eslint-plugin-jasmine';
import jsdoc from 'eslint-plugin-jsdoc';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import sortClassMembers from 'eslint-plugin-sort-class-members';
import globals from 'globals';

// Stub plugin registering `security/detect-non-literal-fs-filename` as a
// *known* (but unimplemented and disabled) rule id. This package does not
// use eslint-plugin-security, but
// `spec/support/utils/FixturesUtils.js` carries an
// `// eslint-disable-next-line security/detect-non-literal-fs-filename`
// comment aimed at Codacy's own ESLint-based scan (which does load that
// plugin and flags the non-literal `readFileSync()` path there). Without
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
    ignores: ['node_modules/**/*.js', 'dist/**/*.js', 'report/**', 'docs/**'],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,mjs}'],
    plugins: {
      complexity,
      react,
      'react-hooks': reactHooks,
      jsdoc,
      'import': importPlugin,
      'sort-class-members': sortClassMembers,
      security: securityStub,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
      // recommended by eslint-plugin-import
      'import/resolver': {
        node: { extensions: ['.js', '.mjs', '.jsx'] },
      },
    },
    rules: {
      // Ensure import statements are alphabetized and grouped
      'import/order': ['error', {
        alphabetize: { order: 'asc', caseInsensitive: true },
        'newlines-between': 'never',
        groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
      }],

      'no-trailing-spaces': ['error', { skipBlankLines: false, ignoreComments: false }],
      'no-multi-spaces': ['error', { ignoreEOLComments: true }],


      // Complexity rules
      complexity: ['warn', { max: 10 }],
      'max-lines': ['warn', { max: 300 }],
      'max-depth': ['warn', { max: 4 }],

      // Code style
      indent: ['error', 2, { SwitchCase: 1 }],
      'linebreak-style': ['error', 'unix'],
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'always'],

      // Best practices
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

      // React rules
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'react/prop-types': 'off', // Disabled - project doesn't use PropTypes
      'react/react-in-jsx-scope': 'off', // React 17+ doesn't need this

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // JSDoc rules
      'jsdoc/check-alignment': 'warn',
      'jsdoc/check-param-names': 'error',
      'jsdoc/check-tag-names': 'error',
      'jsdoc/check-types': 'warn',
      'jsdoc/require-param-description': 'warn',
      'jsdoc/require-returns-description': 'warn',
    },
  },
  // Jasmine spec files configuration
  {
    files: ['spec/**/*_spec.js', 'spec/**/*[sS]pec.js', 'spec/support/**/*.js'],
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