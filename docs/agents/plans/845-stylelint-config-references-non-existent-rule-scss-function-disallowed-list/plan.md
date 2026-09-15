# Plan: stylelint config references non-existent rule scss_function-disallowed-list

Issue: [845-stylelint-config-references-non-existent-rule-scss-function-disallowed-list.md](../../issues/845-stylelint-config-references-non-existent-rule-scss-function-disallowed-list.md)

## Overview

Codacy generates its Stylelint config dynamically from dashboard patterns because this repo has no local Stylelint config file at all. One of those patterns, `Stylelint_scss_function-disallowed-list`, gets mismapped to a literal `scss_function-disallowed-list` rule name instead of the real `scss/function-disallowed-list`, so real Stylelint rejects it as unknown across 5 real CSS files (the 6th flagged file is a `source/spec/` fixture already excluded via `.codacy.yaml` and is out of scope here).

The fix is to give the repo its own Stylelint config so Codacy detects it and defers to it instead of generating one from dashboard patterns. `architect` creates a single shared, intentionally empty root-level `.stylelintrc.json` (no `extends`, no rules) as a prerequisite — this repo has no SCSS anywhere and no one has ever defined which functions should be banned, so the config exists purely to make Codacy stop dynamically generating its own (buggy) config. `frontend`, `dev`, and `guide` then each wire their own package to run `stylelint` against that shared file.

## Agents involved

- [frontend](frontend.md)
- [dev](dev.md)
- [guide](guide.md)

## Shared contracts

`architect` creates `.stylelintrc.json` at the repo root, directly (not delegated), before any specialist's step runs:

```json
{}
```

Every involved package invokes Stylelint against this exact file via `--config <relative-path-to-root>/.stylelintrc.json` — it is not extended or copied per-package. Each package adds its own `stylelint` devDependency (no shared/root `node_modules`, per this repo's existing per-package tooling convention), and points its lint command at the root file by relative path:

- `frontend/` and `dev/frontend/` (one level below root): `--config ../.stylelintrc.json`
- `examples/navi-orders-extension/` (two levels below root): `--config ../../.stylelintrc.json`

Target glob in every package: `'src/**/*.css'`.
