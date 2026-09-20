# Engine Plan: Reduce Codacy duplication in RouteRegister specs

Main plan: [plan.md](plan.md)

## Overview
Everything lives under `source/spec/`, which is the `engine` agent's scope. Add one helper, `RouteRegisterUtils`, and shrink the three spec files to a few lines each.

## Context
Codacy reports 18% duplication (goal: 10%). The three `RouteRegister*_spec.js` files under `source/spec/lib/server/` are the most duplicated files (145 clones). Findings from reading them:

- The `beforeEach`/`afterEach` header is identical in all three files except for the router stub (`{ get, patch }` in the main and patch specs, `{ get, post }` in the post spec).
- Every scenario repeats the same 8-line block: build a `handler` spy, a `req`, a `res` (with `status().json` spies), call `register.register*()`, pull the callback from `router.<method>.calls.mostRecent().args[1]`, invoke it.
- GET (`RouteRegister#register`) is synchronous, so its specs make the handler fail with `and.throwError(...)` and call the callback without `await`. PATCH/POST are async, so their specs use `and.rejectWith(...)` and `await` the callback. The helper must keep that difference in how the handler is built (a rejected promise is not caught by the synchronous GET route); awaiting a synchronous callback is harmless, so the invoke helper always `await`s.
- Current coverage is uneven per verb: GET covers status, body and debug log for Forbidden, NotFound and unexpected error but has no ConflictError scenario in the part of the file read; PATCH covers status, body and log for ConflictError but only status for the other errors; POST covers status for Conflict/NotFound/unexpected and status + body for Forbidden. `RouteRegister#handleError` is shared by all three verbs, so a full set of scenarios per verb is valid for all of them.
- Precedent for a spec helper that installs hooks: `ResourceActionUtils.setup()` in `source/spec/support/utils/ResourceActionUtils.js`.

## Steps

- [01 — Create the RouteRegisterUtils helper](engine/01-create-route-register-utils.md)
- [02 — Refactor the three RouteRegister specs](engine/02-refactor-route-register-specs.md)
- [03 — Verify specs, lint and duplication](engine/03-verify.md)

## CI Checks
- `source`: `cd source && npm run coverage` (CI job: `jasmine`)
- `source`: `cd source && npm run lint` (CI job: `jasmine`, via `lint-and-report`)

## Notes
- The shared example runs the same full scenario set (status, body, debug log for each of ConflictError, ForbiddenError, NotFoundError, unexpected error, plus route registration, handler call and success log) for every verb. This is a superset of what exists today, so no assertion is dropped, but a few scenarios are new for some verbs (see Context). List them in the PR description so they are not "silently added".
- Prefer readability over maximal de-duplication: if a scenario table makes a failing spec's name unclear, keep the `describe`/`it` names identical to today's (e.g. `when the handler throws a ForbiddenError` / `responds with 403`).
- Three near-identical 10-line files can themselves be flagged by jscpd; if `npm run report` still shows a clone between them, differentiate them through the verb config literal rather than by adding abstractions.
- No Codacy-run is possible locally, so use `cd source && npm run report` (jscpd, output under `source/report/jscpd`) as a proxy and compare before/after for the three files.
