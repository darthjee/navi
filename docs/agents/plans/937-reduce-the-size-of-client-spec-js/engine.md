# Engine Plan: Reduce the size of Client_spec.js

Main plan: [plan.md](plan.md)

## Overview
`source/spec/lib/client/Client_spec.js` (398 lines) is flagged WARN by the spec size check. It has three independent blocks:

- lines 26–200: `#perform` request behavior (status match, non-match, 5xx, timeout, headers, url params, redirects)
- lines 202–318: `#emit` (~117 lines)
- lines 320–397: `.fromObject` / `.fromListObject` (~78 lines)

Moving the last two blocks into their own files is enough to bring all three files under 300 lines. The remaining `Client_spec.js` then gets a light tidy-up of its repeated axios-config expectations.

## Context
- Sibling splits (#932–#936) name new files `<Subject>_<topic>_spec.js` (e.g. `EngineController_lifecycle_spec.js`, `ResourceRequestEmit_resolveBody_spec.js`), in the same folder as the original.
- The existing helpers already cover the setup: `ClientFactory.build({ baseUrl, headers, timeout })`, `ResourceRequestFactory.build({ url, status })`, `AxiosUtils.stubGet/stubPost/stubPut/stubPatch` (+ `*Rejection`), `LoggerUtils.stubLoggerMethods()`. No new shared support file is needed.

## Steps

- [01 — Extract the builders spec](engine/01-extract-builders-spec.md)
- [02 — Extract the #emit spec](engine/02-extract-emit-spec.md)
- [03 — Tidy the remaining request-behavior spec](engine/03-tidy-request-spec.md)

## CI Checks
- `source`: `yarn spec` (CI job: `jasmine`)
- `source`: `yarn lint` (CI job: `checks`)

## Notes
- Every `it` in the original file must still exist in exactly one of the three resulting files, with the same assertions. Compare the spec count from `yarn spec` before and after the change; the totals must match.
- Leave the pre-existing misnamed example `'throws RequestFailed when status does not match'` under "when request status is 404 but it is a match" as it is, or rename it to describe what it asserts (it resolves). Renaming is fine; changing the assertion is not.
- Only add a shared helper to `source/spec/support/` if a piece of setup is duplicated across the new files beyond a few lines. The expected split does not need one.
