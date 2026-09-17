import js from '@eslint/js';
import complexity from 'eslint-plugin-complexity';
import importPlugin from 'eslint-plugin-import';
import jasmine from 'eslint-plugin-jasmine';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

// Stub plugin registering `no-unsanitized/method` as a *known* (but unimplemented
// and disabled) rule id. This repo does not use eslint-plugin-no-unsanitized, but
// `src/extensions/loadExtensions.js` carries an
// `// eslint-disable-next-line no-unsanitized/method` comment aimed at Codacy's
// own ESLint-based scan (which does load that plugin and flags the dynamic
// `import()` there). Without this stub, ESLint's flat config treats a disable
// comment referencing an unregistered rule as a hard configuration error. With
// it registered (but never enabled), the comment is simply reported as an
// unused disable directive (a warning, not an error) for this repo's own lint.
const noUnsanitizedStub = {
  rules: {
    method: { create: () => ({}) },
  },
};

// Stub plugin registering `security/detect-non-literal-fs-filename` as a
// *known* (but unimplemented and disabled) rule id. This repo does not use
// eslint-plugin-security, but `spec/index_html_importmap_spec.js` carries an
// `// eslint-disable-next-line security/detect-non-literal-fs-filename`
// comment aimed at Codacy's own ESLint-based scan (which does load that
// plugin and flags the non-literal `readFileSync()` path there). Without
// this stub, ESLint's flat config treats a disable comment referencing an
// unregistered rule as a hard configuration error. With it registered (but
// never enabled), the comment is simply reported as an unused disable
// directive (a warning, not an error) for this repo's own lint.
const securityStub = {
  rules: {
    'detect-non-literal-fs-filename': { create: () => ({}) },
  },
};

// Stub plugin registering `@typescript-eslint/no-empty-function` as a *known*
// (but unimplemented and disabled) rule id. This repo does not use
// @typescript-eslint, but `src/utils/noop.js` carries an
// `// eslint-disable-next-line @typescript-eslint/no-empty-function` comment
// aimed at Codacy's own ESLint-based scan (which does load that plugin and
// flags the intentionally empty arrow function there). Without this stub,
// ESLint's flat config treats a disable comment referencing an unregistered
// rule as a hard configuration error. With it registered (but never
// enabled), the comment is simply reported as an unused disable directive
// (a warning, not an error) for this repo's own lint.
const typescriptEslintStub = {
  rules: {
    'no-empty-function': { create: () => ({}) },
  },
};

export default [
  {
    ignores: ['node_modules/**/*.js', 'dist/**/*.js', 'report/**'],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,mjs}'],
    plugins: {
      complexity,
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'import': importPlugin,
      'no-unsanitized': noUnsanitizedStub,
      security: securityStub,
      '@typescript-eslint': typescriptEslintStub,
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

      // Class member ordering: public methods must be declared before private methods
      'no-restricted-syntax': ['error', {
        selector: 'ClassBody > MethodDefinition[key.type="PrivateIdentifier"] ~ MethodDefinition:not([key.type="PrivateIdentifier"])',
        message: 'Public methods must be declared before private methods.',
      }],

      // React rules
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'react/prop-types': 'off', // Disabled - project doesn't use PropTypes
      'react/react-in-jsx-scope': 'off', // React 17+ doesn't need this

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // React Refresh rules
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
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
