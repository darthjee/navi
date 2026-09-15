# dev Plan: stylelint config references non-existent rule scss_function-disallowed-list

Main plan: [plan.md](plan.md)

## Shared contracts

Depends on `architect` having created the root `.stylelintrc.json` (empty `{}`, no rules). `dev/frontend/` is one level below root, so it references it as `../.stylelintrc.json`.

## Implementation Steps

### Step 1 — Add stylelint and wire it into the existing lint script

Add `stylelint` as a devDependency and fold it into the existing `lint` script (and its `lint_fix` counterpart) so the CircleCI `checks-dev-frontend` job — which already just runs `npm run lint` — picks it up with no CI config changes.

## Files to Change

- `dev/frontend/package.json` — add `"stylelint"` devDependency (latest `^16` line); change `"lint"` to `"eslint . && stylelint --config ../.stylelintrc.json 'src/**/*.css'"`; change `"lint_fix"` to `"eslint . --fix && stylelint --config ../.stylelintrc.json 'src/**/*.css' --fix"`.

## CI Checks

- `dev/frontend`: `npm run lint` (CI job: `checks-dev-frontend`)

## Notes

- The flagged file in this package (`dev/frontend/src/styles/main.css`) is plain CSS; the empty root config has no rules, so this step only makes Stylelint run (and pass) — it doesn't change any existing file.
