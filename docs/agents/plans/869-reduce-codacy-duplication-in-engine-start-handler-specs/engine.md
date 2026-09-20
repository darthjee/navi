# Engine Plan: Reduce Codacy duplication in engine start handler specs

Main plan: [plan.md](plan.md)

## Overview
Everything lives under `source/spec/`, so the `engine` agent owns the whole change. Two new shared helpers go into `source/spec/support/utils/` (created by this issue, to be reused later by #870 for `ResourceEnqueuer_spec.js`), then both handler specs are refactored to use them. The twelve malformed-`targets` cases in `ApiEngineStartHandler_spec.js` are parameterised with a table-driven loop inside that spec.

## Context
- `ApiEngineStartHandler_spec.js` (Codacy: 36 clones / 241 duplicated lines) repeats: the 12 malformed-`targets` `it`s (same three lines, only the request body differs), the `Application.isStopped`/`isRunning` stub pairs, the `ResourceFactory` → `Namespace` → `NamespaceMap.build` fixture with a `reports.categories` resource (four `beforeEach`es), and the `res.json` `{ status: 'running', enqueued, skippedResources }` expectation (~10 times).
- `EngineStartHandler_spec.js` (5 clones / 32 duplicated lines) repeats the same `isStopped`/`isRunning` stub pairs and shares blocks with the API spec.
- Existing helpers in `source/spec/support/utils/` (`JobRegistryUtils`, `LoggerUtils`, `RouteRegisterUtils`) are static-method classes with a JSDoc block per method; `RouteRegisterUtils` already uses a scenario table — follow those idioms.
- Constraint from the issue: keep every existing assertion/scenario, prefer readability over maximal de-duplication, and change no production code.

## Steps

- [01 — Add ApplicationStateUtils](engine/01-add-application-state-utils.md)
- [02 — Add NamespaceMapUtils](engine/02-add-namespace-map-utils.md)
- [03 — Refactor EngineStartHandler_spec](engine/03-refactor-engine-start-handler-spec.md)
- [04 — Refactor ApiEngineStartHandler_spec](engine/04-refactor-api-engine-start-handler-spec.md)

## CI Checks
- `source`: `yarn lint` (CI job: `checks`)
- `source`: `yarn spec` / `yarn test` (CI job: `jasmine`)
- Optional local duplication check: `yarn report` in `source/` (runs `jscpd lib spec`); the final Codacy comparison is done manually by the maintainer after merge.

## Notes
- Helper names (`ApplicationStateUtils`, `NamespaceMapUtils`) are indicative; pick better names if the surrounding code suggests them, but keep them under `source/spec/support/utils/` with the `<Name>Utils.js` convention.
- Jasmine `spyOn` must run inside a spec/`beforeEach`, so the state helpers are plain functions that the caller invokes from its own `beforeEach` (not helpers that install their own hooks), unless a hook-installing shape (like `JobRegistryUtils.setup()`) reads better.
- Do not introduce a shared `it`-generating abstraction across the two files; the table-driven loop stays local to `ApiEngineStartHandler_spec.js`.
- Keep spec descriptions unchanged wherever possible so failing-test names in history stay searchable.
- #870 (ResourceEnqueuer spec duplication) should reuse these helpers rather than add its own; do not edit `ResourceEnqueuer_spec.js` here.
