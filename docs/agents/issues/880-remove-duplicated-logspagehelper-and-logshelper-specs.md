# Remove duplicated LogsPageHelper and LogsHelper specs

## Context

Codacy reports 18% code duplication for the repository (the project goal is 10%). This issue tackles two helper specs that are effectively copies of each other. Figures come from Codacy's analysis of `main` at `f25bf98`.

| File | Lines | Clones | Duplicated lines |
| --- | ---: | ---: | ---: |
| `frontend/spec/components/LogsPageHelper_spec.js` | 88 | 11 | 200 |
| `frontend/spec/components/helpers/LogsHelper_spec.js` | 88 | 11 | 200 |

The two specs are identical apart from the class name and the import path: every line that differs is only the class-name reference (`LogsPageHelper` from `src/components/pages/helpers/` vs `LogsHelper` from `src/components/elements/helpers/`); both have 88 lines with 200 duplicated lines and 11 clones each.

## What needs to be done

Frontend:

- Confirm what is genuinely different between the two helpers. If the behaviour under test is shared, test it once (a shared example parameterised by the helper class) and keep only helper-specific cases in each file.
- If one helper is redundant, consolidating the source classes is a follow-up; out of scope unless trivial.
- `frontend/spec/support/` already hosts shared helpers (`dom.js` with `useContainer`, `fetch.js` with `mockFetchSuccess`/`mockFetchFailure`), so any new helper belongs there.
- Keep every existing assertion and scenario: the refactor must not reduce what the specs verify or change any production code.
- Prefer readability over maximal de-duplication; do not introduce abstractions that make a failing spec harder to read.

## Acceptance criteria

- [ ] Codacy reports markedly fewer duplication clones for `LogsPageHelper_spec.js` and `LogsHelper_spec.js`
- [ ] The affected specs still pass and still verify the same scenarios
- [ ] No production code is changed
- [ ] Shared spec logic (if any) lives in `frontend/spec/support/`
