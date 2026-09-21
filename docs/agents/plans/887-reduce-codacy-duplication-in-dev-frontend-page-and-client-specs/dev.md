# Dev Plan: Reduce Codacy duplication in dev frontend page and client specs

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes `navi-spec-support/fetch.js` as specified in [plan.md](plan.md#shared-contracts) (`stubFetchSuccess`, `mockFetchSuccess`, `mockFetchFailure`, `mockFetchPending`, `paginationHeaders`). Requires the `spec-support` steps to be done and `yarn install` re-run in `dev/frontend/` so the new file is present in `node_modules/navi-spec-support`. Produces only spec-side helpers under `dev/frontend/spec/support/`; no contract leaves `dev/`.

## Steps

- [01 — Add the router render helper](dev/01-add-router-render-helper.md)
- [02 — Add the shared page scenarios](dev/02-add-shared-page-scenarios.md)
- [03 — Refactor the page specs](dev/03-refactor-page-specs.md)
- [04 — Table-drive the client specs](dev/04-table-drive-client-specs.md)

## CI Checks
- `dev/frontend`: `docker compose run --rm navi_dev_frontend bash -c "yarn install && yarn coverage && yarn lint && yarn report"` (CI jobs: `jasmine-dev-frontend`, `checks-dev-frontend`)

## Notes
- Only `dev/frontend/spec/**` changes; `dev/frontend/src/**` and every production file stay untouched.
- Do not copy `useContainer`, `renderInAct`, `flushAsync` or `noop` into `dev/frontend`: import them from `navi-spec-support`.
- Keep every `describe`/`it` name and assertion; failing-spec output must stay as readable as today. Prefer a slightly longer explicit spec over an abstraction that hides what is being asserted.
- Helpers in `dev/frontend/spec/support/` are not listed in the Jasmine `spec_files` glob (`**/*[sS]pec.js`) but are picked up by `spec/**/*.js` in the `test`/`coverage` scripts; they must only define functions (no top-level `describe`/`it`) so they do not register anything by themselves. Check that `yarn lint` (jasmine and import rules) is happy with them.
- Success criterion: the six files in the issue table drop markedly in Codacy clones after merge (the Codacy analysis runs on `main`; locally, `yarn report` (jscpd) is the proxy).
