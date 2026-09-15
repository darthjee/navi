# guide Plan: stylelint config references non-existent rule scss_function-disallowed-list

Main plan: [plan.md](plan.md)

## Shared contracts

Depends on `architect` having created the root `.stylelintrc.json` (empty `{}`, no rules). `examples/navi-orders-extension/` is two levels below root, so it references it as `../../.stylelintrc.json`.

## Implementation Steps

### Step 1 — Add stylelint and a lint script

This package has no existing `lint` script and isn't part of any CircleCI lint job today (only `smoke-extensions` / `test-extension-harness` run against it). Add `stylelint` as a devDependency and a standalone `lint` script; wiring it into CI is out of scope for this issue (see Notes).

## Files to Change

- `examples/navi-orders-extension/package.json` — add `"stylelint"` devDependency (latest `^16` line); add `"lint": "stylelint --config ../../.stylelintrc.json 'src/**/*.css'"`.

## Notes

- No CI job currently runs lint for this example project; this script is available to run locally but won't be exercised by CircleCI unless a follow-up issue adds that wiring — out of scope here.
- The flagged file in this package (`src/frontend/OrdersPage.css`) is plain CSS; the empty root config has no rules, so this step only makes Stylelint runnable (and passing) — it doesn't change any existing file.
