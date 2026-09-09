// Baked flat config for the `navi-hey-test lint` convenience command.
//
// Deliberately lenient: it only surfaces parser/syntax errors over the mounted
// src/ + tests/. It is NOT a style gate — downstream projects bring their own
// eslint setup. CI never runs this command.

export default [
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs', '**/*.jsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
    rules: {},
  },
];
