# Issue: stylelint config references non-existent rule scss_function-disallowed-list

## Description

Codacy/Stylelint flags an **unknown rule name** in its Stylelint analysis, repeated across 6 CSS files in this repo:

```
Unknown rule scss_function-disallowed-list. Did you mean function-disallowed-list?
```

- `frontend/src/components/elements/MenuDropdown.css:1`
- `frontend/src/components/pages/LogsPage.css:1`
- `frontend/src/components/pages/MemoryStatus.css:1`
- `dev/frontend/src/styles/main.css:1`
- `examples/navi-orders-extension/src/frontend/OrdersPage.css:1`
- `source/spec/support/fixtures/extensions/frontend-ok/frontend/b.css:1`

_Found via Codacy/Stylelint (pattern `Stylelint_scss_function-disallowed-list`)._

## Problem

The repo has **no local Stylelint configuration** at all — no `.stylelintrc*` file and no `stylelint` key in any `package.json`. Codacy confirms this: its Stylelint tool integration for this repo reports `hasConfigurationFile: false` / `usesConfigurationFile: false`, meaning Codacy generates the effective Stylelint config on the fly from patterns enabled in the Codacy dashboard, rather than from anything checked into this repository.

Two related patterns are enabled on Codacy for this repo:
- `Stylelint_function-disallowed-list` — the core Stylelint rule `function-disallowed-list`.
- `Stylelint_scss_function-disallowed-list` — meant to be the `stylelint-scss` plugin's SCSS-function variant.

The real `stylelint-scss` plugin namespaces its rules with a slash, e.g. `scss/function-disallowed-list`, not an underscore. Codacy's pattern id uses an underscore (`Stylelint_scss_function-disallowed-list`), and when it generates the actual Stylelint config it appears to pass the raw suffix `scss_function-disallowed-list` through as a literal rule name instead of translating it to `scss/function-disallowed-list`. That mismatch is what real Stylelint rejects as "Unknown rule."

Two things make this pattern a poor fit for this repo regardless of the naming bug:
- Neither pattern currently has any functions actually configured to disallow (both default to `null`), so this rule pairing isn't restricting anything today.
- All 5 real (non-fixture) flagged files are plain `.css`, not `.scss` — this repo doesn't use SCSS anywhere, so the SCSS-specific variant of the rule is not applicable here in the first place.

The 6th flagged file, `source/spec/support/fixtures/extensions/frontend-ok/frontend/b.css`, is a test fixture already covered by the `source/spec/` exclusion in `.codacy.yaml` (added months before this issue was filed) — it's out of scope here and expected to clear on Codacy's next scan.

## Solution

Add a single shared root-level Stylelint config (`.stylelintrc.json` at the repo root) rather than per-package configs — this repo has no other precedent for a shared root lint config (every other lint tool, e.g. ESLint, is configured per-package), but a shared config was chosen deliberately here since the CSS conventions are simple and identical across packages. Introducing and owning this root-level file is `architect`'s responsibility, per this repo's convention that root-level, cross-cutting artifacts belong to `architect` rather than any single specialist.

The new config:
- Does **not** enable `function-disallowed-list` or `scss/function-disallowed-list` — no one has ever defined which functions should be banned, and this repo has no SCSS files, so neither rule is applicable. This preserves today's actual (no-op) behavior, just without the bogus rule-name error.
- Provides a sensible baseline for the repo's plain CSS (e.g. `stylelint-config-standard`).

Because Codacy detects and defers to a repository's own Stylelint config file when one is present (switching `hasConfigurationFile`/`usesConfigurationFile` to `true`), adding this file causes Codacy to lint against our real, repo-controlled config instead of dynamically generating one from dashboard patterns — which is what actually sidesteps the `scss_function-disallowed-list` pattern-to-rule-name bug, rather than working around it.

Each package with real product CSS also needs wiring to actually run Stylelint against the shared root config, owned by that package's own specialist agent:
- `frontend/` — `frontend` agent: add `stylelint` devDependency + a lint script referencing the root config.
- `dev/frontend/` — `dev` agent: same.
- `examples/navi-orders-extension/` — `guide` agent: same.

`source/spec/support/fixtures/extensions/frontend-ok/frontend/b.css` is explicitly out of scope (see Problem).

## Benefits

- Removes the recurring "Unknown rule scss_function-disallowed-list" Stylelint warning across the repo.
- Replaces Codacy's dynamically generated (and currently buggy) dashboard pattern config with a real, repo-controlled Stylelint config.
- Gives the team an actual place to define CSS function restrictions later, if that need ever arises.
