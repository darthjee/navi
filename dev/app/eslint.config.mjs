import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import jasmine from 'eslint-plugin-jasmine';
import globals from 'globals';

export default [
  {
    ignores: ['node_modules/**/*.js', 'report/**', 'coverage/**'],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    plugins: {
      'import': importPlugin,
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
