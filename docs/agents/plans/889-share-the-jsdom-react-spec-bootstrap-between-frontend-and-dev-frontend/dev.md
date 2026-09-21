# Dev Plan: Share the jsdom/React spec bootstrap between frontend and dev/frontend

Main plan: [plan.md](plan.md)

## Shared contracts

Relies on `spec-support/` (`navi-spec-support`) existing with the exports listed in [plan.md](plan.md#shared-contracts): `dom.js` (`useContainer`, `renderInAct`, `navigator`/`location` globals), `loader.js`, `transform_hooks.js`, `async.js` (`flushAsync`, `flushMany`) and `noop.js` (default `noop`). The `dev` agent consumes them and does not own them.

## Steps

- [01 — Depend on navi-spec-support and rewire the test scripts](dev/01-depend-on-spec-support.md)
- [02 — Migrate noop imports and remove the duplicated support files](dev/02-migrate-noop-and-remove-duplicates.md)
- [03 — Adopt useContainer and the shared flushAsync in the page specs](dev/03-adopt-shared-helpers-in-specs.md)

## CI Checks
- `dev/frontend`: `yarn install && yarn coverage` (CI job: `jasmine-dev-frontend`)
- `dev/frontend`: `yarn lint` (CI job: `checks-dev-frontend`)

## Notes
- After pulling, developers need a one-time `yarn install` in `dev/frontend/` (in Docker, inside `navi_dev_frontend` with the new mount).
- Broader Codacy-driven rewrites of the dev page and client specs stay in #887; this plan only swaps in the shared helpers.
