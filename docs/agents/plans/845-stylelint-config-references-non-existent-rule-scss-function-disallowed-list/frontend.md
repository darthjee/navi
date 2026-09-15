# frontend Plan: stylelint config references non-existent rule scss_function-disallowed-list

Main plan: [plan.md](plan.md)

## Shared contracts

Depends on `architect` having created the root `.stylelintrc.json` (empty `{}`, no rules). This package is one level below root, so it references it as `../.stylelintrc.json`.

## Implementation Steps

### Step 1 — Add stylelint and wire it into the existing lint script

Add `stylelint` as a devDependency and fold it into the existing `lint` script (and its `lint_fix` counterpart) so the CircleCI `checks-frontend` job — which already just runs `npm run lint` — picks it up with no CI config changes.

## Files to Change

- `frontend/package.json` — add `"stylelint"` devDependency (latest `^16` line); change `"lint"` to `"eslint . && stylelint --config ../.stylelintrc.json 'src/**/*.css'"`; change `"lint_fix"` to `"eslint . --fix && stylelint --config ../.stylelintrc.json 'src/**/*.css' --fix"`.

## CI Checks

- `frontend`: `npm run lint` (CI job: `checks-frontend`)

## Notes

- The two flagged files in this package (`MenuDropdown.css`, `LogsPage.css`, `MemoryStatus.css`) are plain CSS; the empty root config has no rules, so this step only makes Stylelint run (and pass) — it doesn't change any existing file.
